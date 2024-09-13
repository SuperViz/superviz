// #region enums
import { ComponentLifeCycleEvent } from './types/events.types';

import {
  RealtimeComponentEvent,
  RealtimeComponentState,
  RealtimeChannelState,
  RealtimeChannelEvent,
} from './component/types';
import { PresenceEvents, PresenceEvent } from '@superviz/socket-client';

// #region Classes
import { Realtime } from './component';
import type { Channel } from './services/channel/channel';

// #region Types and Interfaces
import type { RealtimeMessage } from './component/types';
import type { Participant, Group } from './types/participant.types';

if (typeof window !== 'undefined') {
  window.Realtime = {
    Realtime,
    RealtimeComponentState,
    RealtimeComponentEvent,
    ComponentLifeCycleEvent,
    PresenceEvents,
    RealtimeChannelState,
    RealtimeChannelEvent,
  };
}

export {
  RealtimeComponentState,
  RealtimeComponentEvent,
  ComponentLifeCycleEvent,
  Realtime,
  RealtimeMessage,
  Channel,
  PresenceEvents,
  PresenceEvent,
  Participant,
  Group,
  RealtimeChannelState,
  RealtimeChannelEvent,
};

export default Realtime;
