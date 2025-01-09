import { Participant, Presence3DManager, StoreType } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';
import { isEqual, pickBy, identity } from 'lodash';
import {
  Box3,
  BufferGeometry,
  Camera,
  Color,
  Mesh,
  Object3D,
  Quaternion,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
} from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

import { Logger } from './common/utils/logger';
import { Avatar } from './components/Avatar';
import { AvatarName } from './components/AvatarName';
import { Laser } from './components/Laser';
import { Mouse } from './components/Mouse';
import { ThreeJsPin } from './services/comments-adapter';
import {
  ParticipantOn3D,
  PositionInfo,
  ThreeJsComponentOptions,
  Avatar as AvatarType,
  Presence3dEvents,
  Slot,
} from './types';

const DEFAULT_AVATAR: AvatarType = {
  model3DUrl: 'https://production.storage.superviz.com/readyplayerme/1.glb',
  imageUrl: 'https://production.cdn.superviz.com/static/default-avatars/1.png',
};

const storeType = {
  GLOBAL: 'global-store' as StoreType.GLOBAL,
  PRESENCE_3D: 'presence-3d-store' as StoreType.PRESENCE_3D,
};

class Presence3D {
  public name: string;

  private localParticipant: Participant;
  private eventBus: EventBus;
  private logger: Logger;
  private config: ThreeJsComponentOptions;
  private participants: ParticipantOn3D[] = [];
  private useStore: typeof useStore;
  private presence3DManager: Presence3DManager;
  private room: Room;
  private isPrivate: boolean = false;

  private isAttached = false;
  private followParticipantId?: string;
  private localFollowParticipantId?: string;
  private hasJoinedRoom: boolean;
  private hasJoined3D: boolean;

  // sync variables
  private currentLocalPointerDest: Vector3 = new Vector3(0, 0, 0);

  private scene: Scene;
  private camera: Camera;
  public player: Object3D;
  private raycaster: Raycaster;

  private avatars: Record<string, Avatar> = {};
  private lasers: Record<string, Laser> = {};
  private mouses: Record<string, Mouse> = {};
  private names: Record<string, AvatarName> = {};
  private positionInfos: Record<string, PositionInfo> = {};

  private laserUpdateIntervals = {};

  private syncInterval: ReturnType<typeof setInterval> = null;
  private tempQuat: Quaternion = new Quaternion(0, 0, 0, 0);
  private createdPointerMoveEvent: boolean;

  // object pooling
  private mouse = new Vector2(0, 0);
  private mouse3D = new Vector3(0, 0, 0);
  private worldPosition = new Vector3(0, 0, 0);
  private worldQuat = new Quaternion(0, 0, 0, 0);

  private unsubscribeFrom: Array<(id: unknown) => void> = [];

  constructor(scene: Scene, camera: Camera, player: Object3D, options?: ThreeJsComponentOptions) {
    if (typeof window === 'undefined') {
      throw new Error(
        '[SuperViz] Presence3D component cannot be initialized in a non-browser environment. Window is not defined',
      );
    }

    this.name = 'presence3dThreejs';
    this.logger = new Logger('@superviz/sdk/three-js-component');

    this.logger.log('three js component @ constructor', { scene, camera, player, options });

    this.config = {
      isAvatarsEnabled: options?.isAvatarsEnabled ?? true,
      isLaserEnabled: options?.isLaserEnabled ?? true,
      isNameEnabled: options?.isNameEnabled ?? true,
      isMouseEnabled: options?.isMouseEnabled ?? true,
      renderLocalAvatar: options?.renderLocalAvatar ?? false,
      avatarConfig: options?.avatarConfig,
    };

    this.logger.log('three js component @ constructor - config', this.config);
    // Add the extension functions
    // @ts-ignore
    BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    // @ts-ignore
    BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    // @ts-ignore
    Mesh.prototype.raycast = acceleratedRaycast;
    this.createdPointerMoveEvent = false;
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.syncInterval = setInterval(this.checkPlayerChanges, 30);
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

    this.isAttached = true;
    this.eventBus = eventBus;

    this.useStore = useStore.bind(this);
    this.room = ioc.createRoom(this.name);

    this.presence3DManager = new Presence3DManager(this.room, this.useStore);

    const { hasJoined3D, participants } = this.useStore(storeType.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);
    const { localParticipant, hasJoinedRoom } = this.useStore(storeType.GLOBAL);

    this.localParticipant = localParticipant.value;

    localParticipant.subscribe((participant) => {
      this.localParticipant = participant;
    });
    hasJoinedRoom.subscribe();

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
    this.unsubscribeFromRealtimeEvents();
    this.unsubscribeToEventBusEvents();
    this.room.disconnect();
    this.room = undefined;

    this.participants.forEach((participant) => {
      this.presence3DManager.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    });

    this.presence3DManager = undefined;

    this.useStore(storeType.PRESENCE_3D).destroy();
    this.useStore = undefined;

    this.participants.forEach((participant) => {
      this.removeParticipant(participant, true);
    });

    Object.keys(this.laserUpdateIntervals).forEach((key) => {
      clearInterval(this.laserUpdateIntervals[key]);
    });

    window.removeEventListener('pointermove', this.onPointerMove);

    clearInterval(this.syncInterval);
    this.laserUpdateIntervals = {};
    this.avatars = {};
    this.lasers = {};
    this.positionInfos = {};
  };

