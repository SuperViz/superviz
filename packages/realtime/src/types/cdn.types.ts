import type { Realtime } from '../component';
import type {
  RealtimeChannelEvent,
  RealtimeChannelState,
  RealtimeComponentEvent,
  RealtimeComponentState,
} from '../component/types';

import type { ComponentLifeCycleEvent } from './events.types';
import { PresenceEvents } from '@superviz/socket-client';

export interface RealtimeCdn {
  ComponentLifeCycleEvent: typeof ComponentLifeCycleEvent;
  Realtime: typeof Realtime;
  RealtimeComponentState: typeof RealtimeComponentState;
  RealtimeComponentEvent: typeof RealtimeComponentEvent;
  RealtimeChannelState: typeof RealtimeChannelState;
  RealtimeChannelEvent: typeof RealtimeChannelEvent;
  PresenceEvents: typeof PresenceEvents;
}
