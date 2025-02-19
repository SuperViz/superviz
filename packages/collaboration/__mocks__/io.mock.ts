import { jest } from '@jest/globals';
import { Room } from '@superviz/socket-client';

export const MOCK_IO = {
  ClientState: {
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    RECONNECTING: 'RECONNECTING',
    RECONNECT_ERROR: 'RECONNECT_ERROR',
  },
  PresenceEvents: {
    JOINED_ROOM: 'presence.joined-room',
    LEAVE: 'presence.leave',
    ERROR: 'presence.error',
    UPDATE: 'presence.update',
  },
  RoomEvents: {
    JOIN_ROOM: 'room.join',
    JOINED_ROOM: 'room.joined',
    LEAVE_ROOM: 'room.leave',
    UPDATE: 'room.update',
    ERROR: 'room.error',
  },
  Realtime: class {
    connection;

    constructor(apiKey, environment, participant) {
      this.connection = {
        on: jest.fn(),
        off: jest.fn(),
      };
    }

    connect() {
      return {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        history: jest.fn(),
        presence: {
          on: jest.fn(),
          off: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
        },
      } as unknown as Room;
    }

    destroy() {}
  },
};
