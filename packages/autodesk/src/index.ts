import { Participant, Presence3DManager, StoreType } from '@superviz/sdk';
import type { useStore } from '@superviz/sdk/dist/common/utils/use-store';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { EventBus } from '@superviz/sdk/dist/services/event-bus';
import type { ParticipantDataInput } from '@superviz/sdk/dist/services/presence-3d-manager/types';
import type { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';
import { isEqual } from 'lodash';
import { Mesh, Object3D, Vector3 } from 'three';

import { Avatar } from './components/Avatar';
import { AvatarName } from './components/AvatarName3D';
import { Laser } from './components/Laser';
import { Mouse } from './components/Mouse';
import { AutodeskPin } from './services/comments-adapter';
import {
  AutodeskViewerComponentOptions,
  ParticipantOn3D,
  PositionInfo,
  Avatar as AvatarType,
  Presence3dEvents,
} from './types';
import { Logger } from './utils/logger';

const MY_PROPERTIES_MOUSE_THROTTLE = 100;
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
  private config: AutodeskViewerComponentOptions;
  private participants: ParticipantOn3D[] = [];

  private isAttached = false;
  private followParticipantId?: string;
  private localFollowParticipantId?: string;

  private avatars: Record<string, Avatar> = {};
  private lasers: Record<string, Laser> = {};
  private names: Record<string, AvatarName> = {};
  private mouses: Record<string, Mouse> = {};
  private positionInfos: Record<string, PositionInfo> = {};

  private renderSilentInterval: ReturnType<typeof setInterval> = null;
  private lastSyncedData: Object3D = {};

  private viewer: Autodesk.Viewing.GuiViewer3D;
  private unsubscribeFrom: Array<(id: unknown) => void> = [];
  private useStore: typeof useStore;
  private room: Room;
  private presence3DManager: Presence3DManager;
  private isPrivate: boolean;
  private roomParticipants: Record<string, ParticipantDataInput> = {};
  private hasJoinedRoom: boolean = false;
  private hasJoined3D: boolean = false;

  constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: AutodeskViewerComponentOptions) {
    if (typeof window === 'undefined') {
      throw new Error(
        '[SuperViz] Presence3D cannot be initialized in a non-browser environment. Window is not defined',
      );
    }

    if (!viewer) {
      throw new Error('autodesk viewer instance is required');
    }

    this.name = 'presence3dAutodesk';
    this.logger = new Logger('@superviz/sdk/autodesk-viewer-component');

    this.logger.log('autodesk-viewer component @ constructor', { viewer, options });

    this.config = {
      isAvatarsEnabled: options?.isAvatarsEnabled ?? true,
      isLaserEnabled: options?.isLaserEnabled ?? true,
      isNameEnabled: options?.isNameEnabled ?? true,
      isMouseEnabled: options?.isMouseEnabled ?? true,
      avatarConfig: options?.avatarConfig,
    };

    this.logger.log('autodesk-viewer component @ constructor - config', this.config);

    this.viewer = viewer;
    this.viewer.canvas.addEventListener('mousemove', this.onMouseMove);

    this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChanged);
  }

  private get localParticipantId(): string {
    return this.localParticipant?.id;
  }

  public attach = (params: DefaultAttachComponentOptions): void => {
    if (Object.values(params).includes(null) || Object.values(params).includes(undefined)) {
      const message = 'autodesk-viewer component @ attach - params are required';

      this.logger.log(message);
      throw new Error(message);
    }

    this.logger.log('attached');

    const { eventBus, useStore, ioc } = params;
    this.useStore = useStore.bind(this);
    this.room = ioc.createRoom(this.name);
    this.presence3DManager = new Presence3DManager(this.room, this.useStore);

    const { localParticipant, hasJoinedRoom } = this.useStore(storeType.GLOBAL);
    localParticipant.subscribe();
    hasJoinedRoom.subscribe();

    const { hasJoined3D, participants } = this.useStore(storeType.PRESENCE_3D);
    hasJoined3D.subscribe();
    participants.subscribe(this.onParticipantsUpdated);

    this.isAttached = true;
    this.eventBus = eventBus;

    this.start();
  };

  public detach = (): void => {
    if (!this.isAttached) {
      this.logger.log('autodesk-viewer component @ detach - component is not attached}');
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
    this.useStore(storeType.PRESENCE_3D).destroy();
    this.useStore = undefined;

    this.viewer.removeEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, this.onCameraChanged);
    this.viewer.canvas.removeEventListener('mousemove', this.onMouseMove);

    clearInterval(this.renderSilentInterval);

    this.participants.forEach((participant) => {
      this.removeParticipant(participant, true);
    });

    this.avatars = {};
    this.lasers = {};
    this.mouses = {};
    this.positionInfos = {};

    this.viewer.overlays.clearScene('avatars-scene');
    this.viewer.overlays.removeScene('avatars-scene');
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

    this.renderSilentInterval = setInterval(this.renderSilent, 1);
    this.sync();
  };

  private subscribeToRealtimeEvents = (): void => {
    this.logger.log('autodesk-viewer component @ subscribeToRealtimeEvents');
    this.room.on<Participant>(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.presence.on('presence.leave' as PresenceEvents, this.onParticipantLeave);
    this.room.on<{ id?: string }>(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.on<{ id?: string }>(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  private unsubscribeToRealtimeEvents = (): void => {
    this.logger.log('autodesk-viewer component @ unsubscribeToRealtimeEvents');
    this.room.presence.off('presence.leave' as PresenceEvents);
    this.room.off(Presence3dEvents.PARTICIPANT_JOINED, this.onParticipantJoined);
    this.room.off(Presence3dEvents.GATHER, this.onGatherUpdate);
    this.room.off(Presence3dEvents.FOLLOW_ME, this.onFollowParticipantUpdate);
  };

  private subscribeToEventBusEvents = (): void => {
    this.logger.log('autodesk-viewer component @ subscribeToEventBusEvents');
    this.eventBus.subscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.subscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.subscribe('realtime.follow-participant', this.follow);
    this.eventBus.subscribe('realtime.private-mode', this.setPrivate);
  };

  private unsubscribeToEventBusEvents = (): void => {
    this.logger.log('autodesk-viewer component @ unsubscribeToEventBusEvents');
    this.eventBus.unsubscribe('realtime.go-to-participant', this.goTo);
    this.eventBus.unsubscribe('realtime.local-follow-participant', this.localFollow);
    this.eventBus.unsubscribe('realtime.follow-participant', this.follow);
    this.eventBus.unsubscribe('realtime.private-mode', this.setPrivate);
  };

  /** Realtime Callbacks */

  private onParticipantJoined = (participant): void => {
    if (!participant.data) return;

    this.logger.log('autodesk-viewer component @ onParticipantJoined', participant);

    const { id, name, avatar, avatarConfig, type, slot } = participant.data;

    if (id === this.localFollowParticipantId) {
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
      isPrivate: false,
    });
  };

  private onLocalParticipantJoined = (participant): void => {
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
    this.logger.log('autodesk-viewer component @ onParticipantLeave', event);

    const participantToRemove = this.participants.find(
      (participantOnlist) => participantOnlist.id === event.id,
    );

    delete this.roomParticipants[event.id];

    if (!participantToRemove) return;

    this.removeParticipant(participantToRemove, true);
  };

  private onParticipantUpdated = (participant): void => {
    this.logger.log('autodesk-viewer component @ onParticipantUpdated', participant);
    const { id, name, avatar, avatarConfig, position, rotation, type, slot } = participant;

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

  private updateParticipant = (participant): Promise<void> => {
    if (!this.participants || this.participants.length === 0 || !participant || !participant.id) {
      return;
    }

    const participantToBeUpdated = this.participants.find(
      (oldParticipant) => oldParticipant.id === participant.id,
    );

    if (!participantToBeUpdated) {
      this.addParticipant(participant);
      return;
    }

    // create new avatar if avatar model, remove participant and add it again
    if (
      participantToBeUpdated.avatar?.model3DUrl !== participant.avatar?.model3DUrl ||
      !isEqual(participantToBeUpdated.avatarConfig, participant.avatarConfig) ||
      participantToBeUpdated.name !== participant.name
    ) {
      this.removeParticipant(participant, true);
      this.addParticipant(participant);
    } else {
      const index = this.participants.findIndex((u) => u.id === participant.id);

      if (index !== -1) {
        this.participants[index] = participant;
      }
    }

    this.logger.log('autodesk-viewer component @ updateParticipant', {
      participant,
      participants: this.participants,
    });
  };

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

  private async create3dPresence(participantOn3D: ParticipantOn3D) {
    if (participantOn3D.id === this.localParticipantId) return;

    if (this.config.isAvatarsEnabled) {
      const model = await this.createAvatar(participantOn3D);

      // name is a child of avatar
      this.config.isNameEnabled && this.createName(participantOn3D, model);
    }

    this.config.isMouseEnabled && this.createMouse(participantOn3D);
    this.config.isLaserEnabled && this.createLaser(participantOn3D);
  }

  /** Participants */

  private createParticipantList = () => {
    const list = this.useStore(storeType.PRESENCE_3D).participants.value;

    Object.values(list).forEach((participant: ParticipantDataInput) => {
      if (participant.isPrivate) return;
      this.addParticipant(participant);
    });

    this.logger.log('autodesk-viewer component @ createParticipantList', this.participants);
  };

  private createParticipantOn3D = ({
    id,
    name,
    avatar,
    avatarConfig,
    type,
    isPrivate,
    slot,
  }): ParticipantOn3D => {
    const participant = {
      id,
      name,
      avatar,
      isPrivate,
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

    this.logger.log('autodesk-viewer component @ createParticipantOn3D', participant);

    return participant;
  };

  private removeParticipant = (participant: ParticipantOn3D, unsubscribe: boolean): void => {
    this.logger.log('autodesk-viewer component @ removeParticipant', { participant, unsubscribe });

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
    if (!participant || !participant.id || participant.type === 'audience') return;
    const participantOn3D = this.createParticipantOn3D(participant);

    if (this.participants.find((p) => p.id === participantOn3D.id)) {
      this.logger.log('autodesk-viewer component @ addParticipant - participant already exists');

      this.onParticipantUpdated(participant);
      return;
    }

    this.roomParticipants[participant.id] = participant;

    this.participants.push(participantOn3D);

    this.logger.log('autodesk-viewer component @ addParticipant', {
      participant,
      participantOn3D,
      participants: this.participants,
    });

    // audience listens to the hosts broadcast channel

    this.presence3DManager.subscribeToUpdates(participantOn3D.id, this.onParticipantUpdated);

    this.create3dPresence(participantOn3D);
  };

  /** EventBus callbacks */

  /**
   * @function goTo
   * @description go to a participant
   * @param participantId - participant id to go to
   * @returns {void}
   */
  public goTo = (participantId: string): void => {
    this.logger.log('autodesk-viewer component @ goTo', participantId);

    this.moveToAnotherParticipant(participantId);
  };

  /**
   * @function gather
   * @description gather all participants
   * @returns {void}
   */
  public gather = (): void => {
    this.logger.log('autodesk-viewer component @ gather');
    this.room.emit(Presence3dEvents.GATHER, { id: this.localParticipant.id });
  };

  /**
   * @function setPrivate
   * @param {boolean} isPrivate
   * @description updates participant private status
   * @returns {void}
   */
  private setPrivate = (isPrivate: boolean): void => {
    this.logger.log('autodesk-viewer component @ private mode');
    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      isPrivate: !!isPrivate,
    } as ParticipantDataInput);

    this.isPrivate = !!isPrivate;
  };

  /**
   * @function follow
   * @description follow a participant
   * @param participantId - participant id to follow, if not provided, follow is disabled
   * @returns {void}
   */
  public follow = (participantId?: string): void => {
    this.logger.log('autodesk-viewer component @ follow');
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

  public async createAvatar(participant: ParticipantOn3D) {
    this.logger.log('autodesk-viewer component @ createAvatar', participant);

    if (!this.isAttached) return;

    if (participant.id === this.localParticipantId) return;

    if (this.avatars[participant.id]) {
      this.avatars[participant.id].destroy();
    }

    const scale = participant.avatarConfig?.scale || 1;
    const height = participant.avatarConfig?.height || 0;

    const url = participant.avatar?.model3DUrl ?? DEFAULT_AVATAR.model3DUrl;
    const avatar = new Avatar(url, scale, height);
    const model: Object3D = await avatar.load();

    if (!this.viewer.overlays.hasScene('avatars-scene')) {
      this.viewer.overlays.addScene('avatars-scene');
    }

    this.viewer.overlays.addMesh(model, 'avatars-scene');
    this.avatars[participant.id] = avatar;

    return model;
  }

  public async destroyAvatar(participant: ParticipantOn3D) {
    if (this.avatars[participant.id]) {
      if (this.names[participant.id]) {
        this.names[participant.id].destroy();
        this.names[participant.id] = null;
      }

      this.avatars[participant.id].destroy();
      delete this.avatars[participant.id];
      this.avatars[participant.id] = null;
    }
  }

  private createLaser(participant: ParticipantOn3D) {
    if (!this.isAttached) return;

    let laserOrigin: Vector3 = new Vector3(0, 0, 0);
    if (participant.avatarConfig?.laserOrigin) {
      laserOrigin = new Vector3(
        participant.avatarConfig.laserOrigin.x,
        participant.avatarConfig.laserOrigin.y,
        participant.avatarConfig.laserOrigin.z,
      );
    }

    // laser
    const { slot } = this.roomParticipants[participant.id];
    this.lasers[participant.id] = new Laser(this.viewer, slot, laserOrigin);
  }

  public async destroyLaser(participant: ParticipantOn3D) {
    if (this.lasers[participant.id]) {
      this.lasers[participant.id].destroy();
      delete this.lasers[participant.id];
      this.lasers[participant.id] = null;
    }
  }

  private async createName(participant: ParticipantOn3D, avatarModel: THREE.Object3D) {
    this.logger.log('autodesk-viewer component @ createName', participant);

    if (!participant.name.trim().length) return;

    const boundingBox = new THREE.Box3().setFromObject(avatarModel);
    const size = new Vector3(0, 0, 0);
    boundingBox.getSize(size);
    const slot = participant.slot ?? this.roomParticipants[participant.id].slot;
    const nameHeight = boundingBox.min.y + size.y * 1.25;
    const name = new AvatarName(participant.name, slot, nameHeight, this.viewer);
    const nameModel: Mesh = await name.load();
    avatarModel.add(nameModel);
    this.names[participant.id] = name;
  }

  private async createMouse(participant: ParticipantOn3D) {
    if (!this.isAttached) return;

    // mouse
    const { slot } = this.roomParticipants[participant.id];

    const mouse = new Mouse(this.viewer, participant.id);
    this.mouses[participant.id] = mouse;
    mouse.load(participant.name, slot);
  }

  public async destroyMouse(participant: ParticipantOn3D) {
    if (this.mouses[participant.id]) {
      this.mouses[participant.id].destroy();
      delete this.mouses[participant.id];
    }
  }

  public moveToAnotherParticipant(participantId: string) {
    if (!this.positionInfos[participantId] || !this.isAttached) return;

    const { position, target } = this.positionInfos[participantId];

    if (!target || !position) return;

    const destPosition = new Vector3(position.x, position.y, position.z);
    const destTarget = new Vector3(target.x, target.y, target.z);
    const camera = this.viewer.navigation.getCamera();

    // @ts-ignore
    this.viewer.navigation.setRequestTransition(
      true,
      destPosition,
      destTarget,
      camera.fov,
      true,
      camera.pivot,
    );
  }

  private onCameraChanged = () => {
    if (!this.isAttached) {
      return;
    }
    if (this.viewer.impl.overlayScenes['avatars-scene']) {
      // @ts-ignore
      this.viewer.impl.requestSilentRender();
    }
    this.sync();
  };

  private renderSilent = () => {
    if (this.viewer.impl.overlayScenes['avatars-scene']) {
      // @ts-ignore
      this.viewer.impl.requestSilentRender();

      // check if avatars close to local
      let isTooClose = false;

      const closeAvatars = [];

      Object.values(this.avatars).forEach((avatar) => {
        if (!avatar?.model) {
          return;
        }
        if (this.lastSyncedData.position.distanceTo(avatar.model.position) < 1) {
          isTooClose = true;
          closeAvatars.push(avatar);
        }
      });

      if (isTooClose) {
        closeAvatars.forEach((avatar) => {
          if (!avatar?.model) {
            return;
          }
          avatar.model.visible = false;
        });
      } else {
        Object.values(this.avatars).forEach((avatar) => {
          if (!avatar?.model) {
            return;
          }
          avatar.model.visible = true;
        });
      }
    }
  };

  private onParticipantsUpdated = (participants) => {
    Object.values(participants).forEach((participant: ParticipantOn3D) => {
      if (!this.isAttached || participant.id === this.localParticipantId) return;

      this.roomParticipants = {};

      participants.forEach((participant) => {
        this.roomParticipants[participant.id] = participant;
      });

      const participantId = participant.id;
      const remoteAvatar: Avatar = this.avatars[participantId];
      const remoteLaser: Laser = this.lasers[participantId];
      const remoteMouse: Mouse = this.mouses[participantId];
      const { slot } = participant;

      const { position, quaternion, target, mouse, isPrivate } = participant;

      this.positionInfos[participant.id] = {
        position,
        quaternion,
        target,
      };

      if (isPrivate && this.avatars[participantId]) {
        this.removeParticipant(participant, true);
      }

      if (!isPrivate && !this.avatars[participantId]) {
        this.addParticipant(participant);
      }

      if (remoteAvatar) {
        remoteAvatar.setPosition(position);
        remoteAvatar.setQuaternion(quaternion);
        remoteAvatar.target = target;
      }

      if (remoteLaser) {
        remoteLaser.setAvatar(remoteAvatar);
        remoteLaser.setMousePosition(mouse);
        remoteLaser.setColorIndex(slot);
      }

      if (remoteMouse) {
        this.mouses[participantId].update(mouse, slot);
      }
    });
  };

  private sync(): void {
    if (!this.viewer || !this.isAttached) return;

    const position = this.viewer?.navigation?.getPosition();
    const target = this.viewer?.navigation?.getTarget();
    const camera = this.viewer?.navigation?.getCamera();
    const { quaternion } = camera;

    this.lastSyncedData.position = position;
    this.lastSyncedData.target = target;
    this.lastSyncedData.quaternion = quaternion;

    if (this.isPrivate) return;

    const participantData = this.participants.find(
      (participant) => participant.id === this.localParticipantId,
    );

    if (participantData?.position) {
      const similarX = Math.abs(participantData.position.x - position.x) < 0.1;
      const similarY = Math.abs(participantData.position.y - position.y) < 0.1;
      const similarZ = Math.abs(participantData.position.z - position.z) < 0.1;

      if (similarX && similarY && similarZ) return;
    }

    this.presence3DManager.updatePresence3D({
      id: this.localParticipantId,
      ...this.lastSyncedData,
    }); // this is throttled
  }

  public onMouseMove = (event: MouseEvent): void => {
    if (!this.viewer || !THREE) return;

    const mouse = this.viewer.clientToWorld(event.offsetX, event.offsetY, false);

    if (mouse !== null) {
      this.lastSyncedData.mouse = mouse.point;
      this.presence3DManager?.updatePresence3D({
        id: this.localParticipantId,
        ...this.lastSyncedData,
      }); // this is throttled
    }
  };
}

if (typeof window !== 'undefined') {
  window.Presence3D = Presence3D;
  window.AutodeskPin = AutodeskPin;
}

export { Presence3D, AutodeskPin };
