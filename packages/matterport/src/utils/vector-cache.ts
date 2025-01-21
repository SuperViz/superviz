import { Euler, Quaternion, Vector3 } from 'three';
import { DefaultCoordinates } from '../common/types/coordinates.types';

export class VectorCache {
  private readonly vectors = {
    tempVector3: new Vector3(),
    tempEuler: new Euler(),
    tempDestVector: new Vector3(),
    tempStartVector: new Vector3(),
    tempDiffVector: new Vector3(),
    tempQuaternion: new Quaternion(),
    tempRotationVector: new Vector3(),
    tempPositionVector: new Vector3(),
    tempCircleVector: new Vector3(),
    lastCameraPosition: new Vector3(),
    currentCirclePosition: new Vector3(),
  };

  private readonly circleCache = {
    center: new Vector3(),
    radius: 0,
    angleStep: 0,
  };

  constructor() {
    this.vectors.currentCirclePosition.copy(DefaultCoordinates);
  }

  /**
   * Initializes vectors with THREE.js instances
   * @param THREE THREE.js instance
   */
  public initialize(THREE: any): void {
    Object.keys(this.vectors).forEach((key) => {
      if (this.vectors[key] instanceof Vector3) {
        this.vectors[key] = new THREE.Vector3();
      } else if (this.vectors[key] instanceof Euler) {
        this.vectors[key] = new THREE.Euler();
      } else if (this.vectors[key] instanceof Quaternion) {
        this.vectors[key] = new THREE.Quaternion();
      }
    });
    this.circleCache.center = new THREE.Vector3();
    this.vectors.currentCirclePosition.copy(DefaultCoordinates);
  }

  /**
   * Gets a vector by key
   */
  public get<T extends Vector3 | Euler | Quaternion>(key: keyof typeof this.vectors): T {
    return this.vectors[key] as T;
  }

  /**
   * Resets all vectors to their default values
   */
  public cleanup(): void {
    Object.values(this.vectors).forEach((vector) => {
      if (vector instanceof Vector3) {
        vector.set(0, 0, 0);
      } else if (vector instanceof Quaternion) {
        vector.set(0, 0, 0, 1);
      } else if (vector instanceof Euler) {
        vector.set(0, 0, 0);
      }
    });
    // Reset circle cache
    this.circleCache.center.set(0, 0, 0);
    this.circleCache.radius = 0;
    this.circleCache.angleStep = 0;
  }

  public getCircleCache() {
    return this.circleCache;
  }
}
