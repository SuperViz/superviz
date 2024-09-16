import { Presence3D } from './services/adapter';
import { MatterportPin } from './services/comments-adapter';

if (typeof window !== 'undefined') {
  window.Presence3D = Presence3D;
  window.MatterportPin = MatterportPin;
}

export { Presence3D, MatterportPin };
