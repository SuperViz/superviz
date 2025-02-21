import { BehaviorSubject, distinctUntilChanged, shareReplay } from 'rxjs';
import type { Subscription } from 'rxjs';

import { PublicSubject } from '../common/types';

export class Subject<T> {
  public state: T;
  private firstState: T;

  private subject: BehaviorSubject<T>;
  private subscriptions: Map<string | this, Subscription[]> = new Map();

  constructor(state: T, subject: BehaviorSubject<T>) {
    this.state = state;
    this.firstState = state;

    this.subject = subject.pipe(
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    ) as BehaviorSubject<T>;
  }

  private getValue(): T {
    return this.state;
  }

  private setValue = (newValue: T): void => {
    this.state = newValue;
    this.subject.next(this.state);
  };

  public subscribe = (subscriptionId: string | this, callback: (value: T) => void) => {
    const subscription = this.subject.subscribe(callback);

    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.get(subscriptionId).push(subscription);
      return;
    }

    this.subscriptions.set(subscriptionId, [subscription]);
  };

  public unsubscribe(subscriptionId: string) {
    this.subscriptions.get(subscriptionId)?.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.delete(subscriptionId);
  }

  public destroy() {
    this.subscriptions.clear();
    this.subject.complete();

    this.restart();
  }

  private restart() {
    this.state = this.firstState;

    this.subject = new BehaviorSubject<T>(this.firstState).pipe(
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    ) as BehaviorSubject<T>;
  }

  public expose(): PublicSubject<T> {
    const subscribe = this.subscribe.bind(this);
    const unsubscribe = this.unsubscribe.bind(this);
    const getter = this.getValue.bind(this);
    const setter = this.setValue.bind(this);

    return {
      get value() {
        return getter();
      },
      set value(newValue: T) {
        setter(newValue);
      },
      subscribe,
      unsubscribe,
    };
  }
}

export default function subject<T>(initialState: T): Subject<T> {
  const subject = new BehaviorSubject<T>(initialState);

  return new Subject<T>(initialState, subject);
}
