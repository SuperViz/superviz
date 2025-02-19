export interface Options {
  label: string;
  id: string;
  name: string;
  color: string;
  slotIndex: number;
}

export interface LocalParticipantData {
  id: string;
  joinedPresence: boolean;
}

export enum VerticalSide {
  TOP = 'top-side',
  BOTTOM = 'bottom-side',
}

export enum HorizontalSide {
  LEFT = 'left-side',
  RIGHT = 'right-side',
}
