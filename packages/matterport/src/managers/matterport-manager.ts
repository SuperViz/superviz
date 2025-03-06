import { Presence3DManager } from '@superviz/sdk';
import PubSub from 'pubsub-js';

import type { MpSdk as Matterport } from '../common/types/matterport.types';
import Lerper from '../components/Lerper';
import LaserPointer3D from '../components/laser/LaserPointer3D';
import NameLabel from '../components/name/NameLabel';
import { MatterportEvents } from '../events/matterport-events';
import { AvatarService } from '../services/avatar-service';
import { LaserService } from '../services/laser-service';
import { SceneLight } from '../services/matterport/scene-light';
import { NameService } from '../services/name-service';
import { ServiceLocator } from '../services/service-locator';
import { Avatar3DTypes, Laser3DTypes, NameLabel3DTypes, ParticipantOn3D, PARTICIPANT_EVENTS } from '../types';

import { MatterportMovementManager } from './matterport-movement-manager';

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
  private serviceLocator: ServiceLocator;
  private avatarService: AvatarService;
  private laserService: LaserService;
  private nameService: NameService;

  private constructor(
    private readonly matterportSdk: Matterport,
    private readonly presence3DManager: Presence3DManager,
    private readonly isPrivate: boolean,
  ) {
    this.serviceLocator = ServiceLocator.getInstance();
    this.registerServices();

    // Register itself in the ServiceLocator
    this.serviceLocator.register('matterportManager', this);

    this.movementManager = new MatterportMovementManager(this.matterportSdk);
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
      await this.movementManager.addInputComponent();

      PubSub.subscribe(PARTICIPANT_EVENTS.LEFT, this.onParticipantLeft.bind(this));
    } catch (error) {
      throw new Error(`Plugin: Matterport initialization failed: ${error}`);
    }
  }

  private onParticipantLeft = (e: any, payload: { participant: ParticipantOn3D }) => {
    // delete avatar ::
    const avatar = this.avatarService.getAvatars()[payload.participant.id];
    avatar.avatar3D.destroy();
    avatar.stop();
    this.avatarService.removeAvatar(payload.participant.id);

    // Clean up laser
    const laser = this.laserService.getLasers()[payload.participant.id];
    if (laser) {
      laser.laser3D.destroy();
      laser.stop();
      this.laserService.removeLaser(payload.participant.id);
    }

    // Clean up name label
    const nameLabel = this.nameService.getNameLabels()[payload.participant.id];
    if (nameLabel) {
      nameLabel.nameLabel3D.destroy();
      nameLabel.stop();
      this.nameService.removeNameLabel(payload.participant.id);
    }
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

      // Set THREE to all services
      this.avatarService.setTHREE(this.THREE);
      this.laserService.setTHREE(this.THREE);
      this.nameService.setTHREE(this.THREE);
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
      // this.matterportSdk.Scene.register('avatar3D', Avatar3D);
      this.matterportSdk.Scene.register('nameLabel', NameLabel);
    } else {
      this.isEmbedMode = true;
    }
  }

  private async initializeMatterportEvents(): Promise<void> {
    try {
      // Get participantManager from ServiceLocator instead of importing it directly
      const participantManager = this.serviceLocator.get('participantManager');

      this.matterportEvents = new MatterportEvents(
        this.matterportSdk,
        this.presence3DManager,
        () => participantManager.getLocalParticipant.id,
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

    this.avatarService.setAvatar(participant.id, avatarModel);

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

    this.nameService.setNameLabel(participant.id, nameLabelModel);

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

    this.laserService.setLaser(participant.id, laserModel);

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
    const locator = ServiceLocator.getInstance();
    const avatarService = locator.get('avatarService') as AvatarService;
    return avatarService.getAvatars();
  }

  public static getLasers(): Record<string, Laser3DTypes> {
    const locator = ServiceLocator.getInstance();
    const laserService = locator.get('laserService') as LaserService;
    return laserService.getLasers();
  }

  public static getNameLabels(): Record<string, NameLabel3DTypes> {
    const locator = ServiceLocator.getInstance();
    const nameService = locator.get('nameService') as NameService;
    return nameService.getNameLabels();
  }

  public static getTHREE(): any {
    const locator = ServiceLocator.getInstance();
    const avatarService = locator.get('avatarService') as AvatarService;
    return avatarService.getTHREE();
  }

  public static getMaxDistanceSquared(): number {
    return MatterportManager.instance.maxDistanceSquared;
  }

  public static getIsEmbedMode(): boolean {
    return MatterportManager.instance.isEmbedMode;
  }

  private registerServices() {
    try {
      console.log('Registering services in ServiceLocator');
      // Register all services early in the lifecycle
      this.serviceLocator.register('avatarService', new AvatarService());
      this.serviceLocator.register('laserService', new LaserService());
      this.serviceLocator.register('nameService', new NameService());

      // Register ParticipantManager if not already registered
      // But don't import it directly!
      if (!this.serviceLocator.has('participantManager')) {
        // This should be done elsewhere, likely when ParticipantManager is instantiated
        // We'll just make sure we don't try to register it twice
        console.log('ParticipantManager will be registered externally');
      }

      // Get references
      this.avatarService = this.serviceLocator.get('avatarService') as AvatarService;
      this.laserService = this.serviceLocator.get('laserService') as LaserService;
      this.nameService = this.serviceLocator.get('nameService') as NameService;
      console.log('Services registered successfully');
    } catch (error) {
      console.error('Error registering services:', error);
    }
  }
}
