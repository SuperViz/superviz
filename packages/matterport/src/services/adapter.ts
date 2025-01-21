import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';

import { DEFAULT_AVATAR_URL } from '../common/constants/presence';
import { STORE_TYPES } from '../common/constants/store';
import { AvatarTypes } from '../common/types/avatarTypes.types';
import { Coordinates } from '../common/types/coordinates.types';
import { Laser } from '../common/types/lasers.types';
import type { MpSdk as Matterport } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import Avatar from '../components/Avatar';
import LaserPointer from '../components/LaserPointer';
import Lerper from '../components/Lerper';
import NameLabel from '../components/NameLabel/NameLabel';
import { MatterportEvents } from '../events/matterport-events';
import { CirclePositionManager } from '../managers/circle-position-manager';
import { IntervalManager } from '../managers/interval-manager';
import { LaserManager } from '../managers/laser-manager';
import { MatterportMovementManager } from '../managers/matterport-movement-manager';
import { ParticipantManager } from '../managers/participant-manager';
import { SceneLight } from '../services/matterport/scene-light';
import { MatterportComponentOptions, ParticipantOn3D, PositionInfo } from '../types';
import { VectorCache } from '../utils/vector-cache';
import { Presence3dEvents } from './types';

export class Presence3D {
  // Core Dependencies
  public name: string;
  private room: Room;
  private useStore: typeof useStore;
  private presence3DManager: Presence3DManager;
  private eventBus: EventBus;
  private logger: Logger;
  private matterportSdk: Matterport;
  private sceneLight: SceneLight;
  private THREE;
  private mpInputComponent: Matterport.Scene.IComponent;
  private readonly movementManager: MatterportMovementManager;

  //#Configuration and State
  private config: MatterportComponentOptions;
  private isEmbedMode: boolean = false;
  private isAttached = false;
  private isPrivate: boolean;
  private hasJoinedRoom: boolean = false;
  private hasJoined3D: boolean = false;
  private maxDistanceSquared: number;
  //#endregion

  //#region Participant State
  private localParticipant: Participant;
  private participants: ParticipantOn3D[] = [];
  private roomParticipants: Record<string, Participant> = {};
  private positionInfos: Record<string, PositionInfo> = {};
  private localSlot: number = -1;
  private followParticipantId?: string;
  private localFollowParticipantId?: string;
  //#endregion

  //#region Visual Components
  private avatars: Record<string, AvatarTypes> = {};
  private lasers: Record<string, Laser> = {};
  private names: Record<string, any> = {};
  private laserLerpers: Record<string, any> = {};
  //#endregion

  //#region Performance Optimization
  private readonly vectorCache: VectorCache;
  private unsubscribeFrom: Array<(id: unknown) => void> = [];
  //#endregion

  //#Managers
  private intervalManager: IntervalManager;
  private readonly laserManager: LaserManager;
  private readonly circlePositionManager: CirclePositionManager;
  private matterportEvents: MatterportEvents;
  private participantManager: ParticipantManager;
  //

  // Constructor and Initialization
  constructor(matterportSdk: Matterport, options?: MatterportComponentOptions) {
    this.name = 'presence3dMatterport';
    this.logger = new Logger('@superviz/sdk/matterport-component');
    this.vectorCache = new VectorCache();
    this.intervalManager = new IntervalManager();
    this.circlePositionManager = new CirclePositionManager(this.vectorCache);

    this.logger.log('matterport component @ constructor', { matterportSdk, options });

    this.config = {
      isAvatarsEnabled: options?.isAvatarsEnabled ?? true,
      isLaserEnabled: options?.isLaserEnabled ?? true,
      isNameEnabled: options?.isNameEnabled ?? true,
      avatarConfig: {
        height: options?.avatarConfig?.height || 0.25,
        scale: options?.avatarConfig?.scale || 0.55,
        laserOrigin: options?.avatarConfig?.laserOrigin ?? {
          x: 0,
          y: -0.2,
          z: 0.07,
        },
      },
    };

    this.logger.log('matterport component @ constructor - config', this.config);

    this.matterportSdk = matterportSdk;
    this.movementManager = new MatterportMovementManager(this.matterportSdk);

    // if it's using embed mode, that's no have Scene
    if (this.matterportSdk.Scene) {
      this.matterportSdk.Scene.register('lerper', Lerper);
      this.matterportSdk.Scene.register('name', NameLabel);
      this.matterportSdk.Scene.register('laser', LaserPointer);
      this.matterportSdk.Scene.register('avatar', Avatar);
    } else {
      this.isEmbedMode = true;
    }

    // input control
    this.addInputComponent();

    this.sceneLight = new SceneLight(this.matterportSdk);
    this.sceneLight.addSceneLight().then(() => {
      this.THREE = this.sceneLight.getTHREE();
      this.vectorCache.initialize(this.THREE);
    });

    this.subscribeToMatterportEvents();

    // Get scene bounds from sweep positions
    this.initializeSceneBounds();

    this.laserManager = new LaserManager(
      this.intervalManager,
      this.vectorCache,
      this.positionInfos,
    );

    this.participantManager = new ParticipantManager(
      this.config,
      this.isPrivate,
      () => this.createCircleOfPositions(),
      null,
    );

    this.createCircleOfPositions();
  }

