import { Participant, Group } from './participant.types';

export interface StartMeetingOptions {
  roomId: string;
  participant: Participant;
  group: Group;
}
