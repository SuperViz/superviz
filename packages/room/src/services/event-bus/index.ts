import { Subject, Subscription } from 'rxjs';

import { Logger } from '../../common/utils/logger';

type Callback<T> = (event: T) => void;

export class EventBus {
  private logger: Logger;

  private subscriptions: Map<Callback<unknown>, Subscription> = new Map();
  private observers: Map<string, Subject<unknown>> = new Map();

  constructor() {
    this.logger = new Logger('@superviz/room/event-bus');
    this.logger.log('event-bus created');
  }

  /**
     * @description Listen to an event
     * @param event - The event to listen to
     * @param callback - The callback to execute when the event is emitted
     * @returns {void}
     */
  public subscribe<E>(
    event: string,
    callback: Callback<E>,
  ): void {
    this.logger.log('event-bus @ subscribe', event);

    let subject = this.observers.get(event);

    if (!subject) {
      subject = new Subject<E>();
      this.observers.set(event, subject);
    }

    this.subscriptions.set(callback, subject.subscribe(callback));
  }

  /**
     * @description Stop listening to an event
     * @param event - The event to stop listening to
     * @param callback - The callback to remove from the event
     * @returns {void}
     */
  public unsubscribe<E>(
    event: string,
    callback?: Callback<E>,
  ): void {
    this.logger.log('event-bus @ unsubscribe', event);

    if (!callback) {
      this.observers.delete(event as string);
      return;
    }

    this.subscriptions.get(callback)?.unsubscribe();
    this.subscriptions.delete(callback);
  }

  /**
     * Emits an event to the observers.
     *
     * @template E - The type of the event.
     * @param event - The event options containing the event type.
     * @param data - The payload data associated with the event.
     * @returns void
     */
  public publish<E>(
    event: string,
    data: E,
  ): void {
    this.logger.log('event-bus @ publish', event);
    const subject = this.observers.get(event);

    if (!subject) return;

    subject.next(data);
  }

  public destroy(): void {
    this.logger.log('event-bus @ destroy');

    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();

    this.observers.forEach((observer) => observer.complete());
    this.observers.clear();
  }
}
