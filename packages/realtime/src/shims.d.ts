import type { Realtime } from './component';

declare global {
  interface Window {
    Realtime: typeof Realtime;
  }
}
