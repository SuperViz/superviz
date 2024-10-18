import { Subject, Subscription } from 'rxjs';
import type { Socket } from 'socket.io-client';

import { ErrorCallback } from '../../common/types/callbacks.types';
import { InternalRoomEvents, RoomEvents, RoomEventsArg } from '../../common/types/event.types';
import { Presence } from '../../common/types/presence.types';
import { Logger } from '../../utils';
import { PresenceRoom } from '../presence';

import { Callback, SocketEvent, JoinRoomPayload, RoomHistory } from './types';

export class Room {
  private logger: Logger;
  private isJoined: boolean = false;
  private subscriptions: Map<Callback<unknown>, Subscription> = new Map();
  private observers: Map<string, Subject<unknown>> = new Map();

  public presence: PresenceRoom;

  constructor(
    private io: Socket,
    private user: Presence,
    private roomId: string,
    private apiKey: string,
    private maxConnections: number | 'unlimited' = 100,
  ) {
    this.logger = new Logger('@superviz/socket-client/room');

    const payload: JoinRoomPayload = {
      name: roomId,
      user,
      maxConnections,
    };

    this.presence = PresenceRoom.register(io, user, roomId);
    this.io.emit(RoomEvents.JOIN_ROOM, payload);
    this.subscribeToRoomEvents();
  }

  public static register(
    io: Socket,
    presence: Presence,
    roomId: string,
    apiKey: string,
    maxConnections: number | 'unlimited',
  ): Room {
    return new Room(io, presence, roomId, apiKey, maxConnections);
  }

  /**
   * @function on
   * @description Listen to an event
   * @param event - The event to listen to
   * @param callback - The callback to execute when the event is emitted
   * @returns {void}
   */
  public on<T>(event: RoomEventsArg, callback: Callback<T>): void {
    this.logger.log('room @ on', event);

    let subject = this.observers.get(event);

    if (!subject) {
      subject = new Subject<T>();
      this.observers.set(event, subject);

      this.io.on(event, (data: SocketEvent<T>) => {
        this.publishEventToClient(event, data);
      });
    }

    this.subscriptions.set(callback, subject.subscribe(callback));
  }

  /**
   * @function off
   * @description Stop listening to an event
   * @param event - The event to stop listening to
   * @param callback - The callback to remove from the event
   * @returns {void}
   */
  public off<T>(event: string, callback?: Callback<T>): void {
    this.logger.log('room @ off', event);

    if (!callback) {
      this.observers.delete(event);
      this.io.off(event);
      return;
    }

    this.subscriptions.get(callback)?.unsubscribe();
  }

  /**
   * @function emit
   * @description Emit an event
   * @param event - The event to emit
   * @param payload - The payload to send with the event
   * @returns {void}
   */
  public emit<T>(event: string, payload: T): void {
    if (!this.isJoined) {
      this.logger.log('Cannot emit event. Not joined to room');
      return;
    }

    const body: SocketEvent<T> = {
      name: event,
      roomId: this.roomId,
      presence: this.user,
      connectionId: this.io.id,
      data: payload,
      timestamp: Date.now(),
    };

    this.io.emit(RoomEvents.UPDATE, this.roomId, body);
    this.logger.log('room @ emit', event, payload);
  }

  /**
   * @function get
   * @description Get the presences in the room
   * @returns {void}
   */
  public history<T = unknown>(next: (data: RoomHistory<T>) => void, error?: ErrorCallback): void {
    const subject = new Subject<RoomHistory>();

    subject.subscribe({
      next,
      error,
    });

    const callback = (event: RoomHistory) => {
      this.logger.log('room @ history', event);
      this.io.off(InternalRoomEvents.GET, callback);
      subject.next(event);
      subject.complete();
      subject.unsubscribe();
    };

    this.io.on(InternalRoomEvents.GET, callback);
    this.io.emit(InternalRoomEvents.GET, this.roomId);
  }

  /**
   * @function disconnect
   * @description Disconnect from the room
   * @returns {void}
   */
  public disconnect(): void {
    this.logger.log('room @ disconnect', 'Leaving room...', this.roomId);
    this.io.emit(RoomEvents.LEAVE_ROOM, this.roomId);

    // unsubscribe from all events
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();
    this.observers.forEach((subject) => subject.unsubscribe());
    this.observers.clear();

    this.presence.destroy();
  }

  /**
   * @function publishEventToClient
   * @description Publish an event to the client
   * @param event - The event to publish
   * @param data - The data to publish
   * @returns {void}
   */
  private publishEventToClient(event: string, data: SocketEvent<unknown>): void {
    const subject = this.observers.get(event);

    if (!subject || data.roomId !== this.roomId) return;

    subject.next(data);
  }

  /*
   * @function subscribeToRoomEvents
   * @description Subscribe to room events
   * @returns {void}
   */
  private subscribeToRoomEvents(): void {
    this.io.on(RoomEvents.JOINED_ROOM, this.onJoinedRoom);
    this.io.on(RoomEvents.ERROR, (event: SocketEvent<string>) => {
      this.logger.log('Error:', event.data);
    });

    this.io.on(`http:${this.roomId}:${this.apiKey}`, this.onHttpEvent);
  }

  /**
   * @function onJoinedRoom
   * @description handles the event when a user joins a room.
   * @param event The socket event containing presence data.
   * @returns {void}
   */
  private onJoinedRoom = (event: SocketEvent<{ name: string }>): void => {
    if (this.roomId !== event?.data?.name) return;

    this.isJoined = true;
    this.io.emit(RoomEvents.JOINED_ROOM, this.roomId, event.data);
    this.logger.log('room @ joined', event);
  };

  private onHttpEvent = (event: SocketEvent<unknown>) => {
    this.publishEventToClient(event.name, event);
  };
}
