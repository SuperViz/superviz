import { DropdownOption } from '../../web-components/dropdown/types';

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

export type WhoIsOnlinePosition = Position | `${Position}` | string | '';

export interface WhoIsOnlineOptions {
  position?: WhoIsOnlinePosition;
  styles?: string;
  disablePresenceControls?: boolean;
  disableGoToParticipant?: boolean;
  disableFollowParticipant?: boolean;
  disablePrivateMode?: boolean;
  disableGatherAll?: boolean;
  disableFollowMe?: boolean;
}

export enum WIODropdownOptions {
  GOTO = 'go to',
  LOCAL_FOLLOW = 'follow',
  LOCAL_UNFOLLOW = 'unfollow',
  FOLLOW = 'everyone follows me',
  UNFOLLOW = 'stop followers',
  PRIVATE = 'private mode',
  LEAVE_PRIVATE = 'leave private mode',
  GATHER = 'gather all',
  STOP_GATHER = 'stop gather all',
}
