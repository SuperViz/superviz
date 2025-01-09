import { Room } from './core';
import { ApiService } from './services/api';
import config from './services/config';

import { createRoom } from '.';

jest.mock('./services/api', () => ({
  ApiService: {
    validateApiKey: jest.fn(() => Promise.resolve(true)),
    fetchWaterMark: jest.fn(() => Promise.resolve({})),
    fetchLimits: jest.fn(() => Promise.resolve({})),
    createParticipant: jest.fn(() => Promise.resolve()),
    fetchParticipant: jest.fn(() => Promise.resolve(null)),
    getFeatures: jest.fn(() => Promise.resolve({
      realtime: true,
      presence: true,
      videoConference: true,
      comments: true,
      whoIsOnline: true,
      presence3dMatterport: true,
      presence3dAutodesk: true,
      presence3dThreejs: true,
      formElements: true,
      transcriptLangs: ['en-US'],
    })),
  },
}));

let room: Room | null = null;

afterEach(() => {
  if (room) {
    room.leave();
    room = null;
  }
});

describe('createRoom', () => {
  test('creates a room with valid params', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
    };

    room = await createRoom(params);

    expect(room).toBeInstanceOf(Room);
  });

  test('throws an error if the room id is invalid', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc$',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow(
      '[SuperViz | Room] Room id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('throws an error if the participant id is invalid', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123:',
      participant: {
        id: 'abc$',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow(
      '[SuperViz | Room] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('throws an error if the group id is invalid', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc$',
        name: 'Group',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow(
      '[SuperViz | Room] Group id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('throws an error if the developer key is missing', async () => {
    const params = {
      developerToken: '',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
    };

    const createRoomPromise = createRoom(params);
    await expect(createRoomPromise).rejects.toThrow('[SuperViz | Room] Developer Token is required');

    const params2 = {
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
    };

    // @ts-ignore
    const createRoomPromise2 = createRoom(params2);
    await expect(createRoomPromise2).rejects.toThrow('[SuperViz | Room] Developer Token is required');
  });

  test('sets up the environment correctly', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
    };

    room = await createRoom(params);

    expect(config.get('apiKey')).toBe('abc123');
    expect(config.get('roomId')).toBe('abc123');
    expect(config.get('environment')).toBe('prod');
    expect(config.get('debug')).toBe(false);

    const paramsWithOptionalFields = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      debug: true,
      environment: 'dev' as 'dev',
    };

    room = await createRoom(paramsWithOptionalFields);

    expect(config.get('apiKey')).toBe('abc123');
    expect(config.get('roomId')).toBe('abc123');
    expect(config.get('environment')).toBe('dev');
    expect(config.get('debug')).toBe(true);
  });

  test('set up the environment with the correct API URL', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
    };

    room = await createRoom(params);

    expect(config.get('apiUrl')).toBe('https://api.superviz.com');

    const paramsWithDevEnvironment = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      environment: 'dev' as 'dev',
    };

    room = await createRoom(paramsWithDevEnvironment);

    expect(config.get('apiUrl')).toBe('https://dev.nodeapi.superviz.com');
  });

  test('warn if a room already exists in the window object', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      environment: 'dev' as 'dev',
    };

    room = await createRoom(params);
    const roomPromise = createRoom(params);

    await expect(roomPromise).resolves.toBe(room);
  });

  test('should return a new room instance if leave and initialize again', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      environment: 'dev' as 'dev',
    };

    room = await createRoom(params);
    room.leave();

    const newRoom = await createRoom(params);

    expect(newRoom).not.toBe(room);
  });

  test('should throw an error if the participant name is missing and the participant does not exist in the API', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      environment: 'dev' as 'dev',
    };

    const createRoomPromise = createRoom(params);

    await expect(createRoomPromise).rejects.toThrow(
      '[SuperViz | Room] - Participant does not exist, create the user in the API or add the name in the initialization to initialize the SuperViz room.',
    );
  });

  test('should ignore the participant name if the participant exists in the API', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      environment: 'dev' as 'dev',
    };

    jest.spyOn(ApiService, 'fetchParticipant').mockResolvedValueOnce({
      id: 'abc123',
      name: 'John Doe',
      email: 'john@superviz.com',
    });

    room = await createRoom(params);

    expect(room).toBeInstanceOf(Room);
  });

  test('should create the participant if the participant does not exist in the API', async () => {
    const params = {
      developerToken: 'abc123',
      roomId: 'abc123',
      participant: {
        id: 'abc123',
        name: 'John Doe',
      },
      group: {
        id: 'abc123',
        name: 'Group',
      },
      environment: 'dev' as 'dev',
    };

    jest.spyOn(ApiService, 'fetchParticipant').mockResolvedValueOnce(null);

    room = await createRoom(params);

    expect(ApiService.createParticipant).toHaveBeenCalledWith({
      participantId: 'abc123',
      name: 'John Doe',
      email: undefined,
    });
  });
});
