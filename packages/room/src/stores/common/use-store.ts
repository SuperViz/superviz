import { useGlobalStore } from '../global';
import { usePresence3DStore } from '../presence-3D';
import { useVideoStore } from '../video';
import { useWhoIsOnlineStore } from '../who-is-online';

import { PublicSubject, Store, StoreType } from './types';

const stores = {
  [StoreType.WHO_IS_ONLINE]: useWhoIsOnlineStore,
  [StoreType.GLOBAL]: useGlobalStore,
  [StoreType.PRESENCE_3D]: usePresence3DStore,
  [StoreType.VIDEO]: useVideoStore,
};

/**
 * Subscribes to a given `PublicSubject`
 and updates the property or calls the callback when the subject's value changes.
 *
 * @template T - The type of the value emitted by the subject.
 * @param {string} name - The name of the property to update with the subject's value.
 * @param {PublicSubject<T>} subject - The subject to subscribe to.
 * @param {(value: T) => void} [callback] - Optional callback function
 to call with the subject's value.
 *
 * @returns {void}
 */
function subscribeTo<T>(
  name: string,
  subject: PublicSubject<T>,
  callback?: (value: T) => void,
): void {
  subject.subscribe(this, () => {
    if (callback) {
      callback(subject.value);
    } else {
      this[name] = subject.value;
    }

    if (this.requestUpdate) this.requestUpdate();
  });

  if (!this.unsubscribeFrom) this.unsubscribeFrom = [];
  this.unsubscribeFrom.push(subject.unsubscribe);
}

/**
 * Hook to access and interact with a store.
 *
 * @template T - The type of the store.
 * @param {T} name - The name of the store to access.
 * @returns {Store<T>} A proxy object that allows interaction with the store.
 *
 * The returned proxy object provides the following functionalities:
 * - `subscribe(callback?)`: Subscribes to changes in the store value.
 * - `subject`: The current value of the store.
 * - `value`: Getter for the current value of the store.
 * - `publish(newValue)`: Updates the store with a new value.
 *
 * @example
 * const myStore = useStore('myStoreName');
 * myStore.subscribe((newValue) => {
 *   console.log('Store value changed:', newValue);
 * });
 * myStore.publish('newValue');
 */
export function useStore<T extends StoreType | `${StoreType}`>(name: T): Store<T> {
  const storeData = stores[name as StoreType]();
  const bindedSubscribeTo = subscribeTo.bind(this);

  const proxy = new Proxy(storeData, {
    get(store, valueName: string) {
      if (valueName === 'destroy') return store.destroy;

      return {
        subscribe(callback?) {
          bindedSubscribeTo(valueName, store[valueName], callback);
        },
        subject: store[valueName],
        get value() {
          return this.subject.value;
        },
        publish<T extends any>(newValue: T) {
          this.subject.value = newValue;
        },
      };
    },
  });

  return proxy as unknown as Store<T>;
}
