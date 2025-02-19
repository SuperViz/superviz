import type {
  CanvasPin,
  HTMLPin,
  Comments,
  MousePointers,
  Realtime,
  WhoIsOnline,
  FormElements,
} from '../../components';

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
import { PresenceEvents } from '@superviz/socket-client';
import { FieldEvents } from '../../components/form-elements/types';
import { PinMode } from '../../web-components/comments/components/types';

export interface SuperVizCdn {
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
  ParticipantType: typeof ParticipantType;
  MousePointers: typeof MousePointers;
  Realtime: typeof Realtime;
  Comments: typeof Comments;
  CanvasPin: typeof CanvasPin;
  HTMLPin: typeof HTMLPin;
  WhoIsOnline: typeof WhoIsOnline;
  FormElements: typeof FormElements;
  PresenceEvents: typeof PresenceEvents;
  FieldEvents: typeof FieldEvents;
  PinMode: typeof PinMode;
  Comment: typeof Comment;
}
