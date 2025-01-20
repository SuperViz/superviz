export type InitialParticipant = {
  id: string
  name: string
  email?: string
  avatar?: Avatar
 }

export interface Avatar {
  model3DUrl?: string;
  imageUrl?: string;
}

export type Participant = InitialParticipant & {
  type: ParticipantType
  slot: Slot
  activeComponents: string[]
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
