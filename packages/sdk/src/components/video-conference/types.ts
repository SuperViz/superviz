import { Avatar, ParticipantType } from '../../common/types/participant.types';
import { DevicesOptions } from '../../common/types/sdk-options.types';
import { CamerasPosition, LayoutMode, LayoutPosition, Locale, Offset } from '../../services/video-conference-manager/types';

export interface VideoConferenceOptions {
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
