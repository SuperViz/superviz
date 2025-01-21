import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { PresenceEvent } from '@superviz/socket-client';
import { isEqual } from 'lodash';

import { DEFAULT_AVATAR_URL } from '../common/constants/presence';
import { STORE_TYPES } from '../common/constants/store';
import { MatterportComponentOptions, ParticipantOn3D, PositionInfo } from '../types';

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
  private localFollowParticipantId?: string;
  private isPrivate: boolean;
  private createCircleOfPositions: () => void;

  /**
   * Creates a new ParticipantManager instance
   * @param config - Configuration options for the Matterport component
   * @param isPrivate - Whether the session is private
   * @param createCircleOfPositions - Function to create circular positions for participants
   * @param presence3DManager - Manager handling 3D presence
   */
  constructor(
    config: MatterportComponentOptions,
    isPrivate: boolean,
    createCircleOfPositions: () => void,
    presence3DManager: Presence3DManager,
  ) {
    this.config = config;
    this.isPrivate = isPrivate;
    this.createCircleOfPositions = createCircleOfPositions;
    this.presence3DManager = presence3DManager;

    console.log('MANAGER: presence3DManager', this.presence3DManager);
  }

  /**
   * Creates a list of participants from the store
   */
  public createParticipantList(): void {
    const list = this.useStore(STORE_TYPES.PRESENCE_3D).participants.value;
    Object.values(list).forEach((participant: ParticipantDataInput) => {
      if (!participant.isPrivate) this.addParticipant(participant);
    });
  }

  /**
   * Creates a new ParticipantOn3D object
   * @param params - Parameters for creating the participant
   * @returns ParticipantOn3D object
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

  /**
   * Adds a new participant to the environment
   * @param participant - Participant data to add
   * @returns Promise resolving to the created ParticipantOn3D or null
   */
  public async addParticipant(participant): Promise<ParticipantOn3D | null> {
    if (!participant || !participant.id || participant.type === 'audience') return null;

    const participantOn3D = this.createParticipantOn3D(participant);
    console.log('MANAGER: addParticipant', participantOn3D);

    if (this.participants.some((p) => p.id === participantOn3D.id)) {
      this.onParticipantUpdated(participant);
      console.log('MANAGER: addParticipant - already exists');
      return null;
    }

    this.addParticipantToList(participantOn3D);
    this.roomParticipants[participant.id] = participant;
    this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);
    return participantOn3D;
  }

  /**
   * Adds a participant to the internal participants list
   * @param participantOn3D - Participant to add to the list
   */
  private addParticipantToList(participantOn3D: ParticipantOn3D): void {
    this.participants.push(participantOn3D);
  }

  /**
   * Handles participant leave events
   * @param event - Presence event containing participant data
   */
  public onParticipantLeave(event: PresenceEvent<Participant>): void {
    const participantToRemove = this.participants.find((p) => p.id === event.id);
    if (participantToRemove) this.removeParticipant(participantToRemove, true);
  }

  /**
   * Updates the state when multiple participants are updated
   * @param participants - Array of updated participants
   */
  public onParticipantsUpdated(participants: ParticipantOn3D[]): void {
    this.roomParticipants = participants.reduce(
      (acc, p) => {
        acc[p.id] = p;
        return acc;
      },
      {} as Record<string, Participant>,
    );

    participants.forEach(({ id, position, rotation, sweep, floor, mode }) => {
      if (id !== this.localParticipantId) {
        this.positionInfos[id] = { position, rotation, mode, sweep, floor };
      }
    });
  }

  /**
   * Handles updates to a single participant
   * @param participant - Updated participant data
   */
  public onParticipantUpdated(participant: ParticipantDataInput): void {
    console.log('Participant updated:', participant);
  }

  /**
   * Handles participant join events
   * @param participant - Joined participant data
   */
  public onParticipantJoined(participant): void {
    console.log('MANAGER onParticipantJoined:', participant);

    if (!participant.data) return;
    const { id } = participant.data;

    if (id === this.localParticipantId) {
      this.onLocalParticipantJoined(participant.data);
    } else {
      this.addParticipant(participant.data);
    }
  }

  /**
   * Handles when the local participant joins
   * @param participant - Local participant data
   */
  private onLocalParticipantJoined(participant): void {
    this.createParticipantList();

    const avatarData = participant.avatar?.model3DUrl
      ? { model3DUrl: participant.avatar.model3DUrl, imageUrl: participant.avatar.imageUrl }
      : { model3DUrl: DEFAULT_AVATAR_URL, imageUrl: participant.avatar?.imageUrl };

    this.presence3DManager.setParticipantData({ avatar: avatarData } as ParticipantDataInput);
  }

  /**
   * Removes a participant from the environment
   * @param participant - Participant to remove
   * @param unsubscribe - Whether to unsubscribe from participant updates
   */
  public removeParticipant(participant: ParticipantOn3D, unsubscribe: boolean): void {
    console.log('Removing participant:', participant);

    this.participants = this.participants.filter((p) => p.id !== participant.id);
    delete this.roomParticipants[participant.id];

    if (unsubscribe) {
      this.presence3DManager.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    }
  }

  /**
   * Updates a participant at the specified index
   * @param index - Index of the participant to update
   * @param participant - New participant data
   */
  public setParticipant(index: number, participant: ParticipantOn3D): void {
    this.participants[index] = participant;
  }

  /**
   * Gets the list of all participants
   */
  public get getParticipants(): ParticipantOn3D[] {
    return this.participants;
  }

  /**
   * Gets the ID of the local participant
   */
  public get localParticipantId(): string {
    return this.localParticipant?.id;
  }

  /**
   * Sets the store utility object
   * @param useStore - Store utility function
   */
  public setUseStoreObject(useStore): void {
    this.useStore = useStore;
  }

  /**
   * Sets the presence 3D manager instance
   * @param presence3DManager - Presence3DManager instance
   */
  public setPresence3DManager(presence3DManager: Presence3DManager): void {
    this.presence3DManager = presence3DManager;
  }

  /**
   * Determines if a participant should be updated
   * @param participant - Participant to check
   * @returns Boolean indicating if the participant should be updated
   */
  public shouldUpdateParticipant(participant: ParticipantOn3D): boolean {
    if (!this.participants.length || !participant || participant.id === this.localParticipantId) {
      return false;
    }

    const existingParticipant = this.getOldParticipant(participant);
    if (!existingParticipant) {
      this.addParticipant(participant);
      return false;
    }

    return true;
  }

  /**
   * Gets the existing participant data for a given participant
   * @param participant - Participant to look up
   * @returns Existing participant data or undefined
   */
  private getOldParticipant(participant: ParticipantOn3D): ParticipantOn3D | undefined {
    return this.participants.find((p) => p.id === participant.id);
  }
}
