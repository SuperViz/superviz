import type { IOC } from '@superviz/sdk/dist/services/io';
import { PresenceEvent, Room, SocketEvent } from '@superviz/socket-client';

import { RoomEvent } from './types';

export class HostService {
  private _hostId: string = '';
  private room: Room;
  private callback: (hostId: string) => void;

  constructor(
    ioc: IOC,
    private participantId: string,
    callback: (hostId: string) => void,
  ) {
    const room = ioc.createRoom('yjs-host-service');

    this.room = room;
    this.callback = callback;

    room.presence.on('presence.leave', this.onPresenceLeave);
    room.presence.on('presence.joined-room', this.onPresenceEnter);
    room.on('state', this.onStateChange);
  }

  // #region public methods

  /**
   * @function destroy
   * @description Destroy the HostService instance. Make sure that no state is preserved,
   * and the room is disconnected.
   * @returns {void}
   */
  public destroy(): void {
    this._hostId = '';

    this.room.presence.off('presence.leave');
    this.room.presence.off('presence.joined-room');
    this.room.off('state', this.onStateChange);

    this.room.disconnect();
  }

  // #region getters

  /**
   * @function isHost
   * @description Tell whether the current participant is the host of the room or not
   * @returns {boolean}
   */
  public get isHost(): boolean {
    return this._hostId === this.participantId;
  }

  /**
   * @function hostId
   * @description Get the host's (the central source of truth of the room) id
   * @returns {boolean}
   */
  public get hostId(): string {
    return this._hostId;
  }

  /**
   * @function searchHost
   * @description Get room history and locate the host, if any. Otherwise, set a new host.
   * @returns {void}
   */
  private searchHost(): void {
    this.room.history<RoomEvent>(({ events }): void => {
      if (events.length === 0) {
        this.updateHost();
        return;
      }

      if (this._hostId) return;

      this.room.presence.get((participants): void => {
        if (participants.length === 1 && participants[0].id === this.participantId) {
          this.setHostInRoom(participants[0].id);
          return;
        }

        const { hostId } = events[events.length - 1].data;
        if (!hostId) {
          this.updateHost(participants);
          return;
        }

        if (!participants.find((participant) => participant.id === hostId)) {
          this.updateHost(participants);
          return;
        }

        this.setHostId(hostId);
      });
    });
  }

  // #region host logic
  /**
   * @function setHost
   * @description Set locally the id of the room's host
   * @param {string} hostId
   * @returns {void}
   */
  private setHostId(hostId: string): void {
    this._hostId = hostId;

    if (this.callback) {
      this.callback(hostId);
    }
  }

  /**
   * @function updateHost
   * @description Update the host of the room
   * @returns {void}
   */
  private updateHost(participants?: PresenceEvent[]): void {
    if (participants) {
      this.setOldestAsHost(participants);
      return;
    }

    this.room.presence.get(this.setOldestAsHost);
  }

  /**
   * @function setOldestAsHost
   * @description Traverse through participants list and set the oldest one as the host
   * If the oldest is the current participant, set it as the host in the room. Otherwise,
   * only set locally
   * @param data
   */
  private setOldestAsHost = (data: PresenceEvent[]): void => {
    const oldestParticipant = data.reduce((prev, current) => {
      return prev.timestamp < current.timestamp ? prev : current;
    }, data[0]);

    if (oldestParticipant.id === this.participantId) {
      this.setHostInRoom(oldestParticipant.id);
    } else {
      this.setHostId(oldestParticipant.id);
    }
  };

  /**
   * @function setHostInRoom
   * @description Propagate the host id to the room
   * @param {string} hostId
   * @returns {void}
   */
  private setHostInRoom(hostId: string): void {
    this.room.emit('state', {
      hostId,
    });
  }

  // #region events callbacks
  /**
   * @function onPresenceLeave
   * @description If the host leaves the room, update the host
   * @param {PresenceEvent} presence
   * @returns {void}
   */
  private onPresenceLeave = (presence: PresenceEvent): void => {
    if (presence.id !== this.hostId) return;

    this._hostId = '';

    this.updateHost();
  };

  /**
   * @function onPresenceEnter
   * @description When the current participant enters the room, search for the host
   * @param {PresenceEvent} presence
   * @returns {void}
   */
  private onPresenceEnter = (presence: PresenceEvent): void => {
    if (this.hostId || presence.id !== this.participantId) return;

    this.searchHost();
  };

  /**
   * @function onStateChange
   * @description When the state event comes from the room, update the host id
   * @param {SocketEvent<RoomEvent>} event
   * @returns {void}
   */
  private onStateChange = (event: SocketEvent<RoomEvent>): void => {
    if (event.data.hostId === this.hostId) return;
    this.setHostId(event.data.hostId);
  };
}
