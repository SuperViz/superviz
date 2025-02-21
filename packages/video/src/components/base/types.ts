import { MeetingState } from '../../common/types/events.types';
import { Avatar, Participant, ParticipantType, Slot } from '../../common/types/participant.types';

export enum VideoEvent {
  HOST_CHANGED = 'host.changed',
  PARTICIPANT_LEFT = 'participant.left',
  PARTICIPANT_JOINED = 'participant.joined',
  PARTICIPANT_KICKED = 'participant.kicked',
  PARTICIPANT_LIST_UPDATE = 'participant.list.update',
  MEETING_STATE_UPDATE = 'meeting.state.update',
}

export interface VideoEventPayloads {
  [VideoEvent.PARTICIPANT_JOINED]: Participant;
  [VideoEvent.PARTICIPANT_LEFT]: Participant;
  [VideoEvent.PARTICIPANT_KICKED]: Participant;
  [VideoEvent.PARTICIPANT_LIST_UPDATE]: Record<string, Participant>;
  [VideoEvent.MEETING_STATE_UPDATE]: MeetingState;
  [VideoEvent.HOST_CHANGED]: Participant | null;
}

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
