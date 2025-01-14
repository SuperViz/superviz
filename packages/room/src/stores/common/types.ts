import { useGlobalStore } from '../global';
import { usePresence3DStore } from '../presence-3D';

type Callback<T, K = undefined> = (a: T, b?: K) => void;

export type SimpleSubject<T> = {
  value: T;
  publish: Callback<T>;
  subscribe: Callback<string, Callback<T>>;
  unsubscribe: Callback<string>;
};

export type Singleton<T> = {
  set value(value: T);
  get value(): T;
};

export type PublicSubject<T> = {
  get value(): T;
  set value(T);
  subscribe: Callback<string | unknown, Callback<T>>;
  unsubscribe: Callback<string | unknown>;
};

export enum StoreType {
  GLOBAL = 'global-store',
  PRESENCE_3D = 'presence-3d-store',
  WHO_IS_ONLINE = 'who-is-online-store',
}

type Subject<T extends (...args: any[]) => any, K extends keyof ReturnType<T>> = ReturnType<T>[K];

type IncompleteStoreApi<T extends (...args: any[]) => any> = {
  [K in keyof ReturnType<T>]: {
    subscribe(callback?: (value: Subject<T, K>['value']) => void): void;
    subject: Subject<T, K>;
    publish(value: Subject<T, K>['value']): void;
    value: Subject<T, K>['value'];
  };
};

type StoreApi<T extends (...args: any[]) => any> = IncompleteStoreApi<T> & {
  destroy(): void;
};

type GlobalStore = StoreType.GLOBAL | `${StoreType.GLOBAL}`;
type Presence3DStore = StoreType.PRESENCE_3D | 'presence-3d-store';

export type Store<T> = T extends GlobalStore
  ? StoreApi<typeof useGlobalStore>
  : T extends Presence3DStore
  ? StoreApi<typeof usePresence3DStore>
  : never;
export type StoresTypes = typeof StoreType;
