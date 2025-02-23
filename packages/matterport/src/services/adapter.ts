import { Presence3DManager, Participant } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { Room, PresenceEvent, PresenceEvents, SocketEvent } from '@superviz/socket-client';
import PubSub from 'pubsub-js';

import type { MpSdk as Matterport } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import { DEFAULT_AVATAR_URL } from '../constants/avatar';
import { NAME } from '../constants/presence';
import { STORE_TYPES } from '../constants/store';
import { MatterportManager } from '../managers/matterport-manager';
import { ParticipantManager } from '../managers/participant-manager';
import { MatterportComponentOptions, ParticipantOn3D, Presence3dEvents } from '../types';
import { Config } from '../utils/config';

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
  private eventBus: EventBus;

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

    this.eventBus = eventBus;
    this.subscribeToRealtimeEvents();
    this.subscribeToEventBusEvents();
  };

  private onManagersInitialized = async (): Promise<void> => {
    console.log('Plugin: Managers initialized');

    PubSub.subscribe('PARTICIPANT_ADDED', this.onParticipantAdded.bind(this));
    // PubSub.subscribe('PARTICIPANT_UPDATED', this.onParticipantUpdated.bind(this));

    const { localParticipant, hasJoinedRoom } = this.useStore(STORE_TYPES.GLOBAL);

    // Subscribe to local participant updates
    localParticipant.subscribe(async (participant) => {
      try {
        // Attempt to set the local participant
        if (await ParticipantManager.instance.setLocalParticipant(participant)) {
          this.onLocalParticipantRegistred(participant);
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
    // implement Presence3DManager ::
    this.presence3DManager.subscribeToUpdates(
      payload.participant.id,
      ParticipantManager.instance.onParticipantUpdated,
    );

    console.log('Plugin: Participant added', payload.participant);
    // CirclePositionManager.instance.createCircleOfPositions([payload.participant]);
    MatterportManager.instance.createNameLabel(payload.participant);
    MatterportManager.instance.createAvatar(payload.participant);
    MatterportManager.instance.createLaser(payload.participant);
  };

  private onLocalParticipantRegistred = async (participant: Participant) => {
    this.setLocalParticipantData(participant);

    await MatterportManager.instance.registerEventsAndElements();

    // subscribe to updates on the participants ::
    const { hasJoined3D, participants } = this.useStore(STORE_TYPES.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);
  };

  private setLocalParticipantData = (participant: Participant) => {
    if (this.config.getConfig().avatarConfig) {
      this.presence3DManager.setParticipantData({
        avatarConfig: this.config.getConfig().avatarConfig,
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

  private onParticipantsUpdated = (participants: ParticipantOn3D[]) => {
    if (!this.isAttached) return;

    // let the participant manager handle the list of participants active ::
    ParticipantManager.instance.handleParticpantList(participants);
  };

  /*
  Realtime
  */

  private subscribeToRealtimeEvents = (): void => {
    this.room.on<{ id?: string }>(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.on<{ id?: string }>(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  private unsubscribeToRealtimeEvents = (): void => {
    this.room.off(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.off(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  /*
  Event Bus
  */

  private subscribeToEventBusEvents = (): void => {
    this.eventBus.subscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.subscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.subscribe('realtime.follow-participant', this.follow);
  };

  private unsubscribeToEventBusEvents = (): void => {
    this.eventBus.unsubscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.unsubscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.unsubscribe('realtime.follow-participant', this.follow);
  };

  public detach = (): void => {
    console.log('detach');
  };

  public goTo = (participantId: string): void => {
    PubSub.publish(Presence3dEvents.GO_TO_PARTICIPANT, { participantId });
  };

  public follow = (participantId?: string): void => {
    this.room.emit(Presence3dEvents.FOLLOW_ME, { id: participantId });
  };

  public localFollow = (participantId?: string): void => {
    PubSub.publish(Presence3dEvents.LOCAL_FOLLOW_PARTICIPANT_CHANGED, { participantId });
  };

  private onFollowParticipantUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    if (event.data.id === ParticipantManager.instance.getLocalParticipant.id) return;
    PubSub.publish(Presence3dEvents.FOLLOW_ME, { event });
  };

  private onGatherUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    if (event.data.id === ParticipantManager.instance.getLocalParticipant.id) return;

    this.eventBus.publish('realtime.go-to-participant', event.data.id);
  };
}
