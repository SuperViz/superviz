import { EnvironmentTypes } from '../../types/options.types';

export interface Configuration {
  roomId: string;
  environment: EnvironmentTypes;
  apiKey: string;
  secret: string;
  clientId: string;
  apiUrl: string;
  debug: boolean;
}

type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type Key = Paths<Configuration>;
