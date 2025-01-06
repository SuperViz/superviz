import { Room } from './core';

declare global {
  interface Window {
    SuperVizRoom: {};
    SUPERVIZ_ROOM: Room;
  }
}
