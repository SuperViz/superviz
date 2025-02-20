import type { Laser3DTypes } from '../types';

export class LaserService {
  private static _instance: LaserService | null = null;
  private lasers: Record<string, Laser3DTypes> = {};
  private THREE: any;

  private constructor() {}

  public static get instance(): LaserService {
    if (!this._instance) {
      this._instance = new LaserService();
    }
    return this._instance;
  }

  public setTHREE(THREE: any) {
    this.THREE = THREE;
  }

  public getTHREE(): any {
    return this.THREE;
  }

  public getLasers(): Record<string, Laser3DTypes> {
    return this.lasers;
  }

  public setLaser(id: string, laser: Laser3DTypes) {
    this.lasers[id] = laser;
  }

  public removeLaser(id: string) {
    delete this.lasers[id];
  }
}
