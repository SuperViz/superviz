import { ComponentNames } from '../../components/types';

export enum ParticipantType {
  HOST = 'host',
  GUEST = 'guest',
  AUDIENCE = 'audience',
}

export type Slot = {
  index: number;
  color: string;
  textColor: string;
  colorName: string;
  timestamp: number;
};

export interface Participant {
  id: string;
  name?: string;
  type?: ParticipantType | `${ParticipantType}`;
  slot?: Slot;
  avatar?: Avatar;
  isHost?: boolean;
  // @NOTE - this is a hack to make the participant info work with the 3D avatar
  avatarConfig?: unknown;
  activeComponents?: ComponentNames[];
  timestamp?: number;
}

export interface VideoParticipant extends Participant {
  participantId?: string;
  color?: string;
  joinedMeeting?: boolean;
}

export type ParticipantByGroupApi = {
  id: string;
  name: string;
  avatar: string;
  email: string;
};

export interface Group {
  id: string;
  name: string;
}

export interface Avatar {
  model3DUrl?: string;
  imageUrl?: string;
}

export type ParticipantByCommentsApi = {
  uuid: string;
  participantId: string;
  name: string;
  createdAt: string;
  avatar: string;
};
