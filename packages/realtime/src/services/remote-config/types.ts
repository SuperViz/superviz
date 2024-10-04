import { EnvironmentTypes } from '../../types/options.types';

export type RemoteConfig = {
  apiUrl: string;
  version: EnvironmentTypes;
};

export type RemoteConfigParams = {
  environment: EnvironmentTypes;
};
