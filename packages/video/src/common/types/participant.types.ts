export interface Avatar {
  model3DUrl?: string;
  imageUrl?: string;
}

export type Participant = {
  id: string
  name: string
  email: string
  avatar: Avatar
  type: ParticipantType
  slot: Slot
  activeComponents: string[]
}

export interface VideoParticipant extends Participant {
  participantId?: string;
  color?: string;
  isHost: boolean
}

export type Slot = {
  index: number | null;
  color: string;
  textColor: string;
  colorName: string;
  timestamp: number;
}

export enum ParticipantType {
  HOST = 'host',
  GUEST = 'guest',
  AUDIENCE = 'audience',
}
