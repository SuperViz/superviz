import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';
import { isEqual } from 'lodash';
import { Quaternion, Vector3 } from 'three';

import {
  AVATAR_LASER_HEIGHT_OFFSET,
  NO_AVATAR_LASER_HEIGHT,
  SWEEP_DURATION,
  MIN_NAME_HEIGHT,
  MAX_NAME_HEIGHT,
  MIN_DIST_SQUARED,
  MAX_DIST_SQUARED,
} from '../common/constants/presence';
import { STORE_TYPES } from '../common/constants/store';
import { AvatarObject, AvatarsConstants, Name } from '../common/types/avatarsObject.types';
import {
  CirclePosition,
  Coordinates,
  DefaultCoordinates,
  Simple2DPoint,
} from '../common/types/coordinates.types';
import { Laser } from '../common/types/lasers.types';
import type { MpSdk as Matterport, Rotation } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import Avatar3D from '../components/Avatar3D';
import AvatarLerper from '../components/AvatarLerper';
import AvatarName from '../components/AvatarName';
import LaserPointer from '../components/LaserPointer';
import { MatterportComponentOptions, Mode, ParticipantOn3D, PositionInfo } from '../types';

import { MatterportEvents } from './matterport/matterport-events';
import { SceneLight } from './matterport/scene-light';
import { Presence3dEvents } from './types';

export class Presence3D {
  public name: string;

  private room: Room;
  private useStore: typeof useStore;
  private presence3DManager: Presence3DManager;
  private localParticipant: Participant;
  private isPrivate: boolean;

  private eventBus: EventBus;
  private logger: Logger;
  private config: MatterportComponentOptions;
  private participants: ParticipantOn3D[] = [];
  private roomParticipants: Record<string, Participant> = {};

  private isAttached = false;
  private followParticipantId?: string;
  private localFollowParticipantId?: string;

  private matterportSdk: Matterport;
  private localSlot: number = -1;

  private currentCirclePosition: Partial<Vector3> = DefaultCoordinates;
  private circlePositions: CirclePosition[] = [];

  private THREE;
  private sceneLight: SceneLight;

  private avatars: Record<string, AvatarObject> = {};
  private lasers: Record<string, Laser> = {};
  private laserUpdateIntervals = {};
  private positionInfos: Record<string, PositionInfo> = {};

  private tempQuaternion: Quaternion = new Quaternion(0, 0, 0, 0);
  private mpInputComponent: Matterport.Scene.IComponent;
  private isSweeping: boolean = false;

  private unsubscribeFrom: Array<(id: unknown) => void> = [];
  private hasJoinedRoom: boolean = false;
  private hasJoined3D: boolean = false;

  private laserLerpers: Record<string, any> = {};
  private names: Record<string, any> = {};

  private matterportEvents: MatterportEvents;

  private isEmbedMode: boolean = false;

  private currentLocalPosition: Coordinates = DefaultCoordinates;
  private currentLocalRotation: Coordinates = DefaultCoordinates;
  private currentLocalFloorId: number;
  private currentLocalMode: Matterport.Mode.Mode;
  private currentLocalLaserDest: Coordinates = DefaultCoordinates;
  private currentSweepId: string;

  private maxDistanceSquared: number;

  constructor(matterportSdk: Matterport, options?: MatterportComponentOptions) {
    this.name = 'presence3dMatterport';
    this.logger = new Logger('@superviz/sdk/matterport-component');

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

    // if it's using embed mode, that's no have Scene
    if (this.matterportSdk.Scene) {
      this.matterportSdk.Scene.register('lerper', AvatarLerper);
      this.matterportSdk.Scene.register('name', AvatarName);
      this.matterportSdk.Scene.register('laser', LaserPointer);
      this.matterportSdk.Scene.register('avatar3d', Avatar3D);
    } else {
      this.isEmbedMode = true;
    }

    // input control
    this.addInputComponent();

    // REDO ::
    this.sceneLight = new SceneLight(this.matterportSdk);
    this.sceneLight.addSceneLight().then(() => {
      this.THREE = this.sceneLight.getTHREE();
    });

    this.createCircleOfPositions();

    this.subscribeToMatterportEvents();

    // Get scene bounds from sweep positions
    this.matterportSdk.Model.getData().then(({ sweeps }) => {
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
    });
  }