  /*
  Participant Management
  */
  private onParticipantsUpdated = (participants) => {
    if (!this.isAttached) return;

    this.participantManager.onParticipantsUpdated(participants);

    // Handle visual updates
    Object.values(participants).forEach((participant: ParticipantOn3D) => {
      if (participant.id === this.localParticipantId) return;

      const participantId = participant.id;
      const { position, rotation, isPrivate } = participant;

      // Update avatar if it exists
      if (this.avatars[participantId] && position && rotation && this.isAttached) {
        const avatarModel = this.avatars[participantId];
        avatarModel.avatar.update(
          position,
          rotation,
          null, // Don't pass circle position for remote avatars
        );
      }

      // Update laser
      const remoteLaser = this.lasers[participantId];
      if (remoteLaser && position) {
        this.laserManager.startLaserUpdate(
          participantId,
          this.avatars[participantId],
          remoteLaser,
          participant,
        );
      }

      // Handle visibility
      if (isPrivate && this.avatars[participantId]) {
        this.removeParticipant(participant, true);
      }

      if (!isPrivate && !this.avatars[participantId]) {
        this.addParticipant(participant);
      }
    });
  };

  private removeParticipant = (participant: ParticipantOn3D, unsubscribe: boolean): void => {
    console.log('removeParticipant :!', participant);
    this.logger.log('matterport component @ removeParticipant', { participant, unsubscribe });

    this.participants = this.participants.filter(
      (participantOnlist) => participantOnlist.id !== participant.id,
    );

    delete this.roomParticipants[participant.id];

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

    if (unsubscribe) {
      this.participantManager.removeParticipant(participant, unsubscribe);
    }

    this.createCircleOfPositions();
  };

  // Public Methods
  public attach = (params: DefaultAttachComponentOptions): void => {
    if (Object.values(params).includes(null) || Object.values(params).includes(undefined)) {
      const message = `${this.name} @ attach - params are required`;

      this.logger.log(message);
      throw new Error(message);
    }

    this.logger.log('attached');

    const { eventBus, useStore, ioc } = params;
    this.useStore = useStore.bind(this);
    this.room = ioc.createRoom(this.name);
    this.presence3DManager = new Presence3DManager(this.room, this.useStore);
    this.matterportEvents.setPresence3DManager(this.presence3DManager);

    const { localParticipant, hasJoinedRoom } = this.useStore(STORE_TYPES.GLOBAL);
    localParticipant.subscribe();
    hasJoinedRoom.subscribe();

    const { hasJoined3D, participants } = this.useStore(STORE_TYPES.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);

    this.isAttached = true;
    this.eventBus = eventBus;

    this.participantManager.setUseStoreObject(this.useStore);
    this.participantManager.setPresence3DManager(this.presence3DManager);

    this.start();
  };

  public detach = (): void => {
    if (!this.isAttached) {
      this.logger.log(`${this.name} @ detach - component is not attached}`);
      return;
    }

    this.logger.log('detached');
    this.destroy();
    this.unsubscribeFrom.forEach((unsubscribe) => unsubscribe(this));

    this.localParticipant = undefined;
    this.isAttached = false;
  };

  public goTo = (participantId: string): void => {
    this.logger.log('matterport component @ goTo', participantId);

    this.moveToAnotherParticipant(participantId);
  };

  public gather = (): void => {
    this.logger.log('matterport component @ gather');
    this.room.emit(Presence3dEvents.GATHER, { id: this.localParticipant.id });
  };

  public follow = (participantId?: string): void => {
    this.logger.log('matterport component @ follow');
    this.room.emit(Presence3dEvents.FOLLOW_ME, { id: participantId });
  };

