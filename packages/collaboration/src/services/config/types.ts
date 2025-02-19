import { ColorsVariables } from '../../common/types/colors.types';
import { EnvironmentTypes } from '../../common/types/sdk-options.types';

export interface Configuration {
  roomId: string;
  environment: EnvironmentTypes;
  apiKey: string;
  apiUrl: string;
  conferenceLayerUrl: string;
  debug: boolean;
  limits: any;
  waterMark: boolean;
  colors?: ColorsVariables;
  features: any;
}

type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type Key = Paths<Configuration>;
