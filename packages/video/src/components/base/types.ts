export enum VideoEvent {
  MY_PARTICIPANT_JOINED = 'MY_PARTICIPANT_JOINED',
}

export interface VideoEventPayloads {}

export type EventOptions<T extends VideoEvent> = T | `${T}`

export type GeneralEvent = VideoEvent;

export type EventPayload<T extends GeneralEvent> =
  T extends keyof VideoEventPayloads ? VideoEventPayloads[T] : never;

export type Callback<T extends GeneralEvent> = (event: EventPayload<T>) => void;