  private async createAvatar3D(participant: ParticipantOn3D) {
    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const avatarModel: AvatarObject = sceneObject.addNode();

    this.avatars[participant.id] = avatarModel;

    return new Promise((resolve) => {
      avatarModel.avatar = avatarModel.addComponent('avatar3d', {
        url: participant.avatar?.model3DUrl ?? AvatarsConstants.DEFAULT_AVATAR_URL,
        participant,
        avatarModel,
        matterportSdk: this.matterportSdk,
        matterportEvents: this.matterportEvents,
        roomParticipants: this.roomParticipants,
      });
      avatarModel.start();
      resolve(avatarModel);
    });
  }

  private async createLaser(participant: ParticipantOn3D) {
    if (!this.isAttached || !this.matterportSdk.Scene || !this.config.isLaserEnabled) return;

    let laserOrigin: Vector3;

    if (this.config.isAvatarsEnabled && participant.avatarConfig?.laserOrigin) {
      laserOrigin = new Vector3(
        participant.avatarConfig.laserOrigin.x,
        participant.avatarConfig.laserOrigin.y,
        participant.avatarConfig.laserOrigin.z,
      );
    } else {
      laserOrigin = new Vector3(0, 0, 0);
    }

    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const laser: Laser = sceneObject.addNode();

    return new Promise((resolve) => {
      // Create laser pointer first
      laser.laserPointer = laser.addComponent('laser', { origin: laserOrigin });

      laser.laserPointer.onInitCallback = () => {
        laser.avatarName = laser.addComponent('name');

        const slot = participant.slot ?? this.roomParticipants[participant.id]?.slot;

        // only create name if avatars are not enabled
        if (!this.config.isAvatarsEnabled) {
          const nameInstance: Name = laser.avatarName;
          const nameHeight = MIN_NAME_HEIGHT;
          nameInstance.createName(laser.laserPointer.group, participant.name, slot, nameHeight);
          laser.laserPointer.setNameComponent(laser.avatarName);
        }

        laser.obj3D.userData = { uuid: participant.id };
        this.lasers[participant.id] = laser;
        resolve(laser);
      };

      // Only start once
      laser.start();
    });
  }

  private onParticipantLeave = (event: PresenceEvent<Participant>): void => {
    this.logger.log('matterport component @ onParticipantLeave', event.data);
    console.log('onParticipantLeave :!', event.data);
    const participantToRemove = this.participants.find(
      (participantOnlist) => participantOnlist.id === event.id,
    );

    if (!participantToRemove) return;

    this.removeParticipant(participantToRemove, true);
  };

  private get localParticipantId(): string {
    return this.localParticipant?.id;
  }

  /**
   * @function attach
   * @description attach component
   * @returns {void}
   */
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

    const { localParticipant, hasJoinedRoom } = this.useStore(STORE_TYPES.GLOBAL);
    localParticipant.subscribe();
    hasJoinedRoom.subscribe();

    const { hasJoined3D, participants } = this.useStore(STORE_TYPES.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);

    this.isAttached = true;
    this.eventBus = eventBus;

