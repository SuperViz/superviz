import type { RealtimeComponentEvent, RealtimeComponentState } from '../component/types';

import type { ComponentLifeCycleEvent } from './events.types';

export type Subscribe = {
  (
    event: RealtimeComponentEvent | `${RealtimeComponentEvent}`,
    listener: (data: RealtimeComponentState | `${RealtimeComponentState}`) => void,
  ): void;
  (
    event: ComponentLifeCycleEvent | `${ComponentLifeCycleEvent}`,
    listener: (data: unknown) => void,
  ): void;
};

export type Unsubscribe = {
  (
    event: RealtimeComponentEvent | `${RealtimeComponentEvent}`,
    listener?: (data: RealtimeComponentState | `${RealtimeComponentState}`) => void,
  ): void;
  (
    event: ComponentLifeCycleEvent | `${ComponentLifeCycleEvent}`,
    listener?: (data: unknown) => void,
  ): void;
};
