import { Presence3D, AutodeskPin } from '.';

declare global {
  interface Window {
    Presence3D: typeof Presence3D;
    AutodeskPin: typeof AutodeskPin;
  }
}
