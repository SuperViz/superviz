import { Logger, Observer } from '../../common/utils';

export class EventBus {
  private readonly logger: Logger;

  private observers: Map<string, Observer> = new Map();

  constructor() {
    this.logger = new Logger('@superviz/sdk/event-bus');

    this.logger.log('event bus created');
  }

  /**
   * @function subscribe
   * @description subscribe to event
   * @param event - event name
   * @param callback - callback function
   * @returns {void}
   */
  public subscribe = (event: string, callback: (data: unknown) => void): void => {
    this.logger.log('event bus service @ subscribe', { event, callback });

    if (!this.observers.has(event)) {
      this.observers.set(event, new Observer());
    }

    this.observers.get(event).subscribe(callback);
  };

  /**
   * @function unsubscribe
   * @description - unsubscribe from event
   * @param event - event name
   * @param callback - callback function
   * @returns {void}
   */
  public unsubscribe = (event: string, callback: (data: unknown) => void): void => {
    this.logger.log('event bus service @ unsubscribe', { event, callback });

    if (!this.observers.has(event)) return;

    this.observers.get(event).reset();
    this.observers.delete(event);
  };

  /**
   * @function publish
   * @description - publish event
   * @param event - event name
   * @param data - data to publish
   * @returns {void}
   */
  public publish = (event: string, data: unknown): void => {
    this.logger.log('event bus service @ publish', { event, data });

    if (!this.observers.has(event)) return;

    this.observers.get(event).publish(data);
  };

  public destroy = (): void => {
    this.logger.log('event bus service @ destroy');

    this.observers.forEach((observer) => {
      observer.reset();
      observer.destroy();
    });
    this.observers.clear();
  };
}
