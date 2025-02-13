import { MatterportComponentOptions } from '../types';

export class Config {
  private static instance: Config;
  private config: any;

  private constructor() {
    console.log('config');
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public setConfig(options?: MatterportComponentOptions) {
    this.config = {
      isAvatarsEnabled: options?.isAvatarsEnabled ?? true,
      isLaserEnabled: options?.isLaserEnabled ?? true,
      isNameEnabled: options?.isNameEnabled ?? true,
      avatarConfig: {
        height: options?.avatarConfig?.height || 0.25,
        scale: options?.avatarConfig?.scale || 0.55,
        laserOrigin: options?.avatarConfig?.laserOrigin ?? {
          x: 0,
          y: -0.2,
          z: 0.07,
        },
      },
    };
  }

  public getConfig() {
    return this.config;
  }
}
