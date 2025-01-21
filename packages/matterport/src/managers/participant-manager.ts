import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { PresenceEvent } from '@superviz/socket-client';
import { isEqual } from 'lodash';

import { DEFAULT_AVATAR_URL } from '../common/constants/presence';
import { STORE_TYPES } from '../common/constants/store';
import { MatterportComponentOptions, ParticipantOn3D, PositionInfo } from '../types';

export class ParticipantManager {
  private useStore: typeof useStore;
  private localParticipant: Participant;
  private config: MatterportComponentOptions;
  private participants: ParticipantOn3D[] = [];
  private roomParticipants: Record<string, Participant> = {};
  private positionInfos: Record<string, PositionInfo> = {};
  private presence3DManager: Presence3DManager;
  private localFollowParticipantId?: string;

  constructor(config: MatterportComponentOptions) {
    this.config = config;
  }

  // Participant Management
  private createParticipantList = () => {
    const list = this.useStore(STORE_TYPES.PRESENCE_3D).participants.value;

    Object.values(list).forEach((participant: ParticipantDataInput) => {
      if (participant.isPrivate) return;
      this.addParticipant(participant);
    });
  };

  private createParticipantOn3D = ({
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
      avatarConfig: id === this.localParticipantId ? this.config.avatarConfig : avatarConfig,
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

  private addParticipant = async (participant): Promise<void> => {
    if (!participant || !participant.id || participant.type === 'audience') return;
    const participantOn3D = this.createParticipantOn3D(participant);

    console.log(
      'MANAGER: this.participants: ',
      this.participants,
      'participantOn3D: ',
      participantOn3D,
    );

    if (this.participants.find((p) => p.id === participantOn3D.id)) {
      console.log('MANAGER: participant already exists');
      this.onParticipantUpdated(participant);
      return;
    }

    this.participants.push(participantOn3D);
    this.roomParticipants[participant.id] = participant;

    // TODO :: THIS is broken ::
    // this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);

    if (this.localParticipantId === participantOn3D.id) return;

    // TODO:: dispatch event to create avatar and laser ::

    // TODO:: dispatch event to create circle of positions ::
  };

  private onParticipantLeave = (event: PresenceEvent<Participant>): void => {
    console.log('onParticipantLeave :!', event.data);
    const participantToRemove = this.participants.find(
      (participantOnlist) => participantOnlist.id === event.id,
    );

    if (!participantToRemove) return;

    this.removeParticipant(participantToRemove, true);
  };

  private onParticipantsUpdated = (participants) => {
    // only recieve this if attached ::

    this.roomParticipants = {};

    participants.forEach((participant) => {
      this.roomParticipants[participant.id] = participant;
    });

    Object.values(participants).forEach((participant: ParticipantOn3D) => {
      if (participant.id === this.localParticipantId) return;
      const participantId = participant.id;
      const { position, rotation, sweep, floor, mode, isPrivate } = participant;

      this.positionInfos[participantId] = {
        position,
        rotation,
        mode,
        sweep,
        floor,
      };

      // TODO:: FIGURE OUT HOW TO HANDLE THIS ::
      /*
      if (isPrivate && this.avatars[participantId]) {
        this.removeParticipant(participant, true);
      }

      if (!isPrivate && !this.avatars[participantId]) {
        this.addParticipant(participant);
      }
        */

      // Update avatar if it exists
      /*
      if (this.avatars[participantId] && position && rotation && this.isAttached) {
        const avatarModel = this.avatars[participantId];
        avatarModel.avatar.update(
          position,
          rotation,
          null, // Don't pass circle position for remote avatars
        );

      }
        */

      // Update laser independently
      /*
      const remoteLaser = this.lasers[participantId];
      if (remoteLaser && position) {
        this.laserManager.startLaserUpdate(
          participantId,
          this.avatars[participantId],
          remoteLaser,
          participant,
        );
      }
        */
    });
  };

  private onParticipantUpdated = (participant): void => {
    const { id, name, avatar, avatarConfig, position, rotation, type, slot } =
      participant.data ?? participant;

    this.updateParticipant({
      position,
      rotation,
      id,
      name,
      avatar,
      avatarConfig,
      type,
      slot,
    });

    // TODO:: dispatch event to move to participant ::
    /*
    if (this.localFollowParticipantId || this.followParticipantId) {
      this.moveToAnotherParticipant(this.localFollowParticipantId ?? this.followParticipantId);
    }
      */
  };

  private updateParticipant = async (participant): Promise<void> => {
    if (
      !this.participants ||
      this.participants.length === 0 ||
      !participant ||
      !participant.id ||
      participant.id === this.localParticipantId
    ) {
      return;
    }

    const participantToBeUpdated = this.participants.find(
      (oldParticipant) => oldParticipant.id === participant.id,
    );

    if (!participantToBeUpdated) {
      this.addParticipant(participant);
      return;
    }

    if (
      participantToBeUpdated.avatar?.model3DUrl !== participant.avatar?.model3DUrl ||
      !isEqual(participantToBeUpdated.avatarConfig, participant.avatarConfig) ||
      participantToBeUpdated.name !== participant.name
    ) {
      this.removeParticipant(participant, false);
      const participantOn3D = this.createParticipantOn3D(participant);
      this.participants.push(participantOn3D);

      // TODO:: dispatch event to create avatar and laser ::
      /*
      if (!this.isEmbedMode) {
        this.config.isAvatarsEnabled && this.createAvatar(participantOn3D);
        this.config.isLaserEnabled && this.createLaser(participantOn3D);
      }
        */

      // TODO:: Call createName through the avatar's component ::
      /*
      if (this.config.isNameEnabled && this.avatars[participant.id]) {
        const avatarModel = this.avatars[participant.id];
        avatarModel.avatar.createName(participantOn3D, avatarModel);
      }
        */
    } else {
      const index = this.participants.findIndex((u) => u.id === participant.id);
      if (index !== -1) {
        this.participants[index] = participant;
      }
    }
  };

  public onParticipantJoined = (participant): void => {
    console.log('MANAGER onParticipantJoined :!', participant);

    if (!participant.data) return;

    const { id, name, avatar, avatarConfig, type, slot } = participant.data;

    if (id === this.localParticipantId) {
      this.onLocalParticipantJoined(participant.data);

      return;
    }

    this.addParticipant({
      id,
      name,
      avatar,
      avatarConfig,
      type,
      slot,
    });
  };

  private onLocalParticipantJoined = (participant): void => {
    this.createParticipantList();

    if (this.config.avatarConfig) {
      this.presence3DManager.setParticipantData({
        avatarConfig: this.config.avatarConfig,
      } as ParticipantDataInput);
    }

    if (participant.avatar?.model3DUrl) {
      this.presence3DManager.setParticipantData({
        avatar: {
          model3DUrl: participant?.avatar.model3DUrl,
          imageUrl: participant?.avatar?.imageUrl,
        },
      } as ParticipantDataInput);
    }

    if (!participant.avatar?.model3DUrl) {
      this.presence3DManager.setParticipantData({
        avatar: {
          model3DUrl: DEFAULT_AVATAR_URL,
          imageUrl: participant?.avatar?.imageUrl,
        },
      } as ParticipantDataInput);
    }
  };

  private removeParticipant = (participant: ParticipantOn3D, unsubscribe: boolean): void => {
    console.log('removeParticipant :!', participant);

    this.participants = this.participants.filter(
      (participantOnlist) => participantOnlist.id !== participant.id,
    );

    delete this.roomParticipants[participant.id];

    // TODO:: dispatch event to destroy avatar and laser and name ::
    /*
    this.destroyAvatar(participant);
    this.destroyLaser(participant);
    //this.nameService?.destroyName(participant.id);

    if (this.names[participant.id]) {
      this.names[participant.id].stop();
      delete this.names[participant.id];
    }

    if (this.laserLerpers[participant.id]) {
      this.laserLerpers[participant.id].node.stop();
      delete this.laserLerpers[participant.id];
    }
        */

    if (unsubscribe) {
      this.presence3DManager?.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    }

    // TODO:: dispatch event to destroy circle of positions ::
    /*
    this.createCircleOfPositions();
      */
  };

  private get localParticipantId(): string {
    return this.localParticipant?.id;
  }
}
