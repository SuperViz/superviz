export type DefaultComponentProps<T> = {
  onMount?: () => void;
  onUnmount?: () => void;
} & T;
