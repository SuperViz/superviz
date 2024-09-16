import { MatterportPin, Presence3D } from '.';

declare global {
  interface Window {
    Presence3D: typeof Presence3D;
    MatterportPin: typeof MatterportPin;
  }
}