  private start = (): void => {
    if (!this.hasJoinedRoom || !this.hasJoined3D || !this.localParticipant) {
      this.logger.log('three js component @ start - not joined yet');

      setTimeout(() => {
        this.logger.log('three js component @ start - retrying');
        this.start();
      }, 1000);

      return;
    }

    this.subscribeToRealtimeEvents();
    this.subscribeToEventBusEvents();
  };

  private subscribeToRealtimeEvents = (): void => {
    this.logger.log('three js component @ subscribeToRealtimeEvents');
    this.room.on<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.on<{ id?: string }>(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.on<{ id?: string }>(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
    this.room.presence.on('presence.leave' as PresenceEvents, this.onParticipantLeave);
  };

  private unsubscribeFromRealtimeEvents = (): void => {
    this.logger.log('three js component @ unsubscribeFromRealtimeEvents');
    this.room.presence.off('presence.leave' as PresenceEvents);
    this.room.off<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.off(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.off(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  private subscribeToEventBusEvents = (): void => {
    this.logger.log('three js component @ subscribeToEventBusEvents');
    this.eventBus.subscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.subscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.subscribe('realtime.follow-participant', this.follow);
    this.eventBus.subscribe('realtime.private-mode', this.setPrivate);
  };

  private unsubscribeToEventBusEvents = (): void => {
    this.logger.log('three js component @ unsubscribeToEventBusEvents');
    this.eventBus.unsubscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.unsubscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.unsubscribe('realtime.follow-participant', this.follow);
    this.eventBus.unsubscribe('realtime.private-mode', this.setPrivate);
  };

  /** Realtime Callbacks */

  private onParticipantJoined = (participant): void => {
    if (!participant.data) return;

    this.logger.log('three js component @ onParticipantJoined', participant);

    const { id, name, avatar, avatarConfig, type, slot } = participant.data;

    if (id === this.localParticipantId) {
      this.onParticipantLocalJoined(participant);
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

  private onParticipantLocalJoined = (participant): void => {
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
          model3DUrl: DEFAULT_AVATAR.model3DUrl,
          imageUrl: participant?.avatar?.imageUrl,
        },
      } as ParticipantDataInput);
    }
  };

  private onParticipantLeave = (event: PresenceEvent<Participant>): void => {
    this.logger.log('three js component @ onParticipantLeave', event.data);

    const participantToRemove = this.participants.find(
      (participantOnlist) => participantOnlist.id === event.id,
    );

    if (!participantToRemove) return;

    this.removeParticipant(participantToRemove, true);
  };

  private onParticipantUpdated = (participant): void => {
    this.logger.log('three js component @ onParticipantUpdated', participant);

    const { id, name, avatar, avatarConfig, position, rotation, type, slot } =
      participant.data ?? participant;

    const participantToFollow = this.followParticipantId ?? this.localFollowParticipantId;

    if (participantToFollow && participantToFollow === id) {
      this.moveToAnotherParticipant(participantToFollow);
    }

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
  };

  private updateParticipant = async (participant): Promise<void> => {
    if (participant?.id && !this.participants?.length) {
      this.addParticipant(participant);
      return;
    }

    if (!this.participants || this.participants.length === 0 || !participant || !participant.id) return;

    const participantToBeUpdated = this.participants.find(
      (oldParticipant) => oldParticipant.id === participant.id,
    );
    if (!participantToBeUpdated && !participant.isPrivate) {
      this.addParticipant(participant);
      return;
    }

    if (
      participantToBeUpdated.avatar?.model3DUrl !== participant.avatar?.model3DUrl ||
      !isEqual(
        pickBy(participantToBeUpdated.avatarConfig, identity),
        pickBy(participant.avatarConfig, identity),
      ) ||
      participantToBeUpdated.name !== participant.name
    ) {
      this.removeParticipant(participant, false);
      const participantOn3D = this.createParticipantOn3D(participant);
      this.participants.push(participantOn3D);

      if (participantToBeUpdated.id !== this.localParticipantId || this.config.renderLocalAvatar) {
        this.create3dPresence(participantOn3D);
      }
    } else {
      const index = this.participants.findIndex((u) => u.id === participant.id);

      if (index !== -1) {
        this.participants[index] = participant;
      }
    }

    this.logger.log('three js component @ updateParticipant', {
      participant,
      participants: this.participants,
    });
  };
  /** Participants */

  private createParticipantList = () => {
    const list = this.useStore(storeType.PRESENCE_3D).participants.value;
    Object.values(list).forEach((participant: ParticipantDataInput) => {
      if (participant.isPrivate) return;

      this.addParticipant(participant);
    });

    this.logger.log('three js component @ createParticipantList', this.participants);
  };

  private createParticipantOn3D = ({
    id,
    name,
    avatar,
    avatarConfig,
    type,
    ...rest
  }): ParticipantOn3D => {
    const participant: ParticipantOn3D = {
      id,
      name,
      avatar,
      isAudience: type === 'audience',
      avatarConfig: id === this.localParticipantId ? this.config.avatarConfig : avatarConfig,
      position: {
        x: 0,
        y: 0,
        z: 0,
      } as Vector3,
      rotation: {
        x: 0,
        y: 0,
      },
      ...rest,
    };

    this.logger.log('three js component @ createParticipantOn3D', participant);

    return participant;
  };

  private removeParticipant = (participant: ParticipantOn3D, unsubscribe: boolean): void => {
    this.logger.log('three js component @ removeParticipant', { participant, unsubscribe });

    this.participants = this.participants.filter(
      (participantOnlist) => participantOnlist.id !== participant.id,
    );

    this.destroyAvatar(participant);
    this.destroyLaser(participant);
    this.destroyMouse(participant);

    if (unsubscribe) {
      this.presence3DManager?.unsubscribeFromUpdates(participant.id, this.onParticipantUpdated);
    }
  };

  private addParticipant = async (participant): Promise<void> => {
    if (
      !participant ||
      !participant.id ||
      participant.type === 'audience' ||
      !this.localParticipantId
    ) {
      return;
    }

    const participantOn3D = this.createParticipantOn3D(participant);

    if (this.participants.find((p) => p.id === participantOn3D.id)) {
      this.logger.log('three js component @ addParticipant - participant already exists');

      this.onParticipantUpdated(participant);
      return;
    }

    this.participants.push(participantOn3D);

    this.logger.log('three js component @ addParticipant', {
      participant,
      participantOn3D,
      participants: this.participants,
    });

    this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);

    // audience listens to the hosts broadcast channel
    if (
      this.localParticipantId &&
      participant.id === this.localParticipantId &&
      !this.config.renderLocalAvatar
    ) return;

    this.create3dPresence(participantOn3D);
  };

  private async create3dPresence(participantOn3D: ParticipantOn3D) {
    if (this.config.isAvatarsEnabled) {
      const model = await this.createAvatar(participantOn3D);

      // name is a child of avatar
      this.config.isNameEnabled && this.createName(participantOn3D, model);
    }

    this.config.isMouseEnabled && this.createMouse(participantOn3D);
    this.config.isLaserEnabled && this.createLaser(participantOn3D);
  }

  /**
   * @function goTo
   * @description go to a participant
   * @param participantId - participant id to go to
   * @returns {void}
   */
  public goTo = (participantId: string): void => {
    this.logger.log('three js component @ goTo', participantId);

    this.moveToAnotherParticipant(participantId);
  };

  /**
   * @function gather
   * @description gather all participants
   * @returns {void}
   */
  public gather = (): void => {
    this.logger.log('three js component @ gather');
    this.room.emit(Presence3dEvents.GATHER, { id: this.localParticipant.id });
  };

  /**
   * @function setPrivate
   * @param {boolean} isPrivate
   * @description updates participant private status
   * @returns {void}
   */
  private setPrivate = (isPrivate: boolean): void => {
    this.logger.log('three js component @ private mode');
    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      isPrivate: !!isPrivate,
    } as ParticipantDataInput);

    // thanks to the throttle, sometimes the updatePresence3D is called,
    // so it is set here to be sent in a possible next update
    this.isPrivate = !!isPrivate;
  };

