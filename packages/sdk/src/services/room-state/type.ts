import { PresenceEvent } from '@superviz/socket-client';

import { TranscriptState } from '../../common/types/events.types';
import { Participant } from '../../common/types/participant.types';

export interface VideoRoomProperties {
  hostClientId?: string;
  isGridModeEnabled?: boolean;
  followParticipantId?: string;
  gather?: boolean;
  kickParticipant?: PresenceEvent<Participant>;
  transcript?: TranscriptState;
}

export enum RoomPropertiesEvents {
  UPDATE = 'update',
  KICK_PARTICIPANT = 'kick-participant',
  DRAWING = 'drawing',
  GATHER = 'gather',
  FOLLOW = 'follow',
  TRANSCRIPT = 'transcript',
  GRID_MODE = 'grid-mode',
  HOST = 'host',
}
