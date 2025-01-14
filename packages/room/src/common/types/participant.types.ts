export type InitialParticipant = {
  id: string
  name: string
  email?: string
 }

export type Participant = InitialParticipant & {
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
