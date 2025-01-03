export type InitialParticipant = {
  id: string
  name: string
 }

export type Participant = InitialParticipant & {
  slot: Slot
  activeComponents: string[]
}

export type Slot = {
  index: number;
  color: string;
  textColor: string;
  colorName: string;
  timestamp: number;
}
