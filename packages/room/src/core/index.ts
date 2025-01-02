import type { Callback, Room as SocketRoomType } from '@superviz/socket-client';
import { Logger } from '../common/utils/logger';
import { IOC } from '../services/io';
import { IOCState } from '../services/io/types';

import { RoomEventsArg, RoomParams } from './types';

export class Room {
  private participant: RoomParams['participant'];
  private io: IOC;
  private logger: Logger;
  private room: SocketRoomType;

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
