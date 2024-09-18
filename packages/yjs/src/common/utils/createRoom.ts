import { Realtime, Room } from '@superviz/socket-client';
import { config } from '../../services/config';

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
