import { Presence3DManager } from '@superviz/sdk';
import PubSub from 'pubsub-js';

import type { MpSdk as Matterport } from '../common/types/matterport.types';
import Lerper from '../components/Lerper';
import Avatar3D from '../components/avatar/Avatar3D';
import LaserPointer3D from '../components/laser/LaserPointer3D';
import NameLabel from '../components/name/NameLabel';
import { SWEEP_DURATION } from '../constants/avatar';
import { MatterportEvents } from '../events/matterport-events';
import { AvatarService } from '../services/avatar-service';
import { LaserService } from '../services/laser-service';
import { SceneLight } from '../services/matterport/scene-light';
import { NameService } from '../services/name-service';
import { Avatar3DTypes, Laser3DTypes, Mode, NameLabel3DTypes, ParticipantOn3D, Rotation } from '../types';

import { MatterportMovementManager } from './matterport-movement-manager';
import { ParticipantManager } from './participant-manager';

export class MatterportManager {
  private static _instance: MatterportManager | null = null;
  private maxDistanceSquared: number = 0;
  private sceneLight!: SceneLight;
  private THREE: any;
  private matterportEvents!: MatterportEvents;
  private isEmbedMode: boolean = false;

  private avatars: Record<string, Avatar3DTypes> = {};
  private lasers: Record<string, Laser3DTypes> = {};

  private movementManager: MatterportMovementManager;

  private constructor(
    private readonly matterportSdk: Matterport,
    private readonly presence3DManager: Presence3DManager,
    private readonly isPrivate: boolean,
  ) {

  }

  /**
   * Get the singleton instance of MatterportManager.
   */
  public static init(
    matterportSdk: Matterport,
    presence3DManager: Presence3DManager,
    isPrivate: boolean = false,
  ): MatterportManager {
    if (!MatterportManager._instance) {
      MatterportManager._instance = new MatterportManager(
        matterportSdk,
        presence3DManager,
        isPrivate,
      );
    }
    return MatterportManager._instance;
  }

  public static get instance(): MatterportManager {
    if (!MatterportManager._instance) {
      throw new Error('MatterportManager has not been initialized. Call `init()` first.');
    }
    return MatterportManager._instance;
  }

  public static reset(): void {
    MatterportManager._instance = null;
  }

  /**
   * Initialize Scene: Bounds + Lights
   */
  public async initialize(): Promise<void> {
    try {
      await this.calculateSceneBounds();
      await this.addSceneLights();
      this.movementManager = new MatterportMovementManager(this.matterportSdk);

      PubSub.subscribe('REMOVE_PARTCIPANT', this.onRemoveParticipant.bind(this));
    } catch (error) {
      throw new Error(`Plugin: Matterport initialization failed: ${error}`);
    }
  }

  private onRemoveParticipant = (e: any, payload: { participant: ParticipantOn3D }) => {
    // delete avatar ::
    const avatar = this.avatars[payload.participant.id];
    avatar.avatar3D.destroy();
    avatar.stop();
    delete this.avatars[payload.participant.id];
  };

  private async calculateSceneBounds(): Promise<void> {
    const { sweeps } = await this.matterportSdk.Model.getData();

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    sweeps.forEach(({ position: { x, z } }) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    });

    const dx = maxX - minX;
    const dz = maxZ - minZ;
    this.maxDistanceSquared = (dx * dx + dz * dz) / 4;
  }

  private async addSceneLights(): Promise<void> {
    try {
      this.sceneLight = new SceneLight(this.matterportSdk);
      await this.sceneLight.addSceneLight();
      this.THREE = this.sceneLight.getTHREE();
      AvatarService.instance.setTHREE(this.THREE);
      LaserService.instance.setTHREE(this.THREE);
      NameService.instance.setTHREE(this.THREE);
    } catch (error) {
      throw new Error(`Plugin: Matterport scenelight failed: ${error}`);
    }
  }

  public async registerEventsAndElements(): Promise<void> {
    await this.initializeMatterportEvents();
    await this.registerSceneElements();
    await this.movementManager.addInputComponent();
  }

  private async registerSceneElements(): Promise<void> {
    if (this.matterportSdk.Scene) {
      this.matterportSdk.Scene.register('lerper', Lerper);
      this.matterportSdk.Scene.register('laser3D', LaserPointer3D);
      this.matterportSdk.Scene.register('avatar3D', Avatar3D);
      this.matterportSdk.Scene.register('nameLabel', NameLabel);
    } else {
      this.isEmbedMode = true;
    }
  }

  private async initializeMatterportEvents(): Promise<void> {
    try {
      this.matterportEvents = new MatterportEvents(
        this.matterportSdk,
        this.presence3DManager,
        () => ParticipantManager.instance.getLocalParticipant.id,
        this.isPrivate,
      );
      this.matterportEvents.subscribeToMatterportEvents();
    } catch (error) {
      throw new Error(`Plugin: Matterport events failed: ${error}`);
    }
  }

  public async createAvatar(participant: ParticipantOn3D) {
    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const avatarModel: Avatar3DTypes = sceneObject.addNode();

    AvatarService.instance.setAvatar(participant.id, avatarModel);

    return new Promise((resolve) => {
      avatarModel.avatar3D = avatarModel.addComponent('avatar3D', {
        participant,
        matterportSdk: this.matterportSdk,
      });
      avatarModel.start();
      resolve(avatarModel);
    });
  }

  public async createNameLabel(participant: ParticipantOn3D) {
    console.log('Plugin: createNameLabel', participant);

    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const nameLabelModel: NameLabel3DTypes = sceneObject.addNode();

    NameService.instance.setNameLabel(participant.id, nameLabelModel);

    return new Promise((resolve) => {
      nameLabelModel.nameLabel3D = nameLabelModel.addComponent('nameLabel', {
        participant,
        matterportSdk: this.matterportSdk,
      });
      nameLabelModel.start();
      resolve(nameLabelModel);
    });
  }

  public async createLaser(participant: ParticipantOn3D) {
    const [sceneObject] = await this.matterportSdk.Scene.createObjects(1);
    const laserModel: Laser3DTypes = sceneObject.addNode();

    LaserService.instance.setLaser(participant.id, laserModel);

    return new Promise((resolve) => {
      laserModel.laser3D = laserModel.addComponent('laser3D', {
        participant,
        matterportSdk: this.matterportSdk,
      });
      laserModel.start();
      resolve(laserModel);
    });
  }

  /**
   * Static access methods
   */
  public static getAvatars(): Record<string, Avatar3DTypes> {
    return AvatarService.instance.getAvatars();
  }

  public static getLasers(): Record<string, Laser3DTypes> {
    return LaserService.instance.getLasers();
  }

  public static getNameLabels(): Record<string, NameLabel3DTypes> {
    return NameService.instance.getNameLabels();
  }

  public static getTHREE(): any {
    return AvatarService.instance.getTHREE();
  }

  public static getMaxDistanceSquared(): number {
    return MatterportManager.instance.maxDistanceSquared;
  }

  public static getIsEmbedMode(): boolean {
    return MatterportManager.instance.isEmbedMode;
  }
}
