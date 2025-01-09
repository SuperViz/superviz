import { Room } from './core';

declare global {
  interface Window {
    SuperVizRoom: Record<string, unknown>;
    SUPERVIZ_ROOM: Room;
  }
}