    this.start();
  };

  /*
   * @function detach
   * @description detach component
   * @returns {void}
   * */
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

  private destroy = (): void => {
    this.unsubscribeToRealtimeEvents();
    this.unsubscribeToEventBusEvents();
    this.room.disconnect();
    this.room = undefined;
    this.participants.forEach((participant) => {
      this.presence3DManager.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    });

    this.presence3DManager = undefined;

    this.useStore(STORE_TYPES.PRESENCE_3D).destroy();
    this.useStore = undefined;

    this.isAttached = false;
    this.sceneLight.destroy();

    this.participants.forEach((participant) => {
      this.removeParticipant(participant, true);
    });

    Object.keys(this.laserUpdateIntervals).forEach((key) => {
      clearInterval(this.laserUpdateIntervals[key]);
    });

    this.participants = [];
    this.laserUpdateIntervals = {};
    this.avatars = {};
    this.lasers = {};
    // this.nameService?.destroyAll();
  };

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
    this.createParticipantList();
  };

  /** Participants */

  private createParticipantList = () => {
    const list = this.useStore(STORE_TYPES.PRESENCE_3D).participants.value;

    Object.values(list).forEach((participant: ParticipantDataInput) => {
      if (participant.isPrivate) return;
      this.addParticipant(participant);
    });

    this.logger.log('matterport component @ createParticipantList', this.participants);
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

    this.logger.log('matterport component @ createParticipantOn3D', participant);

    return participant;
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
      this.presence3DManager?.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    }

    this.createCircleOfPositions();
  };

  private addParticipant = async (participant): Promise<void> => {
    if (!participant || !participant.id || participant.type === 'audience') return;
    const participantOn3D = this.createParticipantOn3D(participant);

    if (this.participants.find((p) => p.id === participantOn3D.id)) {
      this.logger.log('matterport component @ addParticipant - participant already exists');
      this.onParticipantUpdated(participant);
      return;
    }

    this.participants.push(participantOn3D);
    this.roomParticipants[participant.id] = participant;
    this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);

    if (this.localParticipantId === participantOn3D.id) return;

    if (!this.isEmbedMode) {
      // IF AVATARS ARE ENABLED, CREATE THE AVATAR
      //  this.config.isAvatarsEnabled && (await this.createAvatar(participantOn3D));

      this.config.isAvatarsEnabled && this.createAvatar3D(participantOn3D);

      // IF LASER IS ENABLED, CREATE THE LASER
      this.config.isLaserEnabled && this.createLaser(participantOn3D);
    }

    this.createCircleOfPositions();
  };

  /**
   * @function goTo
   * @description go to a participant
   * @param participantId - participant id to go to
   * @returns {void}
   */
  public goTo = (participantId: string): void => {
    this.logger.log('matterport component @ goTo', participantId);

    this.moveToAnotherParticipant(participantId);
  };

  /**
   * @function gather
   * @description gather all participants
   * @returns {void}
   */
  public gather = (): void => {
    this.logger.log('matterport component @ gather');
    this.room.emit(Presence3dEvents.GATHER, { id: this.localParticipant.id });
  };

  /**
   * @function setPrivate
   * @param {boolean} isPrivate
   * @description updates participant private status
   * @returns {void}
   */
  private setPrivate = (isPrivate: boolean): void => {
    this.isPrivate = isPrivate;
    this.matterportEvents.setPrivate(isPrivate);
  };

  /**
   * @function follow
   * @description follow a participant
   * @param participantId - participant id to follow, if not provided, follow is disabled
   * @returns {void}
   */
  public follow = (participantId?: string): void => {
    this.logger.log('matterport component @ follow');
    this.room.emit(Presence3dEvents.FOLLOW_ME, { id: participantId });
  };

  /**
   * @function localFollow
   * @description follow a unique participant
   * @param participantId - participant id to follow, if not provided, follow is disabled
   * @returns {void}
   */
  private localFollow = (participantId?: string): void => {
    this.localFollowParticipantId = participantId;
  };

  /** Matterport */

  private async destroyAvatar(participant: ParticipantOn3D) {
    this.logger.log('matterport component @ destroyAvatar', participant);

    // TODO : Call Avatar3D destroy

    if (this.avatars[participant.id]) {
      this.avatars[participant.id].stop();
      delete this.avatars[participant.id];
    }
  }

  private async destroyLaser(participant: ParticipantOn3D) {
    this.logger.log('matterport component @ destroyLaser', participant);

    if (this.lasers[participant.id]) {
      this.lasers[participant.id].stop();
      delete this.lasers[participant.id];
    }
  }

  private moveToAnotherParticipant = (participantId: string): void => {
    if (
      !this.positionInfos[participantId] ||
      !this.isAttached ||
      participantId === this.localParticipantId
    ) {
      return;
    }
    const { mode, sweep } = this.positionInfos[participantId];

    if (mode === Mode.INSIDE && sweep) {
      const rotation: Rotation = this.positionInfos[participantId].rotation || {
        x: 0,
        y: 0,
      };

      this.moveToSweep(sweep, rotation);
    }

    if (mode === Mode.DOLLHOUSE || mode === Mode.FLOORPLAN) {
      const transition = this.matterportSdk.Mode.TransitionType.FLY;
      const { position, rotation, floor } = this.positionInfos[participantId];
      this.matterportSdk.Mode.moveTo(mode, {
        position,
        rotation,
        transition,
        zoom: 25,
      }).then((nextMode) => {
        this.matterportEvents.setMode(nextMode);
      });

      if (mode === Mode.FLOORPLAN && this.matterportEvents.getCurrentFloorId() !== floor) {
        if (floor === -1) {
          this.matterportSdk.Floor.showAll();
        } else {
          this.matterportSdk.Floor.moveTo(floor).then(() => {
            this.matterportEvents.setFloor(floor);
          });
        }
      }
    }
  };

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

  private adjustMyPositionToCircle = (position?: Coordinates): Coordinates => {
    if (!this.presence3DManager || !position) {
      return position || DefaultCoordinates;
    }

    this.localSlot = this.localParticipant.slot?.index ?? -1;

    if (!this.THREE || this.localSlot === -1) {
      return position;
    }

    const calculatedPos = new this.THREE.Vector3(position.x, position.y, position.z);
    const positionInTheCircle = this.circlePositions.find(
      (position) => position.slot === this.localSlot,
    );

    if (!positionInTheCircle) {
      return position;
    }

    if (!this.currentCirclePosition?.isVector3) {
      this.currentCirclePosition = new this.THREE.Vector3(
        positionInTheCircle.x,
        position.y,
        positionInTheCircle.z,
      );
    }

    this.currentCirclePosition.set(positionInTheCircle.x, position.y, positionInTheCircle.z);

    calculatedPos.add(
      this.currentCirclePosition.multiplyScalar(AvatarsConstants.DISTANCE_BETWEEN_AVATARS),
    );

    return { x: calculatedPos.x, y: position.y, z: calculatedPos.z };
  };

  private createCircleOfPositions(): void {
    this.circlePositions = [];
    const participants = [...Object.values(this.participants), this.localParticipant].sort(
      (a, b) => {
        return (a.slot?.index || 0) - (b.slot?.index || 0);
      },
    );

    const participantCount = participants.length;
    if (participantCount === 0) return;

    const radius = Math.max(participantCount * 0.3, 2);
    const angleStep = (2 * Math.PI) / participantCount;

    for (let i = 0; i < participantCount; i++) {
      const angle = i * angleStep;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      this.circlePositions.push({ x, y: 0, z, slot: participants[i]?.slot?.index ?? -1 });
    }

    this.adjustMyPositionToCircle(this.matterportEvents?.getCurrentPosition());
    this.logger.log('Updated circle positions:', this.circlePositions);
  }

  private onParticipantsUpdated = (participants) => {
    if (!this.isAttached) return;

    this.logger.log('matterport component @ onParticipantsUpdated', participants);

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

      if (isPrivate && this.avatars[participantId]) {
        this.removeParticipant(participant, true);
      }

      if (!isPrivate && !this.avatars[participantId]) {
        this.addParticipant(participant);
      }
      // Update avatar if it exists
      if (this.avatars[participantId] && position && rotation && this.isAttached) {
        const avatarModel = this.avatars[participantId];
        avatarModel.avatar.update(position, rotation, this.currentCirclePosition);
      }

      // Update laser independently
      const remoteLaser = this.lasers[participantId];
      if (remoteLaser && position) {
        if (this.laserUpdateIntervals[participantId]) {
          clearInterval(this.laserUpdateIntervals[participantId]);
        }
        this.laserUpdateIntervals[participantId] = setInterval(async () => {
          await this.updateLaser(
            participantId,
            this.avatars[participantId],
            remoteLaser,
            participant.laser,
          );
        }, 16);
      }
    });
  };

  private moveToSweep(sweepId: string, rotation: Rotation) {
    if (this.isSweeping || !this.isAttached) {
      return;
    }
    if (this.mpInputComponent) {
      this.mpInputComponent.inputs.userNavigationEnabled = false;
    }
    this.isSweeping = true;
    this.matterportSdk.Sweep.moveTo(sweepId, {
      transitionTime: SWEEP_DURATION,
      transition: this.matterportSdk.Sweep.Transition.FLY,
      rotation: rotation || this.matterportEvents.getCurrentRotation(),
    })
      .catch((e) => {
        console.log('[SuperViz] Error when trying to sweep', e);
      })
      .finally(() => {
        this.isSweeping = false;
        if (this.mpInputComponent) {
          this.mpInputComponent.inputs.userNavigationEnabled = true;
        }
      });
  }

  private async updateLaser(
    userId: string,
    remoteAvatar: AvatarObject | null,
    remoteLaser: Laser,
    laserDestinationPosition: Coordinates,
  ) {
    const participant = this.roomParticipants[userId];
    if (!remoteLaser || !laserDestinationPosition || !this.isAttached || !participant) {
      return;
    }

    const laserInstance = remoteLaser.laserPointer;
    let position: Coordinates;

    // Get current camera position for distance calculation
    const currentPose = await this.matterportSdk.Camera.getPose();
    const cameraPosition = currentPose.position;

    if (remoteAvatar) {
      const { x, y, z } = remoteAvatar.obj3D.position;
      position = { x, y: y + AVATAR_LASER_HEIGHT_OFFSET, z };
      remoteAvatar.obj3D.getWorldQuaternion(this.tempQuaternion);
    } else {
      const participantInfo = this.positionInfos[userId];

      // Create lerper if it doesn't exist
      if (!this.laserLerpers[userId]) {
        const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
        const lerperNode = sceneObject.addNode();
        this.laserLerpers[userId] = lerperNode.addComponent('lerper');
        this.laserLerpers[userId].speed = 0.95;
        lerperNode.start();
      }

      const lerper = this.laserLerpers[userId];
      if (!lerper.curPos) {
        lerper.curPos = new this.THREE.Vector3(
          participantInfo.position.x,
          NO_AVATAR_LASER_HEIGHT,
          participantInfo.position.z,
        );
      }

      // Lerp to new position
      lerper.animateVector(
        lerper.curPos,
        new this.THREE.Vector3(
          participantInfo.position.x,
          NO_AVATAR_LASER_HEIGHT,
          participantInfo.position.z,
        ),
      );

      position = {
        x: lerper.curPos.x,
        y: NO_AVATAR_LASER_HEIGHT, // Keep laser at fixed height
        z: lerper.curPos.z,
      };

      this.tempQuaternion.setFromEuler(
        new this.THREE.Euler(participantInfo.rotation.x, participantInfo.rotation.y, 0, 'XYZ'),
      );
    }

    if (laserInstance) {
      // Update laser position and geometry first
      const { slot } = participant;
      laserInstance.updateGeometry(
        position,
        laserDestinationPosition,
        true,
        true,
        slot,
        this.tempQuaternion,
      );

      // Then update name height separately if it exists
      if (remoteLaser.avatarName?.updateHeight) {
        const dx = cameraPosition.x - position.x;
        const dz = cameraPosition.z - position.z;
        const distanceSquared = dx * dx + dz * dz;

        const nameHeight =
          MIN_NAME_HEIGHT +
          (Math.min(Math.max(distanceSquared - MIN_DIST_SQUARED, 0), this.maxDistanceSquared) /
            this.maxDistanceSquared) *
            (MAX_NAME_HEIGHT - MIN_NAME_HEIGHT);

        remoteLaser.avatarName.updateHeight(nameHeight);
      }
    }
  }

  private onParticipantUpdated = (participant): void => {
    this.logger.log('matterport component @ onParticipantUpdated', participant);

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

    if (this.localFollowParticipantId || this.followParticipantId) {
      this.moveToAnotherParticipant(this.localFollowParticipantId ?? this.followParticipantId);
    }
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

      console.log('removed participant', participant);

      // this.config.isAvatarsEnabled && (await this.createAvatar(participantOn3D));
      // this.config.isLaserEnabled && this.createLaser(participantOn3D);
      //  this.config.isNameEnabled &&
      //    this.createNameForAvatars(participantOn3D, this.avatars[participant.id]);

      // Call createName through the avatar's component
      if (this.config.isNameEnabled && this.avatars[participant.id]) {
        const avatarModel = this.avatars[participant.id];
        avatarModel.avatar.createName(participantOn3D, avatarModel);
      }
    } else {
      const index = this.participants.findIndex((u) => u.id === participant.id);
      if (index !== -1) {
        this.participants[index] = participant;
      }
    }
  };

  private subscribeToMatterportEvents(): void {
    this.matterportSdk.Camera.pose.subscribe(this._onLocalCameraMoveObserver);
    this.matterportSdk.Pointer.intersection.subscribe(this._onLocalMouseMoveObserver);
    this.matterportSdk.Floor.current.subscribe(this._onLocalFloorChangeObserver);
    this.matterportSdk.Mode.current.subscribe(this._onLocalModeChangeObserver);
    this.matterportSdk.Sweep.current.subscribe(this._onLocalSweepChangeObserver);
  }

  private subscribeToRealtimeEvents = (): void => {
    this.logger.log('matterport component @ subscribeToRealtimeEvents');
    this.room.on<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.presence.on('presence.leave' as PresenceEvents, this.onParticipantLeave);
    this.room.on<{ id?: string }>(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.on<{ id?: string }>(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  private unsubscribeToRealtimeEvents = (): void => {
    this.logger.log('matterport component @ unsubscribeToRealtimeEvents');
    this.room.presence.off('presence.leave' as PresenceEvents);
    this.room.off(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.off(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.off(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

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

  private onParticipantJoined = (participant): void => {
    if (!participant.data) return;

    this.logger.log('matterport component @ onParticipantJoined', participant);

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
          model3DUrl: AvatarsConstants.DEFAULT_AVATAR_URL,
          imageUrl: participant?.avatar?.imageUrl,
        },
      } as ParticipantDataInput);
    }
  };

  private onGatherUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    this.logger.log('three js component @ onGatherUpdate', event.data.id);

    if (event.data.id === this.localParticipantId) return;

    this.eventBus.publish('realtime.go-to-participant', event.data.id);
  };

  private onFollowParticipantUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    if (event.data.id === this.localParticipantId) return;
    this.logger.log('three js component @ onFollowParticipantUpdate', event.data.id);
    this.followParticipantId = event.data.id;
    this.moveToAnotherParticipant(event.data.id);
  };

  private _onLocalCameraMoveObserver = ({ position, rotation, sweep }): void => {
    if (!this.presence3DManager) return;

    this.currentLocalPosition = this.adjustMyPositionToCircle(position);
    this.currentLocalRotation = rotation;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      position: this.currentLocalPosition,
      rotation: this.currentLocalRotation,
      laser: this.currentLocalLaserDest,
      sweep: this.currentSweepId,
      mode: this.currentLocalMode,
      floor: this.currentLocalFloorId,
    } as ParticipantDataInput);
  };

  private _onLocalMouseMoveObserver = (intersectionData): void => {
    if (!this.presence3DManager || this.isPrivate) return;

    this.currentLocalLaserDest = intersectionData.position;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      position: this.currentLocalPosition,
      rotation: this.currentLocalRotation,
      laser: this.currentLocalLaserDest,
      mode: this.currentLocalMode,
      sweep: this.currentSweepId,
    } as ParticipantDataInput);
  };

  private _onLocalFloorChangeObserver = (floor: Matterport.Floor.ObservableFloorData): void => {
    if (!this.presence3DManager) return;

    if (floor.id !== '') {
      this.currentLocalFloorId = parseFloat(floor.id);
    }
    if (floor.name === 'all') {
      this.currentLocalFloorId = -1;
    }

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      floor: this.currentLocalFloorId,
    } as ParticipantDataInput);
  };

  private _onLocalModeChangeObserver = (mode: Matterport.Mode.Mode): void => {
    if (!this.presence3DManager) return;

    this.currentLocalMode = mode;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      mode: this.currentLocalMode,
    } as ParticipantDataInput);
  };

  private _onLocalSweepChangeObserver = (sweep: Matterport.Sweep.ObservableSweepData): void => {
    if (!this.presence3DManager) return;

    this.currentSweepId = sweep.id;

    if (this.isPrivate) return;

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      sweep: this.currentSweepId,
    } as ParticipantDataInput);
  };
}
