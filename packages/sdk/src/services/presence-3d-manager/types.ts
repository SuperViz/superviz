import { Participant } from '../../common/types/participant.types';

export interface ParticipantDataInput extends Participant {
  [key: string]: string | number | Array<unknown> | Object;
}

export enum Presence3dEvents {
  PARTICIPANT_JOINED = 'participant-joined',
  PARTICIPANT_LEFT = 'participant-left',
  PARTICIPANT_UPDATED = 'participant-updated',
}
