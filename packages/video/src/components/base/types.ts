import { Avatar, ParticipantType, Slot } from '../../common/types/participant.types';

export enum VideoEvent {
  PARTICIPANT_JOINED = 'participant.joined',
}

export interface VideoEventPayloads {}

export type EventOptions<T extends VideoEvent> = T | `${T}`

export type GeneralEvent = VideoEvent;

export type EventPayload<T extends GeneralEvent> =
  T extends keyof VideoEventPayloads ? VideoEventPayloads[T] : never;

export type Callback<T extends GeneralEvent> = (event: EventPayload<T>) => void;

export type ParticipantToFrame = {
  id: string;
  participantId: string;
  color: string;
  name: string;
  isHost: boolean;
  avatar?: Avatar;
  type: ParticipantType | `${ParticipantType}`;
  slot: Slot;
};
