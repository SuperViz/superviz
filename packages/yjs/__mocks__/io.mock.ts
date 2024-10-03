import { jest } from '@jest/globals';
// has to be imported to avoid type errors
import { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';
import type { ModuleMocker } from 'jest-mock';

export class MockRealtime {
  public connection;
  private socket;
  private manager;
  private state;

  constructor(
    private apiKey,
    private environment,
    private presence,
    private secret,
    private clientId,
  ) {
    this.connection = {
      on: jest.fn(),
      off: jest.fn(),
    };
  }

  private subscriptions: { event: string; callback: (data: any) => void }[] = [];
  private presenceSubscriptions: { event: PresenceEvents; callback: (data: any) => void }[] = [];

  connect() {
    return {
      // @ts-ignore
      on: MOCK_ROOM['on'].mockImplementation((event: string, callback: () => void) =>
        this.subscriptions.push({ event, callback }),
      ),
      off: MOCK_ROOM['off'].mockImplementation((event, callback) => {
        this.subscriptions = this.subscriptions.filter(
          (subscription) => subscription.event !== event || subscription.callback !== callback,
        );
      }),
      emit: MOCK_ROOM['emit'].mockImplementation((event, data) =>
        this.subscriptions.forEach((subscription) => {
          if (subscription.event === event) subscription.callback({ data });
        }),
      ),
      disconnect: MOCK_ROOM['disconnect'].mockImplementation(() => {
        this.subscriptions = [];
        this.presenceSubscriptions = [];
      }),
      history: MOCK_ROOM['history'].mockImplementation(() => {}),
      presence: {
        on: MOCK_ROOM['presence']['on'].mockImplementation(
          // @ts-ignore
          (event: PresenceEvents, callback: () => void) => {
            this.presenceSubscriptions.push({ event, callback });
          },
        ),
        off: MOCK_ROOM['presence']['off'].mockImplementation((event, callback) => {
          this.presenceSubscriptions = this.presenceSubscriptions.filter(
            (subscription) => subscription.event !== event || subscription.callback !== callback,
          );
        }),
        get: MOCK_ROOM['presence']['get'].mockImplementation(() => {}),
        update: MOCK_ROOM['presence']['update'].mockImplementation(() => {}),
        emit: MOCK_ROOM['presence']['emit'].mockImplementation((event, data) => {
          this.presenceSubscriptions.forEach((subscription) => {
            if (subscription.event === event)
              subscription.callback({ id: 'local-participant-id', data });
          });
        }),
      },
    } as unknown as Room;
  }

  public destroy = jest.fn();
}

export const MOCK_ROOM = {
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
    emit: jest.fn(),
  },
};

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
  Realtime: MockRealtime,
};

export const mockRoomHistoryOnce = <T = unknown>(history: Partial<SocketEvent<T>>[]) => {
  // @ts-ignore
  MOCK_ROOM.history.mockImplementationOnce((callback: <T>(data: RoomHistory<T>) => void) => {
    callback({
      connectionId: 'connectionId',
      events: history as SocketEvent<T>[],
      room: {
        name: 'roomName',
        apiKey: 'apiKey',
        createdAt: new Date(),
        userId: 'userId',
      },
      roomId: 'roomId',
      timestamp: new Date(),
    });
  });
};

export const mockPresenceListOnce = (participants: Partial<PresenceEvent>[]) => {
  MOCK_ROOM.presence.get.mockImplementationOnce(
    // @ts-ignore
    (callback: (data: Partial<PresenceEvent>[]) => void) => {
      callback(participants);
    },
  );
};
