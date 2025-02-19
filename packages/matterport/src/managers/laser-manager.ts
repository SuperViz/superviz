import { throttle } from 'lodash';
import { Vector3, Quaternion } from 'three';

import { AVATAR_LASER_HEIGHT_OFFSET, NO_AVATAR_LASER_HEIGHT, MIN_NAME_HEIGHT } from '../common/constants/presence';
import { AvatarTypes } from '../common/types/avatarTypes.types';
import { Coordinates } from '../common/types/coordinates.types';
import { Laser } from '../common/types/lasers.types';
import type { MpSdk as Matterport, Rotation } from '../common/types/matterport.types';
import { ParticipantOn3D, PositionInfo, Slot, MatterportComponentOptions } from '../types';
import { VectorCache } from '../utils/vector-cache';

import { IntervalManager } from './interval-manager';

export class LaserManager {
  private readonly intervalManager: IntervalManager;
  private readonly vectorCache: VectorCache;
  private readonly laserUpdateIntervals: Record<string, number> = {};
  private readonly positionInfos: Record<string, PositionInfo>;
  private readonly laserLerpers: Record<string, any> = {};

  constructor(
    intervalManager: IntervalManager,
    vectorCache: VectorCache,
    positionInfos: Record<string, PositionInfo>,
  ) {
    this.intervalManager = intervalManager;
    this.vectorCache = vectorCache;
    this.positionInfos = positionInfos;
  }

  public startLaserUpdate(
    participantId: string,
    remoteAvatar: AvatarTypes | null,
    remoteLaser: Laser,
    participant: ParticipantOn3D,
    localParticipantId: string,
  ): void {
    // Initialize lerper if it doesn't exist
    if (!this.laserLerpers[participantId]) {
      const startPos = this.positionInfos[participantId]?.position || { x: 0, y: 0, z: 0 };
      this.laserLerpers[participantId] = {
        curVector: new Vector3(startPos.x, NO_AVATAR_LASER_HEIGHT, startPos.z),
        speed: 0.95,
        animateVector(current: Vector3, target: Vector3) {
          current.lerp(target, this.speed);
        },
      };
    }

    // Clear existing interval if any
    if (this.laserUpdateIntervals[participantId]) {
      this.intervalManager.clearInterval(this.laserUpdateIntervals[participantId]);
    }

    // Set new update interval
    this.laserUpdateIntervals[participantId] = this.intervalManager.setInterval(async () => {
      await this.updateLaser(participantId, remoteAvatar, remoteLaser, participant.laser, localParticipantId);
    }, 16); // 60fps update rate
  }

  public clearLaserInterval(participantId: string): void {
    if (this.laserUpdateIntervals[participantId]) {
      this.intervalManager.clearInterval(this.laserUpdateIntervals[participantId]);
      delete this.laserUpdateIntervals[participantId];
    }
    // Also clean up lerper
    if (this.laserLerpers[participantId]) {
      delete this.laserLerpers[participantId];
    }
  }

  public clearAllIntervals(): void {
    Object.keys(this.laserUpdateIntervals).forEach((id) => {
      this.clearLaserInterval(id);
    });
  }

  private async updateLaser(
    userId: string,
    remoteAvatar: AvatarTypes | null,
    remoteLaser: Laser,
    laserDestinationPosition: Coordinates,
    localParticipantId: string,
  ): Promise<void> {
    try {
      if (!remoteLaser?.laserPointer || !laserDestinationPosition) {
        return;
      }

      // Calculate position reusing vectors
      const position = await this.calculateLaserPosition(userId, remoteAvatar);

      const remotePosition = this.positionInfos[userId].position;
      const localPosition = this.positionInfos[localParticipantId].position;

      // Update laser components
      this.updateLaserGeometry(
        remoteLaser.laserPointer,
        position,
        laserDestinationPosition,
        this.positionInfos[userId]?.slot,
      );
    } catch (error) {
      console.error('Error updating laser:', error);
    }
  }

  private calculateLaserPosition(userId: string, remoteAvatar: AvatarTypes | null): Vector3 {
    return remoteAvatar
      ? this.calculateAvatarPosition(remoteAvatar)
      : this.calculateNonAvatarPosition(userId, this.positionInfos[userId]);
  }

  private calculateAvatarPosition(remoteAvatar: AvatarTypes): Vector3 {
    const tempVector3 = this.vectorCache.get<Vector3>('tempVector3');
    const { x, y, z } = remoteAvatar.obj3D.position;
    tempVector3.set(x, y + AVATAR_LASER_HEIGHT_OFFSET, z);
    remoteAvatar.obj3D.getWorldQuaternion(this.vectorCache.get<Quaternion>('tempQuaternion'));
    return tempVector3;
  }

  private calculateNonAvatarPosition(userId: string, positionInfo: PositionInfo): Vector3 {
    const lerper = this.laserLerpers[userId];
    const tempVector3 = this.vectorCache.get<Vector3>('tempVector3');

    if (lerper && positionInfo?.position) {
      // Create target vector
      const targetVector = new Vector3(
        positionInfo.position.x,
        NO_AVATAR_LASER_HEIGHT,
        positionInfo.position.z,
      );

      // Lerp the current position towards the target
      lerper.curVector.lerp(targetVector, 0.05); // Lower value for smoother movement

      // Copy the lerped position
      tempVector3.copy(lerper.curVector);
    } else {
      // Fallback to direct position if no lerper
      tempVector3.set(
        positionInfo?.position?.x || 0,
        NO_AVATAR_LASER_HEIGHT,
        positionInfo?.position?.z || 0,
      );
    }

    return tempVector3;
  }

  private updateLaserGeometry(
    laserPointer: { updateGeometry: Function },
    position: Vector3,
    laserDestinationPosition: Coordinates,
    slot: Slot,
  ): void {
    laserPointer.updateGeometry(
      position,
      laserDestinationPosition,
      true,
      true,
      slot,
      this.vectorCache.get<Quaternion>('tempQuaternion'),
    );
  }

  public async createLaser(
    participant: ParticipantOn3D,
    config: MatterportComponentOptions,
    matterportSdk: Matterport,
    maxDistanceSquared: number,
    lasers: Record<string, Laser>,
  ): Promise<Laser | undefined> {
    if (!matterportSdk.Scene || !config.isLaserEnabled) return;

    const [sceneObject] = await matterportSdk.Scene.createObjects(1);
    const laser: Laser = sceneObject.addNode();

    return new Promise((resolve) => {
      laser.laserPointer = laser.addComponent('laser', {
        origin: new Vector3(0, 0, 0),
        maxDistanceSquared,
      });

      laser.laserPointer.onInitCallback = () => {
        laser.obj3D.userData = { uuid: participant.id };
        lasers[participant.id] = laser;
        resolve(laser);
      };

      laser.start();
    });
  }
}
