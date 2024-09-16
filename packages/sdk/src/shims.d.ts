import { SuperVizCdn } from './common/types/cdn.types';
import { Launcher } from './core/launcher';

declare global {
  interface Window {
    SuperVizRoom: SuperVizCdn;
    SUPERVIZ: Launcher;
  }
}
