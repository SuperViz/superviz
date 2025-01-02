import { Participant } from '../common/types/participant.types';

export interface RoomParams {
  participant: Participant
}

export type RoomEventsArg = string
export type Callback<T> = (event: T) => void;