  /**
   * @function follow
   * @description follow a participant
   * @param participantId - participant id to follow, if not provided, follow is disabled
   * @returns {void}
   */
  public follow = (participantId?: string): void => {
    this.logger.log('three js component @ follow');
    this.room.emit(Presence3dEvents.FOLLOW_ME, { id: participantId });
  };

  /**
   * @function localFollow
   * @description follow a participant
   * @param participantId - participant id to follow, if not provided, follow is disabled
   * @returns {void}
   */
  private localFollow = (participantId?: string): void => {
    this.localFollowParticipantId = participantId;
  };

  /** Three */

  private async destroyAvatar(participant: ParticipantOn3D) {
    if (this.avatars[participant.id]) {
      if (this.mouses[participant.id]) {
        this.mouses[participant.id].destroy();
      }
      this.avatars[participant.id].destroy();
      delete this.avatars[participant.id];
      this.avatars[participant.id] = null;
      this.mouses[participant.id] = null;
    }
  }

  private async destroyLaser(participant: ParticipantOn3D) {
    if (this.lasers[participant.id]) {
      this.lasers[participant.id].destroy();
      delete this.lasers[participant.id];
      this.lasers[participant.id] = null;
    }
  }

  private async destroyMouse(participant: ParticipantOn3D) {
    if (this.mouses[participant.id]) {
      this.mouses[participant.id].destroy();
      delete this.mouses[participant.id];
      this.mouses[participant.id] = null;
    }
  }

