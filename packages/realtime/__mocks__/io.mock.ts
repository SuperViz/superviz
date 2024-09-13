import { jest } from '@jest/globals';
import { PresenceEvents, Room } from '@superviz/socket-client';

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

    constructor(private apiKey, private environment, private participant) {
      this.connection = {
        on: jest.fn(),
        off: jest.fn(),
      };
    }

    private subscriptions: { event: string; callback: (data: any) => void }[] = [];
    private presenceSubscriptions: { event: PresenceEvents; callback: (data: any) => void }[] = [];

    connect() {
      return {
        on: jest.fn((event: string, callback: () => void) =>
          this.subscriptions.push({ event, callback }),
        ),
        off: jest.fn((event, callback) => {
          this.subscriptions = this.subscriptions.filter(
            (subscription) => subscription.event !== event || subscription.callback !== callback,
          );
        }),
        emit: jest.fn((event, data) =>
          this.subscriptions.forEach((subscription) => {
            if (subscription.event === event) subscription.callback({ data });
          }),
        ),
        disconnect: jest.fn(() => {
          this.subscriptions = [];
          this.presenceSubscriptions = [];
        }),
        history: jest.fn(),
        presence: {
          on: jest.fn((event: PresenceEvents, callback: () => void) => {
            this.presenceSubscriptions.push({ event, callback });
          }),
          off: jest.fn((event, callback) => {
            this.presenceSubscriptions = this.presenceSubscriptions.filter(
              (subscription) => subscription.event !== event || subscription.callback !== callback,
            );
          }),
          get: jest.fn(),
          update: jest.fn(),
          emit: jest.fn((event, data) => {
            this.presenceSubscriptions.forEach((subscription) => {
              if (subscription.event === event) subscription.callback({ data });
            });
          }),
        },
      } as unknown as Room;
    }

    destroy() {}
  },
};
