import * as Socket from '@superviz/socket-client';

import {
  RealtimeChannelEvent,
  RealtimeChannelState,
  RealtimeData,
  RealtimeMessage,
  RealtimePublish,
  RealtimeChannelSubscribe,
  Callback,
} from '../../component/types';
import { Participant } from '../../types/participant.types';
import { Logger, Observable, Observer } from '../../utils';
import { IOC } from '../io';
import { RealtimePresence } from '../presence';

export class Channel extends Observable {
  private name: string;
  private ioc: IOC;
  private channel: Socket.Room;
  protected logger: Logger;
  private state: RealtimeChannelState = RealtimeChannelState.DISCONNECTED;
  private declare localParticipant: Participant;
  private callbacksToSubscribeWhenJoined: Array<{
    event: string;
    callback: (data: unknown) => void;
  }> = [];

  public participant: RealtimePresence;

  constructor(
    name: string,
    ioc: IOC,
    localParticipant: Participant,
    connectionLimit: number | 'unlimited',
  ) {
    super();

    this.name = name;
    this.ioc = ioc;
    this.logger = new Logger('@superviz/realtime-channel');
    this.channel = this.ioc.createRoom(`realtime:${this.name}`, connectionLimit);
    this.localParticipant = localParticipant;

    this.subscribeToRealtimeEvents();
    this.logger.log('started');
    this.participant = new RealtimePresence(this.channel);
  }

  public async disconnect(): Promise<void> {
    if (this.state === RealtimeChannelState.DISCONNECTED) {
      this.logger.log('Realtime channel is already disconnected');
      return;
    }

    this.logger.log('destroyed');
    this.changeState(RealtimeChannelState.DISCONNECTED);
    this.observers = {};
    this.channel.disconnect();
  }

  /**
   * @function publish
   * @description Publishes an event with data to the channel.
   * @param event - The name of the event to publish.
   * @param data - Data to be sent along with the event.
   */
  public publish: RealtimePublish = (event: string, data): void => {
    if (this.state !== RealtimeChannelState.CONNECTED) {
      const message = `Realtime channel ${this.name} has not started yet. You can't publish event ${event} before start`;
      this.logger.log(message);
      console.warn(`[SuperViz] ${message}`);
      return;
    }

    this.channel.emit(`message:${this.name}`, { name: event, payload: data });
  }

  /**
   * @function subscribe
   * @description Subscribes to a specific event and registers a callback function to handle the received data.
   *  If the channel is not yet available, the subscription will be queued and executed once the channel is joined.
   * @param event - The name of the event to subscribe to.
   * @param callback - The callback function to handle the received data. It takes a parameter of type `RealtimeMessage` or `string`.
   */
  public subscribe: RealtimeChannelSubscribe = <T = unknown>(
    event: string,
    callback: Callback<T>,
  ): void => {
    if (this.state !== RealtimeChannelState.CONNECTED) {
      this.callbacksToSubscribeWhenJoined.push({ event, callback });
      return;
    }

    if (!this.observers[event]) {
      this.observers[event] = new Observer();
    }

    this.observers[event].subscribe(callback);
  };

  /**
   * @function unsubscribe
   * @description Unsubscribes from a specific event.
   * @param event - The event to unsubscribe from.
   * @param callback - An optional callback function to be called when the event is unsubscribed.
   */
  public unsubscribe: RealtimeChannelSubscribe = <T = unknown>(
    event: string,
    callback?: Callback<T>,
  ): void => {
    if (!callback) {
      this.observers[event]?.reset();
      return;
    }

    this.observers[event]?.unsubscribe(callback);
  };

  /**
   * @function changeState
   * @description change realtime component state and publish state to client
   * @param state
   * @returns {void}
   */
  private changeState(state: RealtimeChannelState): void {
    this.logger.log('realtime component @ changeState - state changed', state);
    this.state = state;

    this.publishEventToClient<RealtimeChannelState>(
      RealtimeChannelEvent.REALTIME_CHANNEL_STATE_CHANGED,
      this.state,
    );
  }

  private subscribeToRealtimeEvents(): void {
    this.channel.presence.on(Socket.PresenceEvents.JOINED_ROOM, (event) => {
      if (event.id !== this.localParticipant.id) return;

      this.changeState(RealtimeChannelState.CONNECTED);

      this.callbacksToSubscribeWhenJoined.forEach(({ event, callback }) => {
        this.subscribe(event, callback);
      });

      this.logger.log('joined room');
      // publishing again to make sure all clients know that we are connected
      this.changeState(RealtimeChannelState.CONNECTED);
    });

    this.channel.on<RealtimeData>(`message:${this.name}`, (event) => {
      this.logger.log('message received', event);
      this.publishEventToClient<RealtimeMessage>(event.data.name, {
        data: event.data.payload,
        participantId: event?.presence?.id ?? null,
        name: event.data.name,
        timestamp: event.timestamp,
        connectionId: event.connectionId,
      });
    });
  }

  /**
   * @function fetchHistory
   * @description get realtime client data history
   * @returns {RealtimeMessage | Record<string, RealtimeMessage>}
   */
  public fetchHistory = async (
    eventName?: string,
  ): Promise<RealtimeMessage[] | Record<string, RealtimeMessage[]> | null> => {
    if (this.state !== RealtimeChannelState.CONNECTED) {
      const message =
        "Realtime component has not started yet. You can't retrieve history before start";

      this.logger.log(message);
      console.warn(`[SuperViz] ${message}`);
      return null;
    }

    const history: RealtimeMessage[] | Record<string, RealtimeMessage[]> = await new Promise(
      (resolve, reject) => {
        const next = (data: Socket.RoomHistory) => {
          if (!data.events?.length) {
            resolve(null);
          }

          const groupMessages = data.events.reduce(
            (group: Record<string, RealtimeMessage[]>, event: Socket.SocketEvent<RealtimeData>) => {
              if (!group[event.data.name]) {
                // eslint-disable-next-line no-param-reassign
                group[event.data.name] = [];
              }

              group[event.data.name].push({
                data: event.data.payload,
                connectionId: event.connectionId,
                name: event.data.name,
                participantId: event.presence?.id,
                timestamp: event.timestamp,
              } as RealtimeMessage);

              return group;
            },
            {},
          );

          if (eventName && !groupMessages[eventName]) {
            reject(new Error(`Event ${eventName} not found in the history`));
          }

          if (eventName) {
            resolve(groupMessages[eventName]);
          }

          resolve(groupMessages);
        };

        this.channel.history(next);
      },
    );

    return history;
  };

  /**
   * @function publishEventToClient
   * @description - publish event to client
   * @param event - event name
   * @param data - data to publish
   * @returns {void}
   */
  private publishEventToClient = <T = unknown>(event: string, data?: T): void => {
    this.logger.log('realtime channel @ publishEventToClient', { event, data });

    this.observers[event]?.publish(data);
  };
}
