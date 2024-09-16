import { ColorsVariables } from '../../common/types/colors.types';
import { EnvironmentTypes } from '../../common/types/sdk-options.types';
import { ComponentLimits } from '../limits/types';
import { FeatureFlags } from '../remote-config-service/types';

export interface Configuration {
  roomId: string;
  environment: EnvironmentTypes;
  apiKey: string;
  apiUrl: string;
  conferenceLayerUrl: string;
  debug: boolean;
  limits: ComponentLimits;
  waterMark: boolean;
  colors?: ColorsVariables;
  features: FeatureFlags;
}

type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type Key = Paths<Configuration>;
