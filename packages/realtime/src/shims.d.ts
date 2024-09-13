import { RealtimeCdn } from './types/cdn.types';

declare global {
  interface Window {
    Realtime: RealtimeCdn;
  }
}
