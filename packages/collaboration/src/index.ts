import './web-components';
import './common/styles/global.css';

// #region enums
import { PresenceEvents } from '@superviz/socket-client';

import {
  MeetingEvent,
  RealtimeEvent,
  DeviceEvent,
  MeetingState,
  MeetingConnectionStatus,
  MeetingControlsEvent,
  ParticipantEvent,
  FrameEvent,
  CommentEvent,
  ComponentLifeCycleEvent,
  WhoIsOnlineEvent,
} from './common/types/events.types';
import { ParticipantType } from './common/types/participant.types';

// #region Classes

// #region Types and Interfaces
import type { Participant, Group, Avatar } from './common/types/participant.types';
import type { SuperVizSdkOptions, DevicesOptions } from './common/types/sdk-options.types';
import { StoreType } from './common/types/stores.types';
import {
  MousePointers,
  Realtime,
  Comments,
  CanvasPin,
  HTMLPin,
  WhoIsOnline,
  FormElements,
} from './components';
import type {
  Annotation,
  Comment,
  PinAdapter,
  PinCoordinates,
  AnnotationPositionInfo,
  Offset,
} from './components/comments/types';
import { FieldEvents } from './components/form-elements/types';
import type { Transform } from './components/presence-mouse/types';
import type { Channel } from './components/realtime/channel';
import type { RealtimeMessage } from './components/realtime/types';
import { RealtimeComponentEvent, RealtimeComponentState } from './components/realtime/types';
import { PinMode } from './web-components/comments/components/types';

if (typeof window !== 'undefined') {
  window.SuperVizCollaboration = {
    CommentEvent,
    MeetingEvent,
    DeviceEvent,
    RealtimeEvent,
    MeetingState,
    MeetingConnectionStatus,
    MeetingControlsEvent,
    ParticipantEvent,
    FrameEvent,
    MousePointers,
    Realtime,
    Comments,
    CanvasPin,
    HTMLPin,
    WhoIsOnline,
    FormElements,
    ParticipantType,
    ComponentLifeCycleEvent,
    WhoIsOnlineEvent,
    PresenceEvents,
    FieldEvents,
    PinMode,
    Comment,
  };
}

export {
  MeetingEvent,
  RealtimeEvent,
  DeviceEvent,
  MeetingState,
  MeetingConnectionStatus,
  MeetingControlsEvent,
  ParticipantEvent,
  FrameEvent,
  ParticipantType,
  RealtimeComponentState,
  RealtimeComponentEvent,
  CommentEvent,
  ComponentLifeCycleEvent,
  WhoIsOnlineEvent,
  FormElements,
  Transform,
  Comments,
  CanvasPin,
  HTMLPin,
  MousePointers,
  WhoIsOnline,
  Realtime,
  RealtimeMessage,
  Channel,
  StoreType,
  PresenceEvents,
  FieldEvents,
  PinMode,
  Participant,
  SuperVizSdkOptions,
  Annotation,
  Comment,
  PinAdapter,
  PinCoordinates,
  AnnotationPositionInfo,
  Offset,
  DevicesOptions,
  Group,
  Avatar,
};
