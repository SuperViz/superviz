import { Avatar, ParticipantType, Slot } from '../../common/types/participant.types';
import { DevicesOptions } from '../../common/types/sdk-options.types';
import {
  CamerasPosition,
  LayoutMode,
  LayoutPosition,
  Locale,
  Offset,
} from '../../services/video-conference-manager/types';

export interface VideoComponentOptions {
  showAudienceList?: boolean;
  camsOff?: boolean;
  screenshareOff?: boolean;
  chatOff?: boolean;
  enableRecording?: boolean;
  defaultAvatars?: boolean;
  offset?: Offset;
  enableFollow?: boolean;
  enableGoTo?: boolean;
  enableGather?: boolean;
  defaultToolbar?: boolean;
  devices?: DevicesOptions;
  language?: string;
  locales?: Locale[];
  avatars?: Avatar[];
  skipMeetingSettings?: boolean;
  allowGuests?: boolean;
  userType?: ParticipantType | `${ParticipantType}`;
  styles?: string;
  participantType?: ParticipantType | `${ParticipantType}`;
  collaborationMode?: {
    enabled?: boolean;
    position?: CamerasPosition | `${CamerasPosition}`;
    modalPosition?: LayoutPosition | `${LayoutPosition}`;
    initialView?: LayoutMode | `${LayoutMode}`;
  };
  callbacks?: {
    onToggleMicrophone?: () => void;
    onToggleCam?: () => void;
    onToggleRecording?: () => void;
    onToggleChat?: () => void;
    onToggleScreenShare?: () => void;
    onLeaveMeeting?: () => void;
    onClickSettings?: () => void;
  };
}

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
