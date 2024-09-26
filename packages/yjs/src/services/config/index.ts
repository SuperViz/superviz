import { EnvironmentTypes } from '../../provider/types';

import { ConfigurationInterface } from './types';

class Config {
  private config: ConfigurationInterface = {
    apiKey: '',
    participant: {
      id: '',
      name: '',
    },
    environment: '' as EnvironmentTypes,
    roomName: '',
  };

  public set<T extends keyof ConfigurationInterface>(
    key: T,
    value: ConfigurationInterface[T],
  ): void {
    this.config[key] = value;
  }

  public get<T extends keyof ConfigurationInterface>(key: T): ConfigurationInterface[T] {
    return this.config[key];
  }
}

export const config = new Config();
