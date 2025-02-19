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
