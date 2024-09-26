import { Realtime, Room } from '@superviz/socket-client';

import { config } from '../../services/config';

/**
 * @function createRoom
 * @description Establishes a connection with a real-time room with the given name
 * @param roomName The last part of the name of the room. Comes after 'yjs:' in the room name
 * @returns {{ realtime: Realtime, room: Room }} An object containing the realtime
 * instance and the room instance
 */
export function createRoom(roomName: string): {
  realtime: Realtime;
  room: Room;
} {
  const realtime = new Realtime(
    config.get('apiKey'),
    config.get('environment'),
    config.get('participant'),
    '',
    '',
  );

  const room = realtime.connect(`yjs:${roomName}`);

  return {
    realtime,
    room,
  };
}
