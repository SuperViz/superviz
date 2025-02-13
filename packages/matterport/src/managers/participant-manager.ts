import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { PresenceEvent } from '@superviz/socket-client';

import { MatterportComponentOptions, ParticipantOn3D, PositionInfo } from '../types';
import { Config } from '../utils/config';

/**
 * Manages participants in a 3D environment, handling their creation, updates, and removal
 */
export class ParticipantManager {
  private useStore: typeof useStore;
  private localParticipant: Participant;
  private config: MatterportComponentOptions;
  private participants: ParticipantOn3D[] = [];
  private roomParticipants: Record<string, Participant> = {};
  private positionInfos: Record<string, PositionInfo> = {};
  private presence3DManager: Presence3DManager;
  private followParticipantId?: string;
  private localFollowParticipantId?: string;

  /**
   * Creates a new ParticipantManager instance
   * @param presence3DManager - Manager handling 3D presence
   */
  constructor() {
    this.config = Config.getInstance().getConfig();
  }

  public handleParticpantList(participants: ParticipantOn3D[]): void {
    // do not do anything until we have a local participant ::
    if (!this.localParticipant) return;

    // Get the old participants before updating.
    const oldParticipants = this.getRoomParticipants;

    // Build a set of new participant IDs from the incoming update.
    const newParticipantIds = new Set(participants.map((p) => p.id));

    // Compare the old participant IDs against the new ones.
    Object.keys(oldParticipants).forEach((id) => {
      if (!newParticipantIds.has(id)) {
        const participantLeft = oldParticipants[id];
        this.removeParticipant(participantLeft);
      }
    });

    this.setRoomParticipants(participants);

    participants.forEach((participant: ParticipantOn3D) => {
      const participantId = participant.id;
      const { position, rotation, sweep, floor, mode, isPrivate } = participant;

      // Store complete position info including slot
      this.updatePositionInfo(participantId, {
        position,
        rotation,
        sweep,
        floor,
        mode,
        isPrivate,
        slot: participant.slot,
      });

      // Skip local or previously added participant
      if (
        participant.id !== this.getLocalParticipant.id
        && !this.participantExists(participant.id)
      ) {
        this.addParticipant(participant as ParticipantOn3D)
          .then((participantOn3D) => {
            console.log('PLUGIN:participant added', participantOn3D.id);
          })
          .catch((error) => {
            console.error('Error adding participant:', error);
          });
      }
    });
  }

  /*
    Position Info ::
  */
  public updatePositionInfo(participantId: string, info: PositionInfo): void {
    this.positionInfos[participantId] = info;
  }

  /*
    Avatar Participants ::
  */
  private async addParticipant(participant): Promise<ParticipantOn3D | null> {
    if (!participant || !participant.id || participant.type === 'audience') return null;

    // Check if participant already exists
    if (this.participantExists(participant.id)) {
      console.log('Participant already exists:', participant.id);
      // this.onParticipantUpdated(participant);
      return null;
    }
    const participantOn3D = this.createParticipantOn3D(participant);
    this.participants.push(participantOn3D);

    // this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);
    return Promise.resolve(participantOn3D);
  }

  private removeParticipant(participant: Participant): void {
    console.log('PLUGIN: remove participant', participant.id);
  }

  public get getParticipants(): ParticipantOn3D[] {
    return this.participants;
  }

  public participantExists(participantId: string): boolean {
    return this.participants.some((p) => p.id === participantId);
  }

  /*
    Room Participants ::
  */

  private setRoomParticipants = (participants) => {
    this.roomParticipants = {};

    participants.forEach((participant) => {
      this.roomParticipants[participant.id] = participant;
    });
  };

  private get getRoomParticipants(): Record<string, Participant> {
    return this.roomParticipants;
  }

  /*
    Local Participant ::
  */
  public setLocalParticipant(participant: Participant): Promise<boolean> {
    // only add local participant once ::
    if (this.localParticipant) {
      return Promise.reject(new Error('Local participant is already set'));
    }

    this.localParticipant = participant;

    console.log('PLUGIN:local participant set', this.localParticipant);

    return Promise.resolve(true);
  }

  public get getLocalParticipant(): Participant {
    return this.localParticipant;
  }

  /*
    Create Participant On 3D ::
  */

  public createParticipantOn3D = ({
    id,
    name,
    avatar,
    avatarConfig,
    type,
    slot,
  }): ParticipantOn3D => {
    const participant = {
      id,
      name,
      avatar,
      isAudience: type === 'audience',
      avatarConfig: id === this.getLocalParticipant.id ? this.config.avatarConfig : avatarConfig,
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
      rotation: {
        x: 0,
        y: 0,
      },
      slot,
    };

    return participant;
  };
}