  public localFollow = (participantId?: string): void => {
    this.localFollowParticipantId = participantId;
  };

  private addParticipant = async (participant): Promise<void> => {
    const participantOn3D = await this.participantManager.addParticipant(participant);

    if (!participantOn3D) return;

    if (this.localParticipantId === participantOn3D.id) return;

    if (!this.isEmbedMode) {
      // IF AVATARS ARE ENABLED, CREATE THE AVATAR
      this.config.isAvatarsEnabled && this.createAvatar(participantOn3D);

      // IF LASER IS ENABLED, CREATE THE LASER
      this.config.isLaserEnabled && this.createLaser(participantOn3D);
    }
  };

  /*
  Gather, goto and follow ::
  */

  private onGatherUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    this.logger.log('three js component @ onGatherUpdate', event.data.id);

    if (event.data.id === this.localParticipantId) return;

    this.eventBus.publish('realtime.go-to-participant', event.data.id);
  };

  private onFollowParticipantUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    if (event.data.id === this.localParticipantId) return;
    this.followParticipantId = event.data.id;
    this.moveToAnotherParticipant(event.data.id);
  };

  private moveToAnotherParticipant = (participantId: string): void => {
    if (
      !this.positionInfos[participantId] ||
      !this.isAttached ||
      participantId === this.localParticipantId
    ) {
      return;
    }

    this.movementManager.moveToParticipant(participantId, this.positionInfos[participantId]);
  };

  /*
  Internal SDK Start and destroy
  */
  private start = (): void => {
    if (!this.hasJoinedRoom || !this.hasJoined3D) {
      this.logger.log('matterport component @ start - not joined yet');

      setTimeout(() => {
        this.logger.log('matterport component @ start - retrying');
        this.start();
      }, 1000);

      return;
    }

    this.subscribeToRealtimeEvents();
    this.subscribeToEventBusEvents();
    this.participantManager.createParticipantList();
  };

  private destroy = (): void => {
    this.unsubscribeToRealtimeEvents();
    this.unsubscribeToEventBusEvents();
    this.room.disconnect();
    this.room = undefined;
    this.participants.forEach((participant) => {
      this.participantManager.removeParticipant(participant, true);
    });

    this.presence3DManager = undefined;

    this.useStore(STORE_TYPES.PRESENCE_3D).destroy();
    this.useStore = undefined;

    this.isAttached = false;
    this.sceneLight.destroy();

    this.intervalManager.clearAll();

    this.participants = [];
    this.avatars = {};
    this.lasers = {};

    // Clean up vectors
    this.cleanupVectorCache();

    this.laserManager.clearAllIntervals();
    this.circlePositionManager.getCirclePositions().length = 0;

    this.movementManager.destroy();
  };

  /*
  Avatar Creation and destruction
  */

  private async createAvatar(participant: ParticipantOn3D) {
    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const avatarModel: AvatarTypes = sceneObject.addNode();

    this.avatars[participant.id] = avatarModel;

    return new Promise((resolve) => {
      avatarModel.avatar = avatarModel.addComponent('avatar', {
        url: participant.avatar?.model3DUrl ?? DEFAULT_AVATAR_URL,
        participant,
        avatarModel,
        matterportSdk: this.matterportSdk,
        onCameraMove: (position, rotation) => {
          console.log('Avatar camera move:', { position, rotation });
          this.matterportEvents.onCameraMove(position, rotation);
        },
        roomParticipants: this.roomParticipants,
      });
      avatarModel.start();
      resolve(avatarModel);
    });
  }

  private async destroyAvatar(participant: ParticipantOn3D) {
    this.logger.log('matterport component @ destroyAvatar', participant);

    if (this.avatars[participant.id]) {
      const avatar = this.avatars[participant.id];
      if (avatar.avatar) {
        avatar.avatar.destroy();
      }
      avatar.stop();
      delete this.avatars[participant.id];
    }
  }

  /*
  Laser Creation and destruction
  */

  private async createLaser(participant: ParticipantOn3D) {
    if (!this.isAttached || !this.matterportSdk.Scene || !this.config.isLaserEnabled) return;

    const laser = await this.laserManager.createLaser(
      participant,
      this.config,
      this.matterportSdk,
      this.maxDistanceSquared,
      this.lasers,
    );

    if (laser) {
      this.lasers[participant.id] = laser;
    }
  }

  private async destroyLaser(participant: ParticipantOn3D) {
    this.logger.log('matterport component @ destroyLaser', participant);

    if (this.lasers[participant.id]) {
      this.lasers[participant.id].stop();
      delete this.lasers[participant.id];
    }
  }

  /*
 Circle of positions
*/
  private adjustMyPositionToCircle = (position?: Coordinates): Coordinates => {
    this.localSlot = this.localParticipant?.slot?.index ?? -1;
    return this.circlePositionManager.adjustPositionToCircle(position, this.localSlot);
  };

  private createCircleOfPositions(): void {
    const allParticipants = [...this.participantManager.getParticipants, this.localParticipant];
    this.circlePositionManager.createCircleOfPositions(allParticipants);
    if (this.matterportEvents.getCurrentPosition()) {
      this.adjustMyPositionToCircle(this.matterportEvents.getCurrentPosition());
    } else {
      this.adjustMyPositionToCircle({ x: 0, y: 0, z: 0 });
    }
  }

  /*
  Matterport Events
  */
  private subscribeToMatterportEvents(): void {
    this.matterportEvents = new MatterportEvents(
      this.matterportSdk,
      this.presence3DManager,
      this.adjustMyPositionToCircle,
      () => this.localParticipantId,
      this.isPrivate,
    );
    this.matterportEvents.subscribeToMatterportEvents();
  }

  /*
  Realtime Events
  */
  private subscribeToRealtimeEvents = (): void => {
    this.logger.log('matterport component @ subscribeToRealtimeEvents');
    this.room.on<Participant>(
      Presence3dEvents.PARTICIPANT_JOINED,
      this.participantManager.onParticipantJoined,
    );
    this.room.presence.on(
      'presence.leave' as PresenceEvents,
      this.participantManager.onParticipantLeave,
    );
    this.room.on<{ id?: string }>(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.on<{ id?: string }>(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  private unsubscribeToRealtimeEvents = (): void => {
    this.logger.log('matterport component @ unsubscribeToRealtimeEvents');
    this.room.presence.off('presence.leave' as PresenceEvents);
    this.room.off(Presence3dEvents.PARTICIPANT_JOINED, this.participantManager.onParticipantJoined);
    this.room.off(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.off(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  /*
  Event Bus
  */
  private subscribeToEventBusEvents = (): void => {
    this.logger.log('matterport component @ subscribeToEventBusEvents');
    this.eventBus.subscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.subscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.subscribe('realtime.follow-participant', this.follow);
    this.eventBus.subscribe('realtime.private-mode', this.setPrivate);
  };

  private unsubscribeToEventBusEvents = (): void => {
    this.logger.log('matterport component @ unsubscribeToEventBusEvents');
    this.eventBus.unsubscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.unsubscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.unsubscribe('realtime.private-mode', this.setPrivate);
    this.eventBus.unsubscribe('realtime.follow-participant', this.follow);
  };

  /*
  Input Component
  */
  private addInputComponent = async (): Promise<void> => {
    if (!this.matterportSdk.Scene) return;

    const [mpInputObject] = await this.matterportSdk.Scene.createObjects(1);
    const mpInputNode = mpInputObject.addNode();
    this.mpInputComponent = mpInputNode.addComponent('mp.input', {
      eventsEnabled: false,
      userNavigationEnabled: true,
    });
    mpInputNode.start();
  };

  private get localParticipantId(): string {
    return this.localParticipant?.id;
  }

  private async initializeSceneBounds(): Promise<void> {
    const { sweeps } = await this.matterportSdk.Model.getData();

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    // Find min/max coordinates from all sweep positions
    sweeps.forEach((sweep) => {
      minX = Math.min(minX, sweep.position.x);
      maxX = Math.max(maxX, sweep.position.x);
      minZ = Math.min(minZ, sweep.position.z);
      maxZ = Math.max(maxZ, sweep.position.z);
    });

    // Calculate diagonal distance of the scene
    const dx = maxX - minX;
    const dz = maxZ - minZ;
    const diagonalSquared = dx * dx + dz * dz;

    // Set MAX_DIST_SQUARED to a portion of the diagonal (e.g., 1/4)
    this.maxDistanceSquared = diagonalSquared / 4;
  }

  private setPrivate = (isPrivate: boolean): void => {
    this.logger.log('matterport component @ private mode');
    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      isPrivate: !!isPrivate,
    } as ParticipantDataInput);

    this.isPrivate = !!isPrivate;
  };

  private cleanupVectorCache(): void {
    this.vectorCache.cleanup();
  }
}
