import { Store, StoreType } from '../../common/types/stores.types';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface WebComponentsBaseInterface {
  emitEvent(name: string, detail: object, configs?: object): unknown;
  useStore<T extends StoreType>(name: T): Store<T>;
}
