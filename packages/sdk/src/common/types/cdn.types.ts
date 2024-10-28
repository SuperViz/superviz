import { PresenceEvents } from '@superviz/socket-client';

import type {
  CanvasPin,
  HTMLPin,
  Comments,
  MousePointers,
  Realtime,
  VideoConference,
  WhoIsOnline,
  FormElements,
  VideoMeeting,
} from '../../components';
import { FieldEvents } from '../../components/form-elements/types';
import type {
  RealtimeComponentEvent,
  RealtimeComponentState,
} from '../../components/realtime/types';
import type { LauncherFacade } from '../../core/launcher/types';
import type {
  CamerasPosition,
  LayoutMode,
  LayoutPosition,
} from '../../services/video-conference-manager/types';
import { PinMode } from '../../web-components/comments/components/types';

import type {
  DeviceEvent,
  MeetingEvent,
  RealtimeEvent,
  MeetingState,
  MeetingConnectionStatus,
  MeetingControlsEvent,
  ParticipantEvent,
  FrameEvent,
  CommentEvent,
  ComponentLifeCycleEvent,
  WhoIsOnlineEvent,
} from './events.types';
import { ParticipantType } from './participant.types';
import { SuperVizSdkOptions } from './sdk-options.types';
import { StoreType } from './stores.types';

export interface SuperVizCdn {
  init: (apiKey: string, options: SuperVizSdkOptions) => Promise<LauncherFacade>;
  CommentEvent: typeof CommentEvent;
  MeetingEvent: typeof MeetingEvent;
  RealtimeEvent: typeof RealtimeEvent;
  DeviceEvent: typeof DeviceEvent;
  MeetingState: typeof MeetingState;
  MeetingConnectionStatus: typeof MeetingConnectionStatus;
  MeetingControlsEvent: typeof MeetingControlsEvent;
  ParticipantEvent: typeof ParticipantEvent;
  WhoIsOnlineEvent: typeof WhoIsOnlineEvent;
  ComponentLifeCycleEvent: typeof ComponentLifeCycleEvent;
  FrameEvent: typeof FrameEvent;
  LayoutMode: typeof LayoutMode;
  ParticipantType: typeof ParticipantType;
  LayoutPosition: typeof LayoutPosition;
  CamerasPosition: typeof CamerasPosition;
  VideoConference: typeof VideoConference;
  VideoMeeting: typeof VideoMeeting;
  MousePointers: typeof MousePointers;
  Realtime: typeof Realtime;
  Comments: typeof Comments;
  CanvasPin: typeof CanvasPin;
  HTMLPin: typeof HTMLPin;
  WhoIsOnline: typeof WhoIsOnline;
  FormElements: typeof FormElements;
  RealtimeComponentState: typeof RealtimeComponentState;
  RealtimeComponentEvent: typeof RealtimeComponentEvent;
  StoreType: typeof StoreType;
  PresenceEvents: typeof PresenceEvents;
  FieldEvents: typeof FieldEvents;
  PinMode: typeof PinMode;
  Comment: typeof Comment;
}
