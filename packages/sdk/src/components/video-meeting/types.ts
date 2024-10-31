import { ParticipantType } from '../../common/types/participant.types';
import { Locale } from '../../services/video-conference-manager/types';

export interface VideoMeetingParams {
  brand?: {
    logoUrl?: string
  }
  permissions: {
    allowGuests?: boolean
    toggleMic?: boolean
    toggleCamera?: boolean,
    toggleScreenShare?: boolean,
    toggleRecording?: boolean,
    toggleChat?: boolean,
    toggleParticipantList?: boolean
  },
  participantType?: ParticipantType | `${ParticipantType}`
  i18n?: {
    language?: string;
    locales?: Locale[];
  },
  styles?: string;
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
