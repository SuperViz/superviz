export interface DropdownOption {
  label: string;
  icon?: string;
  active?: boolean;
}

export interface Following {
  id: string;
  name: string;
  color: string;
}

export enum Position {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}

export interface TooltipData {
  name: string;
  info?: string;
}

export interface Avatar {
  imageUrl: string;
  firstLetter: string;
  color: string;
  letterColor: string;
}

export interface WhoIsOnlineParticipant {
  id: string;
  name: string;
  disableDropdown?: boolean;
  controls?: DropdownOption[];
  tooltip?: TooltipData;
  avatar: Avatar;
  activeComponents: string[];
  isLocalParticipant?: boolean;
  isPrivate: boolean;
}
