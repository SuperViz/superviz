import throttle from 'lodash/throttle';

import { Logger } from './logger';

export type OberverOptions = {
  throttleTime?: number;
  logger?: Logger;
};

export class Observer {
  private logger: Logger;
  private callbacks: Function[];
  private throttle: number;

  constructor(options: OberverOptions = {}) {
    const { logger, throttleTime } = options;

    this.logger = logger ?? new Logger('@superviz/sdk/observer-helper');
    this.throttle = throttleTime;
    this.callbacks = [];

    if (this.throttle) {
      this.publish = throttle(this.publish, this.throttle);
    }
  }

  /**
   * @function subscribe
   * @description Subscribe to observer
   * @param callback
   * @returns {void}
   */
  public subscribe = (callback: Function): void => {
    this.callbacks.push(callback);
  };

  /**
   * @function unsubscribe
   * @description Unsubscribe from observer
   * @param callbackToRemove
   * @returns {void}
   */
  public unsubscribe = (callbackToRemove: Function): void => {
    this.callbacks = this.callbacks.filter((callback: Function) => callback !== callbackToRemove);
  };

  /**
   * @function publish
   * @description Publish event to all subscribers
   * @param event
   * @returns {void}
   */
  public publish = (...event: any[]): void => {
    if (!this.callbacks) return;

    this.callbacks.forEach((callback: Function) => {
      this.callListener(callback, event).catch((error: Error) => {
        this.logger.log(
          'superviz-sdk:observer-helper:publish:error',
          `
            Failed to execute callback on publish value.
            Callback: ${callback}
            Event: ${JSON.stringify(event)}
            Error: ${error}
          `,
        );
      });
    });
  };

  /**
   * @function reset
   * @description Reset observer
   * @returns {void}
   */
  public reset = (): void => {
    this.callbacks = [];
  };

  /**
   * @function destroy
   * @description Destroy observer
   * @returns {void}
   */
  public destroy = (): void => {
    delete this.logger;
    delete this.callbacks;
  };

  /**
   * @function callListener
   * @description Call listener with params
   * @param listener
   * @param params
   * @returns
   */
  private callListener = (listener: Function, params: any[]): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      try {
        const result = listener(...params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };
}
