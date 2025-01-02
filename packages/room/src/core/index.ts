import type { Callback, Room as SocketRoomType } from '@superviz/socket-client';
import { Subject, Subscription } from 'rxjs';

import { Logger } from '../common/utils/logger';
import { IOC } from '../services/io';
import { IOCState } from '../services/io/types';

import { RoomEventsArg, RoomParams } from './types';

export class Room {
  private participant: RoomParams['participant'];
  private io: IOC;
  private logger: Logger;
  private room: SocketRoomType;
  private subscriptions: Map<Callback<unknown>, Subscription> = new Map();
  private observers: Map<string, Subject<unknown>> = new Map();

  constructor(params: RoomParams) {
    this.io = new IOC(params.participant);
    this.participant = params.participant;
    this.logger = new Logger('@superviz/room/room');

    this.logger.log('room created', this.participant);
    this.init();
  }

  /**
   * @description leave the room, destroy the socket connnection and all attached components
   */
  public leave() {
    this.unsubscribeFromRoomEvents();

    this.room.disconnect();
    this.io.destroy();
  }

  /**
   * @description Listen to an event
   * @param event - The event to listen to
   * @param callback - The callback to execute when the event is emitted
   * @returns {void}
   */
  public subscribe<T>(event: RoomEventsArg, callback: Callback<T>): void {
    this.logger.log('room @ subscribe', event);

    let subject = this.observers.get(event);

    if (!subject) {
      subject = new Subject<T>();
      this.observers.set(event, subject);
    }

    this.subscriptions.set(callback, subject.subscribe(callback));
  }

  /**
   * @description Stop listening to an event
   * @param event - The event to stop listening to
   * @param callback - The callback to remove from the event
   * @returns {void}
   */
  public unsubscribe<T>(event: string, callback?: Callback<T>): void {
    this.logger.log('room @ unsubscribe', event);

    if (!callback) {
      this.observers.delete(event);
      return;
    }

    this.subscriptions.get(callback)?.unsubscribe();
  }

  /**
   * @description Initializes the room features
   */
  private init() {
    this.io.stateSubject.subscribe(this.onConnectionStateChange);
    this.room = this.io.createRoom('room', 'unlimited');

    this.subscribeToRoomEvents();
  }

  private subscribeToRoomEvents() {
    this.room.presence.on('presence.joined-room', this.onParticipantJoinedRoom);
    this.room.presence.on('presence.leave', this.onParticipantLeavesRoom);
    this.room.presence.on('presence.update', this.onParticipantUpdates);
  }

  private unsubscribeFromRoomEvents() {
    this.room.presence.off('presence.joined-room');
    this.room.presence.off('presence.leave');
    this.room.presence.off('presence.update');
  }

  private emit<T = any>(event: string, data: T) {
    const subject = this.observers.get(event);

    if (!subject) return;

    subject.next(data);
  }

  /**
   *
   * Callbacks
   *
   */

  private onParticipantJoinedRoom = (data) => {
    console.log('room joined', data);
  };

  private onParticipantLeavesRoom = (data) => {
    console.log('room left', data);
  };

  private onParticipantUpdates = (data) => {
    console.log('room update', data);
  };

  /**
   * @description Handles changes in the connection state.
   *
   * @param {IOCState} state - The current state of the connection.
   */
  private onConnectionStateChange = (state: IOCState): void => {
    this.logger.log('connection state changed', state);
  };
}
