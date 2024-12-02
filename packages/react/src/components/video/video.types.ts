import type {
  Avatar,
  CamerasPosition,
  DeviceEvent,
  DevicesOptions,
  Dimensions,
  LayoutMode,
  LayoutPosition,
  Locale,
  MeetingConnectionStatus,
  MeetingState,
  Offset,
  Participant,
  ParticipantType,
} from '../../lib/sdk';

export interface VideoProps {
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
  participantType?: `${ParticipantType}`;
  collaborationMode?: {
    enabled?: boolean;
    position?: `${CamerasPosition}`;
    modalPosition?: `${LayoutPosition}`;
    initialView?: `${LayoutMode}`;
  };
  styles?: string;
  callbacks?: {
    onToggleMicrophone?: () => void;
    onToggleCam?: () => void;
    onToggleRecording?: () => void;
    onToggleChat?: () => void;
    onToggleScreenShare?: () => void;
    onClickHangup?: () => void;
    onToggleMeetingSetup?: () => void;
  };
}

export interface VideoCallbacks {
  onDestroy?: () => void;
  onFrameDimensionsChange?: (dimensions: Dimensions) => void;
  onWaitingForHostChange?: (waiting: boolean) => void;
  onConnectionStatusChange?: (status: MeetingConnectionStatus) => void;
  onMeetingStart?: () => void;
  onMeetingStateChange?: (state: MeetingState) => void;
  onSameAccountError?: () => void;
  onDevicesStateChange?: (state: DeviceEvent) => void;
  onHostChange?: (participant: Participant) => void;
  onHostAvailable?: () => void;
  onNoHostAvailable?: () => void;
  onParticipantJoin?: (participant: Participant) => void;
  onLocalParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (participant: Participant) => void;
  onLocalParticipantLeave?: (participant: Participant) => void;
  onParticipantListChange?: (participants: Participant[]) => void;
  onParticipantAmountChange?: (amount: number) => void;
  onKickAllParticipants?: () => void;
  onKickLocalParticipant?: () => void;
  onMount?: () => void;
  onUnmount?: () => void;
}

export type VideoComponentProps = VideoProps & VideoCallbacks;
