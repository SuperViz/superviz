import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { Room } from '@superviz/socket-client';

import { Coordinates } from '../common/types/coordinates.types';
import type { MpSdk as Matterport } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import Avatar from '../components/Avatar';
import { NAME } from '../constants/presence';
import { STORE_TYPES } from '../constants/store';
import { MatterportEvents } from '../events/matterport-events';
import { CirclePositionManager } from '../managers/circle-position-manager';
import { ParticipantManager } from '../managers/participant-manager';
import { MatterportComponentOptions, ParticipantOn3D } from '../types';
import { Config } from '../utils/config';
import { VectorCache } from '../utils/vector-cache';

import { SceneLight } from './matterport/scene-light';

export class Presence3D {
  public name: string;
  private logger: Logger;
  private config: Config;
  private room: Room;
  private useStore: typeof useStore;
  private presence3DManager: Presence3DManager;
  private matterportEvents: MatterportEvents;
  private participantManager: ParticipantManager;
  private isAttached = false;
  private matterportSdk: Matterport;
  private isPrivate: boolean;
  private circlePositionManager: CirclePositionManager;
  private vectorCache: VectorCache;
  private isEmbedMode: boolean = false;

  /**
   * Constructor for the Presence3D service
   * @param matterportSdk - The Matterport SDK instance
   * @param options - Optional configuration options for the component
   */
  constructor(matterportSdk: Matterport, options?: MatterportComponentOptions) {
    // default ::
    this.name = NAME;
    this.matterportSdk = matterportSdk;
    this.logger = new Logger('@superviz/sdk/matterport-component');

    // initialize config ::
    this.config = Config.getInstance();
    this.config.setConfig(options);

    // initialize the matterport events ::

    console.log('Plugin: constructor');
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

    // initialize circle position manager ::
    this.vectorCache = new VectorCache();
    this.circlePositionManager = new CirclePositionManager(this.vectorCache);

    // initialize participant manager ::
    this.participantManager = new ParticipantManager();

    // initialize Presence manager ::
    this.presence3DManager = new Presence3DManager(this.room, this.useStore);

    // tell the participant manager who the local participant is ::
    const { localParticipant, hasJoinedRoom } = this.useStore(STORE_TYPES.GLOBAL);
    localParticipant.subscribe((participant) => {
      //
      // when local participant has been registered, move on to start the engine ::
      //
      this.participantManager.setLocalParticipant(participant)
        .then(() => this.onLocalParticipantRegistred())
        .catch((error) => console.error('Error adding participant:', error));
    });
    hasJoinedRoom.subscribe();

    // subscribe to updates on the participants ::
    const { hasJoined3D, participants } = this.useStore(STORE_TYPES.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);

    this.isAttached = true;
  };

  private onLocalParticipantRegistred = () => {
    // initialize matterport events ::
    this.matterportEvents = new MatterportEvents(
      this.matterportSdk,
      this.presence3DManager,
      this.adjustMyPositionToCircle,
      () => this.participantManager.getLocalParticipant.id,
      this.isPrivate,
    );
    this.matterportEvents.subscribeToMatterportEvents();

    // initialize matterport scenes ::
    this.initializeScene();
  };

  private onParticipantsUpdated = (participants: ParticipantOn3D[]) => {
    if (!this.isAttached) return;

    // let the participant manager handle the list of participants active ::
    this.participantManager.handleParticpantList(participants);
  };

  private initializeScene(): void {
    if (this.matterportSdk.Scene) {
      this.matterportSdk.Scene.register('avatar', Avatar);
    } else {
      this.isEmbedMode = true;
    }
  }

  /*
 Circle of positions
*/
  private adjustMyPositionToCircle = (position?: Coordinates): Coordinates => {
    return this.circlePositionManager.adjustPositionToCircle(position, this.participantManager.getLocalParticipant?.slot?.index);
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
