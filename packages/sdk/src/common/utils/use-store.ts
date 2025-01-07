import { PublicSubject } from '../../services/stores/common/types';
import { useGlobalStore } from '../../services/stores/global';
import { usePresence3DStore } from '../../services/stores/presence3D';
import { useVideoStore } from '../../services/stores/video';
import { useWhoIsOnlineStore } from '../../services/stores/who-is-online';
import { Store, StoreType } from '../types/stores.types';

const stores = {
  [StoreType.GLOBAL]: useGlobalStore,
  [StoreType.WHO_IS_ONLINE]: useWhoIsOnlineStore,
  [StoreType.VIDEO]: useVideoStore,
  [StoreType.PRESENCE_3D]: usePresence3DStore,
};

/**
 * @function subscribe
 * @description Subscribes to a subject and either update the value of the property each time there is a change, or call the callback that provides a custom behavior to the subscription
 * @param name The name of the property to be updated in case there isn't a callback
 * @param subject The subject to be subscribed
 * @param callback The callback to be called each time there is a change
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
 * @function useGlobalStore
 * @description Returns a proxy of the global store data and a subscribe function to be used in the components
 */
export function useStore<T extends StoreType>(name: T): Store<T> {
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
        publish(newValue) {
          this.subject.value = newValue;
        },
      };
    },
  });

  return proxy;
}
