import { SuperVizCdn } from './common/types/cdn.types';

declare global {
  interface Window {
    SuperVizCollaboration: SuperVizCdn;

    SuperViz: any
    SUPERVIZ_ROOM: any
  }
}
