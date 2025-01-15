import { Participant, Presence3DManager } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { Room } from '@superviz/socket-client';
import { isEqual } from 'lodash';
import { Quaternion, Vector3 } from 'three';

import { Avatar, AvatarsConstants, Name } from '../common/types/avatars.types';
import {
  CirclePosition,
  Coordinates,
  DefaultCoordinates,
  Simple2DPoint,
} from '../common/types/coordinates.types';
import { Laser } from '../common/types/lasers.types';
import type { MpSdk as Matterport, Rotation } from '../common/types/matterport.types';
import { Logger } from '../common/utils/logger';
import AvatarLerper from '../components/AvatarLerper';
import AvatarName from '../components/AvatarName';
import LaserPointer from '../components/LaserPointer';
import { MatterportComponentOptions, Mode, ParticipantOn3D, PositionInfo } from '../types';

import { MatterportEvents } from './matterport/matterport-events';
import { RealtimeEvents } from './realtime/realtime-events';
import { Presence3dEvents } from './types';

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
import { SceneLight } from './matterport/scene-light';

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

  private avatars: Record<string, Avatar> = {};
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
  private realtimeEvents: RealtimeEvents;

  private isEmbedMode: boolean = false;

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
    } else {
      this.isEmbedMode = false;
    }

    // input control
    this.addInputComponent();

    // get THREE from Matterport through SceneLight
    this.sceneLight = new SceneLight(this.matterportSdk);
    this.sceneLight.addSceneLight().then(() => {
      this.THREE = this.sceneLight.getTHREE();
    });

    this.createCircleOfPositions();
  }

  /* CREATE NAME IF USER HAS AN AVATAR */
  private async createNameForAvatars(participant: ParticipantOn3D, avatarModel) {
    if (!avatarModel) return;

    const threeVersion = Number(this.THREE.REVISION);

    const url = participant.avatar?.model3DUrl ?? AvatarsConstants.DEFAULT_AVATAR_URL;
    const isDefaultAvatar = url?.includes('readyplayerme');

    const nameInstance: Name = avatarModel.avatarName;

    console.log('nameInstance', nameInstance);
    console.log('avatarModel', avatarModel);

    const slot = participant.slot ?? this.roomParticipants[participant.id]?.slot;

    const boundingBox = new this.THREE.Box3().setFromObject(avatarModel.obj3D);
    const size = new Vector3(0, 0, 0);
    boundingBox.getSize(size);
    let nameHeight;

    // max compatibility with old matterport versions
    if (threeVersion <= 146) {
      nameHeight = boundingBox.min.y - avatarModel.position.y + size.y * 1.1;
    } else {
      nameHeight = size.y * 1.2;

      if (isDefaultAvatar) {
        nameHeight = size.y * 4.1;
      }
    }

    nameInstance.createName(avatarModel.obj3D, 'Peter', slot, nameHeight);
  }

  private async createAvatar(participant: ParticipantOn3D) {
    this.logger.log('matterport component @ createAvatar', participant);

    if (!this.isAttached || !this.matterportSdk.Scene) return;

    const scale: number = participant?.avatarConfig?.scale || 0.55;
    const height: number = participant?.avatarConfig?.height || 0.25;

    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const avatarModel: Avatar = sceneObject.addNode();
    const rotation: Coordinates = DefaultCoordinates;

    avatarModel.obj3D.rotation.set(rotation.x, rotation.y, rotation.z);
    avatarModel.obj3D.name = 'avatar';
    avatarModel.obj3D.userData = {
      uuid: participant.id,
      name: participant.name,
      height,
    };

    const url = participant.avatar?.model3DUrl ?? AvatarsConstants.DEFAULT_AVATAR_URL;
    const localScale = { x: scale, y: scale, z: scale };

    avatarModel.lerper = avatarModel.addComponent('lerper');
    avatarModel.avatarName = avatarModel.addComponent('name');
    this.avatars[participant.id] = avatarModel;

    return new Promise((resolve) => {
      avatarModel.addComponent('mp.gltfLoader', {
        url,
        localScale,
        onLoaded: () => {
          if (this.matterportEvents) {
            this.matterportSdk.Camera.getPose().then((pose) => {
              this.matterportEvents.onCameraMove(pose.position, pose.rotation);
            });
          } else {
            // TODO: FIGURE THIS OUT
          }
          this.createNameForAvatars(participant, avatarModel);
          resolve(avatarModel);
        },
      });
      avatarModel.start();
    });
  }

  private async createLaser(participant: ParticipantOn3D) {
    if (!this.isAttached || !this.matterportSdk.Scene || !this.config.isLaserEnabled) return;

    console.log('Creating laser for participant:', participant);

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
    this.realtimeEvents?.unsubscribeFromRealtimeEvents();
    this.realtimeEvents?.unsubscribeFromEventBusEvents();
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

    this.matterportEvents = new MatterportEvents(
      this.matterportSdk,
      this.presence3DManager,
      this.localParticipantId,
      this.adjustMyPositionToCircle,
    );
    this.matterportEvents.subscribeToMatterportEvents();

    this.realtimeEvents = new RealtimeEvents(
      this.room,
      this.eventBus,
      this.logger,
      this.matterportSdk,
      this.localParticipantId,
      this.positionInfos,
      this.mpInputComponent,
    );

    this.realtimeEvents.subscribeToRealtimeEvents();
    this.realtimeEvents.subscribeToEventBusEvents();

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
      this.config.isAvatarsEnabled && (await this.createAvatar(participantOn3D));

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
      if (this.avatars[participantId] && position && rotation) {
        this.updateAvatar(this.avatars[participantId], position, rotation);
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

  private updateAvatar(remoteAvatar: Avatar, position: Coordinates, rotation: Simple2DPoint) {
    if (!this.isAttached) {
      return;
    }
    // convert from 2 vector angle to quaternion
    const XVector3: Vector3 = new this.THREE.Vector3(1, 0, 0);
    const YVector3: Vector3 = new this.THREE.Vector3(0, 1, 0);
    const quaternionX: Quaternion = new this.THREE.Quaternion().setFromAxisAngle(
      XVector3,
      this.THREE.MathUtils.degToRad(-rotation.x),
    );
    const quaternionY: Quaternion = new this.THREE.Quaternion().setFromAxisAngle(
      YVector3,
      this.THREE.MathUtils.degToRad(rotation?.y) + Math.PI,
    );
    const { lerper } = remoteAvatar;
    lerper.animateQuaternion(remoteAvatar.obj3D.quaternion, quaternionY.multiply(quaternionX));

    // add synced height
    const addedHeight = parseFloat(remoteAvatar?.obj3D?.userData?.height ?? 0.0);

    const addY: number = addedHeight - AvatarsConstants.AVATARS_HEIGHT_ADJUST;
    const localPosVec: Vector3 = new this.THREE.Vector3(
      this.currentCirclePosition.x,
      0,
      this.currentCirclePosition.z,
    );
    const avatarPosVec: Vector3 = new this.THREE.Vector3(position?.x, 0, position?.z);
    const adjustPosVec: Vector3 = avatarPosVec.sub(localPosVec);
    adjustPosVec.y = position.y + addY;
    lerper.animateVector(remoteAvatar.obj3D.position, adjustPosVec);
  }

  private async updateLaser(
    userId: string,
    remoteAvatar: Avatar | null,
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
        y: lerper.curPos.y,
        z: lerper.curPos.z,
      };

      this.tempQuaternion.setFromEuler(
        new this.THREE.Euler(participantInfo.rotation.x, participantInfo.rotation.y, 0, 'XYZ'),
      );
    }

    if (laserInstance) {
      // Calculate distance-based name height
      const dx = cameraPosition.x - position.x;
      const dz = cameraPosition.z - position.z;
      const distanceSquared = dx * dx + dz * dz;

      const nameHeight =
        MIN_NAME_HEIGHT +
        (Math.min(Math.max(distanceSquared - MIN_DIST_SQUARED, 0), MAX_DIST_SQUARED) /
          MAX_DIST_SQUARED) *
          (MAX_NAME_HEIGHT - MIN_NAME_HEIGHT);

      const { slot } = participant;
      laserInstance.updateGeometry(
        position,
        laserDestinationPosition,
        true,
        true,
        slot,
        this.tempQuaternion,
        nameHeight, // Pass nameHeight to LaserPointer
      );
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

      this.config.isAvatarsEnabled && (await this.createAvatar(participantOn3D));
      this.config.isLaserEnabled && this.createLaser(participantOn3D);
      this.config.isNameEnabled &&
        this.createNameForAvatars(participantOn3D, this.avatars[participant.id]);
    } else {
      const index = this.participants.findIndex((u) => u.id === participant.id);
      if (index !== -1) {
        this.participants[index] = participant;
      }
    }
  };
}
