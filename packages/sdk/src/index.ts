import init from './core';
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
  VideoConference,
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
import type { LauncherFacade } from './core/launcher/types';
import type { BrowserStats } from './services/browser/types';
import { Presence3DManager } from './services/presence-3d-manager';
import {
  CamerasPosition,
  LayoutMode,
  LayoutPosition,
} from './services/video-conference-manager/types';
import { PinMode } from './web-components/comments/components/types';

if (typeof window !== 'undefined') {
  window.SuperVizRoom = {
    init,
    CommentEvent,
    MeetingEvent,
    DeviceEvent,
    RealtimeEvent,
    MeetingState,
    MeetingConnectionStatus,
    MeetingControlsEvent,
    ParticipantEvent,
    FrameEvent,
    LayoutMode,
    VideoConference,
    MousePointers,
    Realtime,
    Comments,
    CanvasPin,
    HTMLPin,
    WhoIsOnline,
    FormElements,
    ParticipantType,
    LayoutPosition,
    CamerasPosition,
    RealtimeComponentState,
    RealtimeComponentEvent,
    ComponentLifeCycleEvent,
    WhoIsOnlineEvent,
    StoreType,
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
  LayoutMode,
  ParticipantType,
  LayoutPosition,
  CamerasPosition,
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
  VideoConference,
  Realtime,
  RealtimeMessage,
  Channel,
  StoreType,
  PresenceEvents,
  Presence3DManager,
  FieldEvents,
  PinMode,
  Participant,
  SuperVizSdkOptions,
  BrowserStats,
  LauncherFacade,
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

export default init;
