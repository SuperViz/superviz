import { get } from 'lodash';

import type { Configuration, Key } from './types';

export class ConfigurationService {
  private configuration: Partial<Configuration> = {};

  public set<T>(key: Key, value: T): void {
    this.configuration[key] = value as never;
  }

  public get<T>(key: Key, defaultValue?: T): T {
    if (!this.configuration) return defaultValue;

    return get<Partial<Configuration>, any, T>(this.configuration, key, defaultValue as T) as T;
  }
}

export default new ConfigurationService();