  private moveToAnotherParticipant(participantId: string) {
    if (participantId === this.localParticipantId || !this.positionInfos[participantId]) return;

    const destPosition = this.positionInfos[participantId].position;
    const destQuaternion = this.positionInfos[participantId].quaternion;
    const moveAnimation = setInterval(() => {
      const speed = 0.1;
      const curPosition = this.player.position.clone();
      curPosition.lerp(destPosition, speed);
      this.player.position.set(curPosition.x, curPosition.y, curPosition.z);

      const curQuat = this.player.quaternion.clone();
      curQuat.slerp(destQuaternion, speed);
      this.player.quaternion.set(curQuat.x, curQuat.y, curQuat.z, curQuat.w);
    }, 1);

    setTimeout(() => {
      clearInterval(moveAnimation);
    }, 1000);
  }

  private async createAvatar(participant: ParticipantOn3D) {
    if (!this.isAttached) return;

    if (this.avatars[participant.id]) this.avatars[participant.id].destroy();

    const isOwnAvatar = participant.id === this.localParticipantId;

    if (isOwnAvatar && !this.config.renderLocalAvatar) return;

    const scale = participant.avatarConfig?.scale || 1;
    const height = participant.avatarConfig?.height || 0;
    const url = participant.avatar?.model3DUrl ?? DEFAULT_AVATAR.model3DUrl;
    const avatar = new Avatar(url, scale, height, isOwnAvatar);
    const model: Object3D = await avatar.load();
    if (this.avatars[participant.id]) {
      this.avatars[participant.id].root.parent.remove(this.avatars[participant.id].root);
    }

    this.scene.add(model);
    this.avatars[participant.id] = avatar;

    if (this.lasers[participant.id]) {
      this.scene.add(this.lasers[participant.id].root);
    }

    return model;
  }

