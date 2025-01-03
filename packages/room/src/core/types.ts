import { InitialParticipant, Participant } from '../common/types/participant.types';
import { IOCState } from '../services/io/types';

export interface RoomParams {
  participant: InitialParticipant;
}

type RoomError = {
  code: string,
  message: string
}

type RoomUpdate = {
  status: IOCState,
}

export enum ParticipantEvent {
  MY_PARTICIPANT_JOINED = 'my-participant.joined',
  MY_PARTICIPANT_LEFT = 'my-participant.left',
  MY_PARTICIPANT_UPDATED = 'my-participant.updated',
  PARTICIPANT_JOINED = 'participant.joined',
  PARTICIPANT_LEFT = 'participant.left',
  PARTICIPANT_UPDATED = 'participant.updated',
}

export enum RoomEvent {
  ERROR = 'room.error',
  UPDATE = 'room.update',
}

export interface RoomEventPayloads {
  [ParticipantEvent.MY_PARTICIPANT_JOINED]: Participant;
  [ParticipantEvent.MY_PARTICIPANT_LEFT]: Participant;
  [ParticipantEvent.MY_PARTICIPANT_UPDATED]: Participant;
  [ParticipantEvent.PARTICIPANT_JOINED]: Participant;
  [ParticipantEvent.PARTICIPANT_LEFT]: Participant;
  [ParticipantEvent.PARTICIPANT_UPDATED]: Participant;
  [RoomEvent.ERROR]: RoomError;
  [RoomEvent.UPDATE]: RoomUpdate;
}

export type EventOptions<T extends ParticipantEvent | RoomEvent> = T | `${T}`

export type GeneralEvent = ParticipantEvent | RoomEvent;

export type RoomEventPayload<T extends GeneralEvent> =
  T extends keyof RoomEventPayloads ? RoomEventPayloads[T] : never;

export type RoomEventPair = {
    [K in keyof RoomEventPayloads]: { event: K; payload: RoomEventPayloads[K] };
  }[keyof RoomEventPayloads];

export type Callback<T extends GeneralEvent> = (event: RoomEventPayload<T>) => void;
