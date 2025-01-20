import { FeatureFlags } from '../../common/types/feature-flag.types';
import { Group } from '../../common/types/group.types';

export interface Configuration {
  roomId: string;
  environment: 'dev' | 'prod';
  apiKey: string;
  apiUrl: string;
  debug: boolean;
  limits: ComponentLimits;
  waterMark: boolean;
  group: Group
  features: FeatureFlags;
}

type Paths<T> = T extends object
  ? {
      [K in keyof T]: `${Exclude<K, symbol>}${'' | `.${Paths<T[K]>}`}`;
    }[keyof T]
  : never;

export type Key = Paths<Configuration>;

export type Limit = {
  canUse: boolean;
  maxParticipants: number;
};

export type VideoConferenceLimit = Limit & {
  canUseTranscript: boolean;
};

export type ComponentLimits = {
  videoConference: VideoConferenceLimit;
  presence: Limit;
  realtime: Limit;
};
