import { Subject } from 'rxjs';
import type { Socket } from 'socket.io-client';

import { ErrorCallback } from '../../common/types/callbacks.types';
import {
  InternalPresenceEvents,
  PresenceEvents,
  PresenceEventsArg,
} from '../../common/types/event.types';
import type { Presence } from '../../common/types/presence.types';
import { Logger } from '../../utils';

import { PresenceCallback, PresenceEvent, PresenceEventFromServer } from './types';

export class PresenceRoom {
  private logger: Logger;
  private presences: Set<PresenceEvent> = new Set();
  private observers: Map<PresenceEventsArg, Subject<PresenceEvent>> = new Map();

  constructor(private io: Socket, private presence: Presence, private roomId: string) {
    this.logger = new Logger('@superviz/socket-client/presence');

    this.registerSubjects();
    this.subscribeToPresenceEvents();
  }

  public static register(io: Socket, presence: Presence, roomId: string) {
    return new PresenceRoom(io, presence, roomId);
  }

  /**
   * @function get
   * @description Get the presences in the room
   * @returns {void}
   */
  public get(next: (data: PresenceEvent[]) => void, error?: ErrorCallback): void {
    const subject = new Subject<PresenceEvent[]>();

    subject.subscribe({
      next,
      error,
    });

    const callback = (event: {
      presences: PresenceEventFromServer[];
      connectionId: string;
      timestamp: number;
      roomId: string;
    }) => {
      const presences = event.presences.map((presence) => ({
        connectionId: presence.connectionId,
        data: presence.data,
        id: presence.id,
        name: presence.name,
        timestamp: presence.timestamp,
      }));

      this.logger.log('presence room @ get', event);
      this.io.off(InternalPresenceEvents.GET, callback);
      subject.next(presences);
      subject.complete();
    };

    this.io.on(InternalPresenceEvents.GET, callback);
    this.io.emit(InternalPresenceEvents.GET, this.roomId);
  }

  /**
   * @function update
   * @description update the presence data in the room
   * @param payload - The data to update
   * @returns {void}
   */
  public update<T extends Object>(payload: T): void {
    const body: PresenceEvent<T> = {
      connectionId: this.io.id,
      data: payload,
      id: this.presence.id,
      name: this.presence.name,
      timestamp: Date.now(),
    };

    this.io.emit(PresenceEvents.UPDATE, this.roomId, body);
    this.logger.log('presence room @ update', this.roomId, body);
  }

  public destroy(): void {
    this.io.off(PresenceEvents.JOINED_ROOM, this.onPresenceJoin);
    this.io.off(PresenceEvents.LEAVE, this.onPresenceLeave);
    this.io.off(PresenceEvents.UPDATE, this.onPresenceUpdate);

    this.observers.forEach((observer) => observer.unsubscribe());
    this.observers.clear();
  }

  /**
   * @function registerSubjects
   * @description Register the subjects for the presence events
   * @returns {void}
   */
  private registerSubjects(): void {
    this.observers.set(PresenceEvents.JOINED_ROOM, new Subject());
    this.observers.set(PresenceEvents.LEAVE, new Subject());
    this.observers.set(PresenceEvents.UPDATE, new Subject());
  }

  /**
   * @function on
   * @description Listen to an event
   * @param event - The event to listen to
   * @param callback - The callback to execute when the event is emitted
   * @returns {void}
   */
  public on<T extends unknown>(
    event: PresenceEventsArg,
    callback: PresenceCallback<T>,
    error?: ErrorCallback,
  ): void {
    this.observers.get(event).subscribe({
      error,
      next: callback,
    });
  }

  /**
   * @function off
   * @description Stop listening to an event
   * @param event - The event to stop listening to
   * @param callback - The callback to remove from the event
   * @returns {void}
   */
  public off(event: PresenceEventsArg): void {
    this.observers.get(event).unsubscribe();
    this.observers.delete(event);
    this.observers.set(event, new Subject());
  }

  /**
   * @function subscribeToPresenceEvents
   * @description Subscribe to the presence events
   * @returns {void}
   */
  private subscribeToPresenceEvents(): void {
    this.io.on(PresenceEvents.JOINED_ROOM, this.onPresenceJoin);
    this.io.on(PresenceEvents.LEAVE, this.onPresenceLeave);
    this.io.on(PresenceEvents.UPDATE, this.onPresenceUpdate);
  }

  /**
   * @function onPresenceJoin
   * @description Handle the presence join event
   * @param event - The presence event
   * @returns {void}
   */
  private onPresenceJoin = (event: PresenceEventFromServer): void => {
    if (event?.roomId !== this.roomId) return;

    this.logger.log('presence room @ presence join', event);
    this.presences.add(event);
    this.observers.get(PresenceEvents.JOINED_ROOM).next({
      connectionId: event.connectionId,
      data: event.data,
      id: event.id,
      name: event.name,
      timestamp: event.timestamp,
    });
  };

  /**
   * @function onPresenceLeave
   * @description Handle the presence leave event
   * @param event - The presence event
   * @returns {void}
   */
  private onPresenceLeave = (event: PresenceEventFromServer): void => {
    if (event?.roomId !== this.roomId) return;

    this.logger.log('presence room @ presence leave', event);
    this.presences.delete(event);
    this.observers.get(PresenceEvents.LEAVE).next(event);
  };

  /**
   * @function onPresenceUpdate
   * @description Handle the presence update event
   * @param event - The presence event
   * @returns {void}
   */
  private onPresenceUpdate = (event: PresenceEventFromServer): void => {
    if (event?.roomId !== this.roomId) return;

    this.logger.log('presence room @ presence update', event);
    this.observers.get(PresenceEvents.UPDATE).next({
      connectionId: event.connectionId,
      data: event.data,
      id: event.id,
      name: event.name,
      roomId: event?.roomId,
      timestamp: event.timestamp,
    } as PresenceEvent);
  };
}