  private async createName(participant: ParticipantOn3D, avatarModel: Object3D) {
    if (!this.isAttached || !participant.name.trim().length) return;

    avatarModel.traverse((obj: any) => {
      if (obj.geometry) {
        obj.geometry.computeBoundingBox();
      }
    });

    const url = participant.avatar?.model3DUrl ?? DEFAULT_AVATAR.model3DUrl;
    const isDefaultAvatar = url.includes('readyplayerme');

    const boundingBox = new Box3().setFromObject(avatarModel);
    const size = new Vector3(0, 0, 0);
    boundingBox.getSize(size);
    const { slot } = participant;
    let nameHeight = size.y * 1.2;

    if (isDefaultAvatar) {
      nameHeight = size.y * 2.3;
    }

    const scaleModifier = 50;
    const nameScale = boundingBox.max.y / scaleModifier;
    const name = new AvatarName(participant.name, slot, nameHeight, nameScale);
    const nameModel = await name.load();
    avatarModel.add(nameModel);
    this.names[participant.id] = name;
  }

  private async createLaser(participant: ParticipantOn3D) {
    this.logger.log('three js component @ createLaser', participant);

    if (!this.isAttached || !participant.avatarConfig) return;

    const isOwnAvatar = participant.id === this.localParticipantId;

    if (isOwnAvatar && !this.config.renderLocalAvatar) return;

    if (this.lasers[participant.id]) this.lasers[participant.id].destroy();

    let laserOrigin: Vector3 = new Vector3(0, 0, 0);
    if (participant.avatarConfig?.laserOrigin) {
      laserOrigin = new Vector3(
        participant.avatarConfig.laserOrigin.x,
        participant.avatarConfig.laserOrigin.y,
        participant.avatarConfig.laserOrigin.z,
      );
    }

    // laser
    const laser = new Laser(this.camera, this.scene, laserOrigin);
    this.lasers[participant.id] = laser;
    laser.load();
    if (!this.createdPointerMoveEvent) {
      this.createdPointerMoveEvent = true;
      window.addEventListener('pointermove', this.onPointerMove);
    }
  }

  private createMouse(participant: ParticipantOn3D) {
    if (!this.isAttached) return;

    const isOwnAvatar = participant.id === this.localParticipantId;

    if (isOwnAvatar && !this.config.renderLocalAvatar) return;

    if (this.mouses[participant.id]) this.mouses[participant.id].destroy();

    const mouse = new Mouse(this.scene);
    this.mouses[participant.id] = mouse;
    const { slot } = participant;
    mouse.load(participant.name, slot);

    this.raycaster = new Raycaster();
    if (!this.createdPointerMoveEvent) {
      this.createdPointerMoveEvent = true;
      window.addEventListener('pointermove', this.onPointerMove);
    }
  }

