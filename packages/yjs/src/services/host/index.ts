import { PresenceEvent, Realtime, Room, SocketEvent } from '@superviz/socket-client';
import { createRoom } from '../../common/utils/createRoom';
import { config } from '../config';

type RoomEvent = {
  hostId: string;
};

export class HostService {
  private _isHost: boolean = false;
  private _hostId: string = '';
  private room: Room;
  private realtime: Realtime;

  constructor(private participantId: string) {
    const roomName = 'host-service:' + config.get('roomName');
    const { realtime, room } = createRoom(roomName);

    this.realtime = realtime;
    this.room = room;

    room.presence.on('presence.leave', this.onPresenceLeave);
    room.presence.on('presence.joined-room', this.onPresenceEnter);
    room.on('state', (event: SocketEvent<RoomEvent>) => {
      this.setHostId(event.data.hostId);
    });
  }

  public destroy() {
    this._isHost = false;
    this._hostId = '';

    this.room.disconnect();
    this.realtime.destroy();
  }

  /**
   * @function isHost
   * @description Check if the current participant is the host of the room
   * @returns {boolean}
   */
  public get isHost(): boolean {
    return this._isHost;
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
    this.room.history<RoomEvent>(({ events }) => {
      if (events.length === 0) {
        this.updateHost();
        return;
      }

      if (this._hostId) return;

      this.room.presence.get((participants) => {
        if (participants.length === 1 && participants[0].id === this.participantId) {
          this.setHostInRoom(participants[0].id);
          return;
        }

        const hostId = events[events.length - 1].data.hostId;

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

  /**
   * @function setHost
   * @description Set the host of the room
   * @param {string} hostId
   * @returns {void}
   */
  private setHostId(hostId: string): void {
    this._hostId = hostId;
    this._isHost = this.participantId === hostId;
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

  private setOldestAsHost = (data: PresenceEvent[]) => {
    const oldestParticipant = data.reduce((prev, current) => {
      return prev.timestamp < current.timestamp ? prev : current;
    }, data[0]);

    if (oldestParticipant.id === this.participantId) {
      this.setHostInRoom(oldestParticipant.id);
    } else {
      this.setHostId(oldestParticipant.id);
    }
  };

  private setHostInRoom(hostId: string) {
    this.room.emit('state', {
      hostId: hostId,
    });
  }

  // #region events callbacks
  private onPresenceLeave = (presence: PresenceEvent) => {
    if (presence.id === this.participantId) {
      this.destroy();
      return;
    }

    if (presence.id !== this.hostId) return;

    this._hostId = '';

    this.updateHost();
  };

  private onPresenceEnter = (presence: PresenceEvent) => {
    if (this.hostId || presence.id !== this.participantId) return;

    this.searchHost();
  };
}
