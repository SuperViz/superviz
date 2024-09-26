import { createRoom } from './createRoom';

describe('createRoom', () => {
  test('should return realtime instance and room instance', () => {
    const { realtime, room } = createRoom('test-room');
    expect(realtime).toBeDefined();
    expect(room).toBeDefined();
  });
});
