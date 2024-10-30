import { Avatar, ParticipantType, Slot } from '../../common/types/participant.types';

export type ParticipantToFrame = {
  id: string;
  timestamp: number;
  participantId: string;
  color: string;
  name: string;
  isHost: boolean;
  avatar?: Avatar;
  type: ParticipantType | `${ParticipantType}`;
  slot: Slot;
};
