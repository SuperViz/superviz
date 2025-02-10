import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { PresenceEvent } from '@superviz/socket-client';

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
  private followParticipantId?: string;
  private localFollowParticipantId?: string;

  /**
   * Creates a new ParticipantManager instance
   * @param config - Configuration options for the Matterport component
   * @param presence3DManager - Manager handling 3D presence
   */
  constructor(config: MatterportComponentOptions, presence3DManager: Presence3DManager) {
    this.config = config;
    this.presence3DManager = presence3DManager;
  }

  /**
   * Creates a list of participants from the store
   */
  /*
  public createParticipantList(): void {
    const list = this.useStore(STORE_TYPES.PRESENCE_3D).participants.value;
    console.log('MANAGER createParticipantList:', list);
    Object.values(list).forEach((participant: ParticipantDataInput) => {
      if (!participant.isPrivate) this.addParticipant(participant);
    });
  }
  */

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
      avatarConfig: id === this.getLocalParticipantId ? this.config.avatarConfig : avatarConfig,
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

    // Check if participant already exists
    if (this.participantExists(participant.id)) {
      console.log('Participant already exists:', participant.id);
      // this.onParticipantUpdated(participant);
      return null;
    }
    const participantOn3D = this.createParticipantOn3D(participant);
    this.addParticipantToList(participantOn3D);
    this.roomParticipants[participant.id] = participant;
    this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);
    return Promise.resolve(participantOn3D);
  }

  public participantExists(participantId: string): boolean {
    return this.participants.some((p) => p.id === participantId);
  }

  /**
   * Adds a participant to the internal participants list
   * @param participantOn3D - Participant to add to the list
   */
  private addParticipantToList(participantOn3D: ParticipantOn3D): void {
    console.log('MANAGER addParticipantToList:', participantOn3D);
    // Additional check to prevent duplicates
    if (!this.participants.some((p) => p.id === participantOn3D.id)) {
      this.participants.push(participantOn3D);
    }
  }

  /**
   * Handles participant leave events
   * @param event - Presence event containing participant data
   */
  public onParticipantLeave = (event: PresenceEvent<Participant>): void => {
    const participantToRemove = this.participants.find((p) => p.id === event.id);
    if (participantToRemove) this.removeParticipant(participantToRemove, true);
  };

  /**
   * Updates the state when multiple participants are updated
   * @param participants - Array of updated participants
   */

  /**
   * Handles updates to a single participant
   * @param participant - Updated participant data
   */
  public onParticipantUpdated(participant): void {
    // const { id, name, avatar, avatarConfig, position, rotation, type, slot } =
    //   participant.data ?? participant;
    /* this.updateParticipant({
      position,
      rotation,
      id,
      name,
      avatar,
      avatarConfig,
      type,
      slot,
    }); */
    /*
    TODO::
    if (this.localFollowParticipantId || this.followParticipantId) {
      this.moveToAnotherParticipant(this.localFollowParticipantId ?? this.followParticipantId);
    }
    */
  }

  /**
   * Handles participant join events
   * @param participant - Joined participant data
   */
  public onParticipantJoined = (participant): void => {
    /* console.log('MANAGER onParticipantJoined:', participant);

    if (!participant.data) return;
    const { id } = participant.data;

    if (id === this.getLocalParticipantId) {
      this.onLocalParticipantJoined(participant.data);
    } else {
      console.log('MANAGER onParticipantJoined - addParticipant:', participant.data);
      this.addParticipant(participant.data);
    } */
  };

  /**
   * Handles when the local participant joins
   * @param participant - Local participant data
   */
  private onLocalParticipantJoined(participant): void {
    /*
    this.createParticipantList();

    const avatarData = participant.avatar?.model3DUrl
      ? { model3DUrl: participant.avatar.model3DUrl, imageUrl: participant.avatar.imageUrl }
      : { model3DUrl: DEFAULT_AVATAR_URL, imageUrl: participant.avatar?.imageUrl };

    this.presence3DManager.setParticipantData({ avatar: avatarData } as ParticipantDataInput);
    */
  }

  /**
   * Removes a participant from the environment
   * @param participant - Participant to remove
   * @param unsubscribe - Whether to unsubscribe from participant updates
   */

  public async removeParticipant(participant: Participant, unsubscribe: boolean): Promise<void> {
    // First, remove the participant from the array by its index.
    const index = this.participants.findIndex((p) => p.id === participant.id);
    if (index !== -1) {
      this.participants.splice(index, 1);
    } else {
      console.log('Participant not found in the array.');
    }

    // Then, delete the property keyed by participant.id in case it was set on the array.
    if (this.participants.hasOwnProperty(participant.id)) {
      delete this.participants[participant.id];
    }

    if (unsubscribe) {
      this.presence3DManager.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    }

    return Promise.resolve();
  }

  /**
   * Updates a participant at the specified index
   * @param index - Index of the participant to update
   * @param participant - New participant data
   */
  public setParticipant(index: number, participant: ParticipantOn3D): void {
    // this.participants[index] = participant;
  }

  /**
   * Gets the list of all participants
   */
  public get getParticipants(): ParticipantOn3D[] {
    return this.participants;
  }

  /**
   * Gets the the local participant
   */

  public get getLocalParticipant(): Participant {
    return this.localParticipant;
  }

  public setLocalParticipant(participant: Participant): void {
    this.localParticipant = participant;
    // Any additional logic needed when local participant changes
  }

  public get getRoomParticipants(): Record<string, Participant> {
    return this.roomParticipants;
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
    if (
      !this.participants.length ||
      !participant ||
      participant.id === this.getLocalParticipantId
    ) {
      return false;
    }

    const existingParticipant = this.getOldParticipant(participant);
    if (!existingParticipant) {
      console.log('ALERT!! - MANAGER shouldUpdateParticipant - addParticipant:', participant);

      // this.addParticipant(participant);

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

  public getFollowParticipantId(): string | undefined {
    return this.followParticipantId;
  }

  public setFollowParticipantId(id?: string): void {
    this.followParticipantId = id;
  }

  public getLocalFollowParticipantId(): string | undefined {
    return this.localFollowParticipantId;
  }

  public setLocalFollowParticipantId(id?: string): void {
    this.localFollowParticipantId = id;
  }

  public getPositionInfos(): Record<string, PositionInfo> {
    return this.positionInfos;
  }

  public getPositionInfo(participantId: string): PositionInfo | undefined {
    return this.positionInfos[participantId];
  }

  public updatePositionInfo(participantId: string, info: PositionInfo): void {
    this.positionInfos[participantId] = info;
  }

  public setRoomParticipants = (participants) => {
    participants.forEach((participant) => {
      this.roomParticipants[participant.id] = participant;
    });
  };

  public clearRoomParticipants = () => {
    this.roomParticipants = {};
  };

  public roomParticipantExists(participantId: string) {
    console.log(this.roomParticipants[participantId]);
    // return this.roomParticipants[participantId] ? true : false;
  }

  // Add a safe getter for local participant id
  public get getLocalParticipantId(): string | undefined {
    return this.localParticipant?.id;
  }
}
