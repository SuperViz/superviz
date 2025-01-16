import { get } from 'lodash';

import { Nullable } from '../../common/types/global.types';

import type { Configuration, Key } from './types';

export class ConfigurationService {
  public configuration: Nullable<Configuration>;

  public setConfig(config: Configuration): void {
    this.configuration = config;
  }

  public get<T>(key: Key, defaultValue?: T): T {
    if (!this.configuration) return defaultValue;

    return get<Configuration, any, T>(this.configuration, key, defaultValue as T) as T;
  }

  public set<T>(key: Key, value: T): void {
    if (!this.configuration) return;

    this.configuration[key] = value;
  }
}

export default new ConfigurationService();
