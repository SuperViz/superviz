import { EnvironmentTypes } from '../types/options.types';
import { Participant } from '../types/participant.types';

export enum ComponentNames {
  REALTIME = 'realtime',
}

export enum RealtimeComponentState {
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
}

export enum RealtimeChannelState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
}

export enum RealtimeComponentEvent {
  REALTIME_STATE_CHANGED = 'realtime-component.state-changed',
}

export enum RealtimeChannelEvent {
  REALTIME_CHANNEL_STATE_CHANGED = 'realtime-channel.state-changed',
}

export type RealtimeData = {
  name: string;
  payload: any;
};

export type RealtimeMessage<T = unknown> = {
  name: string;
  connectionId: string;
  participantId: string | null;
  data: T;
  timestamp: number;
};

type ChannelEvents = RealtimeChannelEvent | `${RealtimeChannelEvent}`;
type ChannelState = RealtimeChannelState | `${RealtimeChannelState}`;
type ComponentState = RealtimeComponentState | `${RealtimeComponentState}`;

type States = ChannelState | ComponentState;

export type Callback<T> = (data: T extends States ? T : RealtimeMessage<T>) => void;

export type RealtimeChannelSubscribe = {
  <T>(event: ChannelEvents, callback?: Callback<ChannelState>): void;
  <T>(event: string, callback?: Callback<T>): void;
};

export type RealtimePublish = <T>(event: string, data: T) => void;

export type Params = {
  participant?: Participant;
  environment?: EnvironmentTypes | `${EnvironmentTypes}`;
  debug?: boolean;
};

export type Limit = {
  canUse: boolean;
  maxParticipants: number | 'unlimited';
};

export type ComponentLimits = {
  realtime: Limit;
};

export type ApiKey = string;
export type Secret = { secret: string; clientId: string };

export type Auth = ApiKey | Secret;

export interface SecretValidationResponse {
  uuid: string;
  id: number;
  userId: string;
  apiKey: string;
  environment: EnvironmentTypes;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
