import { ComponentLifeCycleEvent } from '../../common/types/events.types';
import { Participant } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { useGlobalStore } from '../../services/stores';
import { BaseComponent } from '../base';
import { ComponentNames } from '../types';

import { Channel } from './channel';
import { RealtimePresence } from './presence';

import {
  Callback,
  RealtimeChannelEvent,
  RealtimeChannelState,
  RealtimeComponentEvent,
  RealtimeComponentState,
  RealtimeComponentSubscribe,
} from './types';

export class Realtime extends BaseComponent {
  private channel: Channel;

  protected logger: Logger;
  public name: ComponentNames;
  private declare localParticipant: Participant;
  private state: RealtimeComponentState = RealtimeComponentState.STOPPED;
  private channels: Map<string, Channel> = new Map();
  private callbacksToSubscribeWhenJoined: Array<{
    event: string;
    callback: (data: unknown) => void;
  }> = [];
  public participant: RealtimePresence;

  constructor() {
    super();

    this.name = ComponentNames.REALTIME;
    this.logger = new Logger('@superviz/sdk/realtime-component');
    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.subscribe();
  }

  /**
   * @function connect
   * @description - connect to a channel
   * @param name - channel name
   * @returns {Channel}
   */
  public connect(name: string): Promise<Channel> {
    if (!this.channel) {
      return new Promise<Channel>((resolve) => {
        const { localParticipant } = useGlobalStore();

        localParticipant.subscribe('connect-after-init', (participant) => {
          if (!participant.activeComponents.includes(ComponentNames.REALTIME)) return;

          localParticipant.unsubscribe('connect-after-init');
          resolve(this.connect(name));
        });
      });
    }

    let channel: Channel = this.channels.get(name);
    if (channel) return channel as unknown as Promise<Channel>;

    channel = new Channel(name, this.ioc, this.localParticipant, this.connectionLimit);
    this.channels.set(name, channel);

    if (this.state === RealtimeComponentState.STARTED) {
      return channel as unknown as Promise<Channel>;
    }

    return new Promise((resolve) => {
      this.subscribe(RealtimeComponentEvent.REALTIME_STATE_CHANGED, (state) => {
        if (state !== RealtimeComponentState.STARTED) return;
        resolve(channel);
      });
    });
  }

  /**
   * @function subscribe
   * @description Subscribes to a specific event and registers a callback function to handle the received data.
   *  If the channel is not yet available, the subscription will be queued and executed once the channel is joined.
   * @param event - The name of the event to subscribe to.
   * @param callback - The callback function to handle the received data. It takes a parameter of type `RealtimeMessage` or `string`.
   */
  public subscribe: RealtimeComponentSubscribe = <T = unknown>(
    event: string,
    callback: Callback<T>,
  ): void => {
    if (!this.channel) {
      this.callbacksToSubscribeWhenJoined.push({ event, callback });
      return;
    }

    this.channel.subscribe(event, callback);
  };

  /**
   * @function publish
   * @description Publishes an event with optional data to the channel.
   * @param event - The name of the event to publish.
   * @param data - Data to be sent along with the event.
   */
  public publish = <T = unknown>(event: string, data: T): void => {
    if (ComponentLifeCycleEvent[event.toUpperCase() as keyof typeof ComponentLifeCycleEvent]) {
      this.channel['publishEventToClient'](event, data);
      return;
    }

    this.channel?.publish(event, data);
  };

  /**
   * @function unsubscribe
   * @description Unsubscribes from a specific event.
   * @param event - The event to unsubscribe from.
   * @param callback - An optional callback function to be called when the event is unsubscribed.
   */
  public unsubscribe: RealtimeComponentSubscribe = <T = unknown>(
    event: string,
    callback?: Callback<T>,
  ): void => {
    this.channel?.unsubscribe(event, callback);
  };

  protected start(): void {
    this.logger.log('started');
    this.channel = new Channel('default', this.ioc, this.localParticipant, this.connectionLimit);

    this.channel.subscribe(RealtimeChannelEvent.REALTIME_CHANNEL_STATE_CHANGED, (state) => {
      if (state !== RealtimeChannelState.CONNECTED) return;

      this.callbacksToSubscribeWhenJoined.forEach(({ event, callback }) => {
        this.channel.subscribe(event, callback);
      });

      this.changeState(RealtimeComponentState.STARTED);
      this.callbacksToSubscribeWhenJoined = [];

      this.channel.unsubscribe(RealtimeChannelEvent.REALTIME_CHANNEL_STATE_CHANGED);
      this.participant = this.channel.participant;
      this.channels.set('default', this.channel);
    });
  }

  protected destroy(): void {
    this.logger.log('destroyed');
    this.changeState(RealtimeComponentState.STOPPED);
    this.disconnectFromAllChannels();
  }

  /**
   * @function disconnectToAllChannels
   * @description - disconnect to all channels
   * @returns {void}
   */
  private disconnectFromAllChannels(): void {
    this.channels.forEach((channel) => channel.disconnect());
  }

  /**
   * @function changeState
   * @description change realtime component state and publish state to client
   * @param state
   * @returns {void}
   */
  private changeState(state: RealtimeComponentState): void {
    this.logger.log('realtime component @ changeState - state changed', state);
    this.state = state;

    this.channel?.['publishEventToClient'](
      RealtimeComponentEvent.REALTIME_STATE_CHANGED,
      this.state,
    );
  }
}
