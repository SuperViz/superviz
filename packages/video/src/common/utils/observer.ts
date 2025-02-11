import throttle from 'lodash/throttle';
import { Subject, Subscription } from 'rxjs';

import { Logger } from './logger';

export type Callback<T> = (data: T) => void;

interface ObserverOptions {
  throttleTime?: number;
  logger?: Logger;
}

export class Observer {
  private logger?: Logger;
  private callbacks: Callback<unknown>[] = [];
  private subject: Subject<unknown> = new Subject();
  private throttle: number;

  constructor({ logger, throttleTime }: ObserverOptions = {}) {
    this.logger = logger ?? new Logger('@superviz/video/observer');
    this.throttle = throttleTime || 0;

    if (this.throttle) {
      this.publish = throttle(this.publish, this.throttle);
    }
  }

  public subscribe = (callback: Callback<unknown>): void => {
    this.logger?.log('observer @ subscribe');
    this.callbacks.push(callback);
    const subscription = this.subject.subscribe(callback);
    this.callbacks.push(() => subscription.unsubscribe());
  };

  public unsubscribe = (callbackToRemove: Callback<unknown>): void => {
    this.logger?.log('observer @ unsubscribe');
    this.callbacks = this.callbacks.filter((callback) => callback !== callbackToRemove);
  };

  public publish = (data: unknown): void => {
    this.logger?.log('observer @ publish', data);
    this.subject.next(data);
  };

  public reset = (): void => {
    this.logger?.log('observer @ reset');
    this.callbacks.forEach((callback) => this.unsubscribe(callback));
    this.callbacks = [];
  };

  public destroy = (): void => {
    this.logger?.log('observer @ destroy');
    this.reset();
    delete this.logger;
  };
}
