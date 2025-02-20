import { Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { Room } from '@superviz/socket-client';
import PubSub from 'pubsub-js';

import type { MpSdk as Matterport } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import { NAME } from '../constants/presence';
import { STORE_TYPES } from '../constants/store';
import { CirclePositionManager } from '../managers/circle-position-manager';
import { MatterportManager } from '../managers/matterport-manager';
import { ParticipantManager } from '../managers/participant-manager';
import { MatterportComponentOptions, ParticipantOn3D } from '../types';
import { Config } from '../utils/config';
import { VectorCache } from '../utils/vector-cache';

export class Presence3D {
  public name: string;
  private logger: Logger;
  private config: Config;
  private room: Room;
  private useStore: typeof useStore;
  private presence3DManager: Presence3DManager;
  private isAttached = false;
  private matterportSdk: Matterport;
  private isPrivate: boolean;

  constructor(matterportSdk: Matterport, options?: MatterportComponentOptions) {
    // default ::
    this.name = NAME;
    this.matterportSdk = matterportSdk;
    this.logger = new Logger('@superviz/sdk/matterport-component');

    // initialize config ::
    this.config = Config.getInstance();
    this.config.setConfig(options);
  }

  private destroy = (): void => {
    this.room.disconnect();
    this.room = undefined;

    this.presence3DManager = undefined;

    this.useStore = undefined;
  };

  public attach = (params: DefaultAttachComponentOptions): void => {
    if (Object.values(params).includes(null) || Object.values(params).includes(undefined)) {
      const message = `${NAME} @ attach - params are required`;
      this.logger.log(message);
      throw new Error(message);
    }

    console.log('Plugin: attach');

    const { eventBus, useStore, ioc } = params;
    this.useStore = useStore.bind(this);
    this.room = ioc.createRoom(NAME);

    // initialize Presence manager ::
    this.presence3DManager = new Presence3DManager(this.room, this.useStore);

    // initialize Matterport manager ::
    MatterportManager.init(
      this.matterportSdk,
      this.presence3DManager,
      this.isPrivate,
    );

    MatterportManager.instance.initialize()
      .then(() => {
        this.isAttached = true;
        this.onManagersInitialized();
      })
      .catch(() => console.log('Plugin: Matterport bounds failed'));
  };

  private onManagersInitialized = async (): Promise<void> => {
    console.log('Plugin: Managers initialized');

    VectorCache.instance.initialize(MatterportManager.getTHREE());

    CirclePositionManager.init();

    PubSub.subscribe('PARTICIPANT_ADDED', this.onParticipantAdded.bind(this));
    // PubSub.subscribe('PARTICIPANT_UPDATED', this.onParticipantUpdated.bind(this));

    const { localParticipant, hasJoinedRoom } = this.useStore(STORE_TYPES.GLOBAL);

    // Subscribe to local participant updates
    localParticipant.subscribe(async (participant) => {
      try {
        // Attempt to set the local participant
        if (await ParticipantManager.instance.setLocalParticipant(participant)) {
          this.onLocalParticipantRegistred();
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('already set')) {
          console.log('Plugin: Local participant already set. Skipping.');
        } else {
          console.error('Plugin: Error setting local participant:', error);
        }
      }
    });

    hasJoinedRoom.subscribe();
  };

  private onParticipantAdded = (e: any, payload: { participant: ParticipantOn3D }) => {
    console.log('Plugin: Participant added', payload.participant);
    // CirclePositionManager.instance.createCircleOfPositions([payload.participant]);
    MatterportManager.instance.createNameLabel(payload.participant);
    MatterportManager.instance.createAvatar(payload.participant);
    MatterportManager.instance.createLaser(payload.participant);
  };

  private onLocalParticipantRegistred = async () => {
    console.log('Plugin: Local participant registered');

    await MatterportManager.instance.registerEventsAndElements();

    // subscribe to updates on the participants ::
    const { hasJoined3D, participants } = this.useStore(STORE_TYPES.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);
  };

  private onParticipantsUpdated = (participants: ParticipantOn3D[]) => {
    if (!this.isAttached) return;

    // let the participant manager handle the list of participants active ::
    ParticipantManager.instance.handleParticpantList(participants);
  };

  public detach = (): void => {
    console.log('detach');
  };

  public goTo = (participantId: string): void => {
    console.log('goTo', participantId);
  };

  public gather = (): void => {
    console.log('gather');
  };

  public follow = (participantId?: string): void => {
    console.log('follow', participantId);
  };

  public localFollow = (participantId?: string): void => {
    console.log('localFollow', participantId);
  };
}
