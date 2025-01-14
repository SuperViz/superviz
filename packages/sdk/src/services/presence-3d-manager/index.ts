import { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';
import { throttle } from 'lodash';

import { Participant } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger, Observer } from '../../common/utils';
import { useStore } from '../../common/utils/use-store';

import { ParticipantDataInput, Presence3dEvents } from './types';

const SYNC_PROPERTY_INTERVAL = 1000;

export class Presence3DManager {
  private room: Room;
  private useStore: typeof useStore;
  public participants3DObservers: Observer[] = [];
  private localParticipant: Participant;
  private logger: Logger;

  constructor(room: Room, store: typeof useStore) {
    this.room = room;
    this.logger = new Logger('@superviz/sdk/presence3D-manager');
    this.useStore = store;

    this.subscribeToRoomEvents();

    const { localParticipant } = this.useStore(StoreType.GLOBAL);

    // have to set manually because useStore is binded to the 3d plugin that creates the service
    localParticipant.subscribe((data) => {
      const { participants } = this.useStore(StoreType.PRESENCE_3D);

      const participant = {
        ...participants.value.find((participant) => participant.id === data.id),
        ...data,
      };

      participants.publish([
        ...participants.value.filter((participant) => participant.id !== data.id),
        participant,
      ]);

      this.localParticipant = participant;
      this.unthrottledUpdatePresence3D(data);
    });
  }

  private initializeParticipantsList = (): void => {
    this.room.presence.get((presences) => {
      presences.forEach((presence: PresenceEvent<Participant>) => {
        this.unthrottledUpdatePresence3D(presence.data);
      });
    });
  };

  private onLocalParticipantJoined = (participant: Participant): void => {
    if (!participant.slot || participant.slot?.index === null) {
      setTimeout(() => {
        this.onLocalParticipantJoined(this.localParticipant);
      }, 2000);
      return;
    }

    if (!this.room['isJoined']) {
      setTimeout(() => {
        this.onLocalParticipantJoined(participant);
      }, 2000);
      return;
    }

    const { hasJoined3D } = this.useStore(StoreType.PRESENCE_3D);
    hasJoined3D.publish(true);

    this.room.emit(Presence3dEvents.PARTICIPANT_JOINED, participant);
    this.room.presence.update(participant);
    this.initializeParticipantsList();
  };

  private subscribeToRoomEvents = (): void => {
    this.room.on<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onJoinedRoom);
    this.room.presence.on(PresenceEvents.LEAVE, this.onLeaveRoom);
    this.room.presence.on(PresenceEvents.UPDATE, this.onParticipantUpdate);

    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onJoinedPresence);
  };

  private unsubscribeFromRoomEvents = (): void => {
    this.room.off<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onJoinedRoom);
    this.room.presence.off(PresenceEvents.LEAVE);
    this.room.presence.off(PresenceEvents.UPDATE);

    this.room.presence.off(PresenceEvents.JOINED_ROOM);
  };

  private onJoinedRoom = (event: SocketEvent<Participant>): void => {
    const { participants } = this.useStore(StoreType.PRESENCE_3D);

    const participant = participants.value.find((participant) => participant.id === event.data.id);
    participants.publish([
      ...participants.value.filter((participant) => participant.id !== event.data.id),
      {
        ...participant,
        ...event.data,
      },
    ]);
  };

  public onLeaveRoom = (event: PresenceEvent): void => {
    if (event.id === this.localParticipant.id) {
      this.unsubscribeFromRoomEvents();
      this.useStore(StoreType.PRESENCE_3D).destroy();
      return;
    }

    const { participants } = this.useStore(StoreType.PRESENCE_3D);
    const updatedParticipants = participants.value.filter(
      (participant) => participant.id !== event.id,
    );

    participants.publish(updatedParticipants);
  };

  private unthrottledUpdatePresence3D = (data: Participant): void => {
    if (!data?.id) return;

    const { participants, hasJoined3D } = this.useStore(StoreType.PRESENCE_3D);

    const participant = {
      ...participants.value.find((participant) => participant.id === data.id),
      ...data,
    };

    participants.publish([
      ...participants.value.filter((participant) => participant.id !== data.id),
      participant,
    ]);

    if (!hasJoined3D.value || participant.id !== this.localParticipant.id) return;

    this.room.presence.update(participant);
  };

  private onJoinedPresence = (event: PresenceEvent<Participant>): void => {
    if (event.id !== this.localParticipant.id) return;

    this.logger.log('participant joined 3D room', event.id, this.localParticipant);
    this.onLocalParticipantJoined(this.localParticipant);
  };

  public updatePresence3D = throttle((data: Participant): void => {
    this.unthrottledUpdatePresence3D(data);
  }, SYNC_PROPERTY_INTERVAL);

  /**
   * @function publish3DUpdate
   * @param {AblyParticipant} participant
   * @description publish a participant's changes to observer
   * @returns {void}
   */
  private onParticipantUpdate = (event: PresenceEvent<Participant>): void => {
    if (event.id === this.localParticipant.id) return;

    const { participants } = this.useStore(StoreType.PRESENCE_3D);

    const updatedParticipant = {
      ...participants.value.filter((participant) => participant.id === event.id)[0],
      ...event.data,
    };

    const updatedParticipants = participants.value.map((participant) => {
      if (participant.id === event.id) {
        return updatedParticipant;
      }

      return participant;
    });

    participants.publish(updatedParticipants);

    if (this.participants3DObservers[event.id]) {
      this.participants3DObservers[event.id].publish(updatedParticipant);
    }
  };

  /**
   * @function subscribeToUpdates
   * @description subscribe to a participant's events
   * @param {string} participantId
   * @param {Function} callback
   * @returns {void}
   */
  public subscribeToUpdates(participantId: string, callback: Function): void {
    if (!this.participants3DObservers[participantId]) {
      this.participants3DObservers[participantId] = new Observer({ logger: this.logger });
    }

    this.participants3DObservers[participantId].subscribe(callback);
  }

  /**
   * @function unsubscribeFromUpdates
   * @description unsubscribe to a participant's events
   * @param {string} participantId
   * @param {Function} callback
   * @returns {void}
   */
  public unsubscribeFromUpdates(participantId: string, callback: Function): void {
    if (this.participants3DObservers[participantId]) {
      this.participants3DObservers[participantId].unsubscribe(callback);
    }
  }

  public setParticipantData = (participant: ParticipantDataInput): void => {
    this.updatePresence3D(participant);
  };

  public get getParticipants() {
    return this.useStore(StoreType.PRESENCE_3D).participants.value;
  }
}
