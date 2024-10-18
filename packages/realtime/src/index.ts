// #region enums

import { PresenceEvents, PresenceEvent } from '@superviz/socket-client';

// #region Classes
import { Realtime } from './component';
import {
  RealtimeComponentEvent,
  RealtimeComponentState,
  RealtimeChannelState,
  RealtimeChannelEvent,
} from './component/types';
import type { RealtimeMessage } from './component/types';
import type { Channel } from './services/channel/channel';
// #region Types and Interfaces
import { ComponentLifeCycleEvent } from './types/events.types';
import type { Participant, Group } from './types/participant.types';

if (typeof window !== 'undefined') {
  window.Realtime = Realtime;
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
