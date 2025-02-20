import type { NameLabel3DTypes } from '../types';

export class NameService {
  private static _instance: NameService | null = null;
  private nameLabels: Record<string, NameLabel3DTypes> = {};
  private THREE: any;

  private constructor() {}

  public static get instance(): NameService {
    if (!this._instance) {
      this._instance = new NameService();
    }
    return this._instance;
  }

  public setTHREE(THREE: any) {
    this.THREE = THREE;
  }

  public getTHREE(): any {
    return this.THREE;
  }

  public getNameLabels(): Record<string, NameLabel3DTypes> {
    return this.nameLabels;
  }

  public setNameLabel(id: string, nameLabel: NameLabel3DTypes) {
    this.nameLabels[id] = nameLabel;
  }

  public removeNameLabel(id: string) {
    delete this.nameLabels[id];
  }
}