  private onPointerMove = (event) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // update the picking ray with the camera and mouse position
    if (this.raycaster === undefined) {
      this.raycaster = new Raycaster();
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      const { point } = intersects[0];
      this.camera.getWorldPosition(this.mouse3D);
      point.lerp(this.mouse3D, 0.005); // move the touch point a bit closer to the camera
      this.currentLocalPointerDest = point;
    }
  };

  private checkPlayerChanges = (): void => {
    if (!this.hasJoined3D) return;

    this.player.getWorldPosition(this.worldPosition);
    this.player.getWorldQuaternion(this.worldQuat);
    const data = {
      position: {
        x: this.worldPosition.x,
        y: this.worldPosition.y,
        z: this.worldPosition.z,
      },
      quaternion: {
        x: this.worldQuat.x,
        y: this.worldQuat.y,
        z: this.worldQuat.z,
        w: this.worldQuat.w,
      },
      pointer: {
        x: this.currentLocalPointerDest.x,
        y: this.currentLocalPointerDest.y,
        z: this.currentLocalPointerDest.z,
      },
      isPrivate: this.isPrivate,
    };

    const { participants } = this.useStore(storeType.PRESENCE_3D);
    const participantOnRealtime = participants.value.find(
      (participant) => participant.id === this.localParticipantId,
    ) as ParticipantDataInput;

    const dataOnRealtime = {
      position: participantOnRealtime?.position,
      quaternion: participantOnRealtime?.quaternion,
      pointer: participantOnRealtime?.pointer,
      isPrivate: participantOnRealtime?.isPrivate,
    };

    // prevent sending data if it's the same
    if (!isEqual(data, dataOnRealtime) && !this.isPrivate) {
      this.presence3DManager.updatePresence3D({
        id: this.localParticipantId,
        ...data,
      }); // this is trottled
    }

    const myAvatar = this.avatars[this.localParticipantId];

    const { localParticipant } = this.useStore(storeType.GLOBAL);
    const { slot } = localParticipant.value;

    if (myAvatar) {
      // update local avatar if it exists (render local avatar = true)

      this.updateAvatar(myAvatar, this.worldPosition, this.worldQuat);
      myAvatar.model.getWorldPosition(this.worldPosition);
      myAvatar.model.getWorldQuaternion(this.tempQuat);
      if (
        this.names[this.localParticipantId] &&
        slot !== undefined &&
        this.names[this.localParticipantId].slot !== slot &&
        this.names[this.localParticipantId].text
      ) {
        this.names[this.localParticipantId].slot = slot;

        // this.names[this.localParticipantId].text.material.color.set(
        //   slot.textColor ?? '#fff'
        // );
        this.names[this.localParticipantId].text.backgroundColor = slot.color ?? '#878291';
      }
    }

    if (this.lasers[this.localParticipantId]) {
      this.updateLaser(
        this.lasers[this.localParticipantId],
        this.worldPosition,
        this.currentLocalPointerDest,
        this.tempQuat,
        slot,
      );
    }

    if (this.mouses[this.localParticipantId]) {
      this.mouses[this.localParticipantId].update(this.currentLocalPointerDest, slot);
    }
  };

  private onParticipantsUpdated = (participants) => {
    if (!this.isAttached) return;

    this.logger.log('three js component @ onParticipantsUpdated', participants);

    Object.values(participants).forEach((participant: ParticipantOn3D) => {
      if (participant.id === this.localParticipantId) return;
      const participantId = participant.id;
      const { position, quaternion, pointer, isPrivate } = participant;

      // if participant is not in the list, add it
      if (!isPrivate && !this.participants.find((p) => p.id === participant.id)) {
        this.addParticipant(participant);
        return;
      }

      const { slot } = participant;

      this.positionInfos[participantId] = {
        position,
        quaternion,
        pointer,
      };

      if (isPrivate && this.avatars[participantId]) {
        this.removeParticipant(participant, true);
      }

      if (!isPrivate && !this.avatars[participantId]) {
        this.addParticipant(participant);
      }

      const remoteAvatar = this.avatars[participantId];
      if (remoteAvatar) {
        if (position && quaternion) {
          this.updateAvatar(remoteAvatar, position, quaternion);
        }
        remoteAvatar.root.getWorldQuaternion(this.tempQuat);
        const slotChanged =
          this.names[participantId] &&
          slot !== undefined &&
          this.names[participantId].slot.index !== slot.index;

        if (slotChanged) {
          this.names[participantId].destroy();
          this.createName(participant, this.avatars[participantId].root);
        }
      }

      const remoteLaser = this.lasers[participantId];
      if (remoteLaser) {
        if (this.laserUpdateIntervals[participantId]) {
          clearInterval(this.laserUpdateIntervals[participantId]);
        }

        this.laserUpdateIntervals[participantId] = setInterval(() => {
          this.updateLaser(remoteLaser, position, pointer, this.tempQuat, slot);
        }, 30);
      }

      const remoteMouse = this.mouses[participantId];
      if (remoteMouse) {
        this.mouses[participantId].update(pointer, slot);
      }
    });
  };

  private updateAvatar(remoteAvatar: Avatar, position: Vector3, quaternion: Quaternion) {
    if (!this.isAttached || !remoteAvatar || !position || !quaternion) return;

    remoteAvatar.setPosition(position);
    remoteAvatar.setQuaternion(quaternion);
  }

  private updateLaser(
    laserInstance: Laser,
    start: Vector3,
    dest: Vector3,
    quat: Quaternion,
    slot: Slot,
  ) {
    if (!start || !dest || !quat || !slot) return;

    laserInstance.update(start, dest, quat, slot);
  }

  private onFollowParticipantUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    if (event.data.id === this.localParticipantId) return;
    this.logger.log('three js component @ onFollowParticipantUpdate', event.data.id);
    this.followParticipantId = event.data.id;
    this.moveToAnotherParticipant(event.data.id);
  };

  private onGatherUpdate = (event: SocketEvent<{ id: string | undefined }>): void => {
    this.logger.log('three js component @ onGatherUpdate', event.data.id);

    if (event.data.id === this.localParticipantId) return;

    this.eventBus.publish('realtime.go-to-participant', event.data.id);
  };
}

if (typeof window !== 'undefined') {
  window.Presence3D = Presence3D;
  window.ThreeJsPin = ThreeJsPin;
}

export { Presence3D, ThreeJsPin };
