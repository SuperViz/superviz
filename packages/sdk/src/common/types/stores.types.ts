import { useGlobalStore } from '../../services/stores';
import { useCoreStore } from '../../services/stores/core';
import { usePresence3DStore } from '../../services/stores/presence3D';
import { useVideoStore } from '../../services/stores/video';
import { useWhoIsOnlineStore } from '../../services/stores/who-is-online/index';

export enum StoreType {
  GLOBAL = 'global-store',
  COMMENTS = 'comments-store',
  WHO_IS_ONLINE = 'who-is-online-store',
  VIDEO = 'video-store',
  PRESENCE_3D = 'presence-3d-store',
  CORE = 'core-store',
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
type WhoIsOnlineStore = StoreType.WHO_IS_ONLINE | 'who-is-online-store';
type VideoStore = StoreType.VIDEO | 'video-store';
type Presence3DStore = StoreType.PRESENCE_3D | 'presence-3d-store';
type CoreStore = StoreType.CORE | 'core-store';

export type Store<T> = T extends GlobalStore
  ? StoreApi<typeof useGlobalStore>
  : T extends WhoIsOnlineStore
  ? StoreApi<typeof useWhoIsOnlineStore>
  : T extends VideoStore
  ? StoreApi<typeof useVideoStore>
  : T extends Presence3DStore
  ? StoreApi<typeof usePresence3DStore>
  : T extends CoreStore
  ? StoreApi<typeof useCoreStore>
  : never;
export type StoresTypes = typeof StoreType;
