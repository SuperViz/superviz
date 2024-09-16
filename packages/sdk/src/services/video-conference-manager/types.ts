import { ColorsVariables } from '../../common/types/colors.types';
import { MeetingEvent, RealtimeEvent } from '../../common/types/events.types';
import type { Avatar } from '../../common/types/participant.types';
import { BrowserService } from '../browser';
import { ComponentLimits } from '../limits/types';

export interface VideoManagerOptions {
  language?: string;
  canUseChat: boolean;
  canUseCams: boolean;
  canShowAudienceList: boolean;
  canUseRecording: boolean;
  canUseScreenshare: boolean;
  canUseDefaultAvatars: boolean;
  canUseGather: boolean;
  canUseFollow: boolean;
  canUseGoTo: boolean;
  canUseDefaultToolbar: boolean;
  styles?: string;
  camerasPosition: CamerasPosition;
  devices: {
    audioInput: boolean;
    audioOutput: boolean;
    videoInput: boolean;
  };
  skipMeetingSettings: boolean;
  browserService: BrowserService;
  collaborationMode: boolean;
  offset?: Offset;
  locales?: Locale[];
  avatars?: Avatar[];
  customColors?: ColorsVariables;
  waterMark?: boolean;
  layoutPosition?: LayoutPosition;
  layoutMode?: LayoutMode;
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

export interface WindowSize {
  height: number;
  width: number;
}

export interface Offset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface FrameLocale {
  language?: string;
  locales: Locale[];
}

export interface FrameConfig {
  apiKey: string;
  apiUrl: string;
  roomId: string;
  debug: boolean;
  limits: ComponentLimits;
  canShowAudienceList: boolean;
  canUseChat: boolean;
  canUseCams: boolean;
  canUseScreenshare: boolean;
  canUseDefaultAvatars: boolean;
  canUseRecording: boolean;
  canUseFollow: boolean;
  canUseGoTo: boolean;
  canUseGather: boolean;
  canUseDefaultToolbar: boolean;
  camerasPosition: CamerasPosition;
  devices: DevicesConfig;
  waterMark: boolean;
  skipMeetingSettings: boolean;
  layoutPosition: LayoutPosition;
  layoutMode?: LayoutMode;
  collaborationMode: boolean;
  transcriptLangs: string[];
}

export interface DevicesConfig {
  audioInput: boolean;
  audioOutput: boolean;
  videoInput: boolean;
}

export interface Locale {
  language: string;
  messages: Record<string, string | Record<string, string>>;
}

export interface LayoutModalsAndCameras {
  layoutPosition: LayoutPosition;
  camerasPosition: CamerasPosition;
}

export interface DrawingData {
  name: string;
  lineColor: string;
  textColor: string;
  pencil: string;
  clickX?: number[];
  clickY?: number[];
  clickDrag?: boolean[];
  drawingWidth: number;
  drawingHeight: number;
  externalClickX: number;
  externalClickY: number;
  fadeOut: boolean;
}

export interface RealtimeObserverPayload {
  event: RealtimeEvent | MeetingEvent;
  data: unknown;
}

export enum LayoutPosition {
  RIGHT = 'right',
  CENTER = 'center',
  LEFT = 'left',
}

export enum LayoutMode {
  GRID = 'grid',
  LIST = 'list',
}

export enum CamerasPosition {
  RIGHT = 'right',
  LEFT = 'left',
  TOP = 'top',
  BOTTOM = 'bottom',
}

export enum VideoFrameState {
  UNINITIALIZED,
  INITIALIZING,
  INITIALIZED,
}
