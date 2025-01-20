import { Room } from './core';

declare global {
  interface Window {
    SuperViz: Record<string, unknown>;
    SUPERVIZ_ROOM: Room;
  }
}
