import { Room } from './core';

import { createRoom } from '.';

jest.mock('./services/api', () => ({
  ApiService: {
    validateApiKey: jest.fn(() => Promise.resolve(true)),
    fetchWaterMark: jest.fn(() => Promise.resolve({})),
    fetchLimits: jest.fn(() => Promise.resolve({})),
  },
}));

describe('createRoom', () => {
  test('creates a room with valid params', async () => {
    const params = {
      developerKey: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
    };

    const room = await createRoom(params);

    expect(room).toBeInstanceOf(Room);
  });

  test('throws an error if the room id is invalid', async () => {
    const params = {
      developerKey: 'abc123',
      roomId: 'abc$',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow(
      '[SuperViz | Room] Room id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('throws an error if the participant id is invalid', async () => {
    const params = {
      developerKey: 'abc123',
      roomId: 'abc123:',
      participant: {
        id: 'abc$',
        name: 'John Doe',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow(
      '[SuperViz | Room] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('throws an error if the developer key is missing', async () => {
    const params = {
      developerKey: '',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow('[SuperViz | Room] Developer Key is required');

    const params2 = {
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
    };

    // @ts-ignore
    const createRoomPromise2 = createRoom(params2);
    await expect(createRoomPromise2).rejects.toThrow('[SuperViz | Room] Developer Key is required');
  });
});
