import { Vector3 } from 'three';
import type { MpSdk as Matterport } from '../../common/types/matterport.types';
import type { Laser } from '../../common/types/lasers.types';
import type { ParticipantOn3D } from '../../types';

export class LaserService {
  private lasers: Record<string, Laser> = {};
  private laserUpdateIntervals = {};

  constructor(
    private matterportSdk: Matterport,
    private isLaserEnabled: boolean,
    private isAvatarsEnabled: boolean,
  ) {}

  public async createLaser(participant: ParticipantOn3D): Promise<void> {
    if (!this.matterportSdk.Scene || !this.isLaserEnabled) return;

    let laserOrigin: Vector3;

    if (this.isAvatarsEnabled && participant.avatarConfig?.laserOrigin) {
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
    laser.laserPointer = laser.addComponent('laser', { origin: laserOrigin });

    laser.start();
    laser.obj3D.userData = { uuid: participant.id };
    this.lasers[participant.id] = laser;
  }

  public destroyLaser(participantId: string): void {
    if (this.lasers[participantId]) {
      this.lasers[participantId].stop();
      delete this.lasers[participantId];
    }

    if (this.laserUpdateIntervals[participantId]) {
      clearInterval(this.laserUpdateIntervals[participantId]);
      delete this.laserUpdateIntervals[participantId];
    }
  }

  public getLaser(participantId: string): Laser {
    return this.lasers[participantId];
  }

  public destroyAll(): void {
    Object.keys(this.lasers).forEach(this.destroyLaser.bind(this));
  }
}
