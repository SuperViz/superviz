export enum EnvironmentTypes {
  LOCAL = 'local',
  DEV = 'dev',
  PROD = 'prod',
}

export type RemoteConfig = {
  apiUrl: string;
  conferenceLayerUrl: string;
};

export type RemoteConfigParams = {
  version: string;
  environment: EnvironmentTypes;
};
