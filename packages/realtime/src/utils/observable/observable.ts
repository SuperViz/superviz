import { RealtimeComponentEvent } from '../../component/types';
import { ComponentLifeCycleEvent } from '../../types/events.types';
import type { Subscribe, Unsubscribe } from '../../types/observable';
import { Logger } from '../logger';
import { Observer } from '../observer';

export abstract class Observable {
  protected abstract logger: Logger;
  protected observers: Record<string, Observer> = {};

  /**
   * @function subscribe
   * @description Subscribe to an event
   * @param type - event type
   * @param listener - event callback
   * @returns {void}
   */
  public subscribe: Subscribe = (
    type:
      | `${RealtimeComponentEvent}`
      | `${ComponentLifeCycleEvent}`
      | RealtimeComponentEvent
      | ComponentLifeCycleEvent,
    listener: Function,
  ): void => {
    this.logger.log(`subscribed to ${type} event`);

    if (!this.observers[type]) {
      this.observers[type] = new Observer({ logger: this.logger });
    }

    this.observers[type].subscribe(listener);
  };

  /**
   * @function unsubscribe
   * @description Unsubscribe from an event
   * @param type - event type
   * @returns {void}
   */
  public unsubscribe: Unsubscribe = (
    type:
      | `${RealtimeComponentEvent}`
      | `${ComponentLifeCycleEvent}`
      | RealtimeComponentEvent
      | ComponentLifeCycleEvent,
    listener?: Function,
  ): void => {
    this.logger.log(`unsubscribed from ${type} event`);

    if (!this.observers[type]) return;

    if (!listener) {
      this.observers[type].destroy();
      delete this.observers[type];
      return;
    }

    this.observers[type].unsubscribe(listener);
  };

  /**
   * @function publish
   * @description Publish an event to client
   * @param type - event type
   * @param data - event data
   * @returns {void}
   */
  protected publish = (type: string, data?: unknown): void => {
    const hasListenerRegistered = type in this.observers;

    if (!hasListenerRegistered) return;

    this.observers[type].publish(data);
  };
}
