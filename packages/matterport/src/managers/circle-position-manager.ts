import { Participant } from '@superviz/sdk';
import { Vector3 } from 'three';

import { DISTANCE_BETWEEN_AVATARS } from '../common/constants/presence';
import { CirclePosition, Coordinates } from '../common/types/coordinates.types';
import { Logger } from '../common/utils/logger';
import { ParticipantOn3D } from '../types';
import { VectorCache } from '../utils/vector-cache';

export class CirclePositionManager {
  private static _instance: CirclePositionManager | null = null;
  private circlePositions: CirclePosition[] = [];
  private readonly logger: Logger;

  private constructor() {
    this.logger = new Logger('@superviz/sdk/circle-position-manager');
  }

  public static init(): CirclePositionManager {
    if (!CirclePositionManager._instance) {
      CirclePositionManager._instance = new CirclePositionManager();
    }
    return CirclePositionManager._instance;
  }

  public static get instance(): CirclePositionManager {
    if (!CirclePositionManager._instance) {
      throw new Error('CirclePositionManager has not been initialized. Call `init()` first.');
    }
    return CirclePositionManager._instance;
  }

  public static reset(): void {
    CirclePositionManager._instance = null;
  }

  public createCircleOfPositions(participants: (ParticipantOn3D | Participant)[]): void {
    console.log('Creating circle positions for participants:', participants);
    this.circlePositions = [];
    const sortedParticipants = [...participants].sort((a, b) => {
      return (a.slot?.index || 0) - (b.slot?.index || 0);
    });

    const participantCount = sortedParticipants.length;
    if (participantCount === 0) return;

    const circleCache = VectorCache.instance.getCircleCache();
    circleCache.radius = Math.max(participantCount * 0.3, 2);
    circleCache.angleStep = (2 * Math.PI) / participantCount;

    for (let i = 0; i < participantCount; i++) {
      const participant = sortedParticipants[i];
      const angle = i * circleCache.angleStep;
      const x = circleCache.radius * Math.cos(angle);
      const z = circleCache.radius * Math.sin(angle);
      this.circlePositions.push({ x, y: 0, z, slot: participant?.slot?.index ?? -1 });
    }
    console.log('Final circle positions:', this.circlePositions);
  }

  public adjustPositionToCircle(position: Coordinates | undefined, localSlot: number): Coordinates {
    if (!position) {
      return position || { x: 0, y: 0, z: 0 };
    }

    if (localSlot === -1) {
      return position;
    }

    const tempPositionVector = VectorCache.instance.get<Vector3>('tempPositionVector');
    const tempCircleVector = VectorCache.instance.get<Vector3>('tempCircleVector');

    tempPositionVector.set(position.x, position.y, position.z);

    const positionInTheCircle = this.circlePositions.find(
      (position) => position.slot === localSlot,
    );

    if (!positionInTheCircle) {
      return position;
    }

    tempCircleVector
      .set(positionInTheCircle.x, position.y, positionInTheCircle.z)
      .multiplyScalar(DISTANCE_BETWEEN_AVATARS);

    tempPositionVector.add(tempCircleVector);

    VectorCache.instance.get<Vector3>('currentCirclePosition').copy(tempCircleVector);

    return {
      x: tempPositionVector.x,
      y: tempPositionVector.y,
      z: tempPositionVector.z,
    };
  }

  public getCirclePositions(): CirclePosition[] {
    // console.log('Current circle positions:', this.circlePositions);
    return this.circlePositions;
  }
}
