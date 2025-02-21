import { Singleton } from './types';

export function CreateSingleton<T>(): Singleton<T> {
  return {
    set value(value: T) {
      this.instance = value;
      setTimeout(() => Object.freeze(this));
    },
    get value() {
      return this.instance;
    },
  };
}
