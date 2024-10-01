import { PresenceEvent, SocketEvent } from '@superviz/socket-client';

import {
  MOCK_ROOM,
  mockRoomHistoryOnce,
  mockPresenceListOnce,
  MOCK_IO,
} from '../../../__mocks__/io.mock';

import { RoomEvent } from './types';

import { HostService } from '.';

function createHostService(callback?: () => void) {
  return new HostService(
    {
      createRoom() {
        return new MOCK_IO.Realtime('apiKey', 'dev', {}, 'secret', 'clientId').connect();
      },
    } as any,
    'participantId',
    callback ?? (() => {}),
  );
}

describe('HostService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    test('should create a new HostService instance', () => {
      const hostService = createHostService();
      expect(hostService).toBeInstanceOf(HostService);
    });

    test('should connect to host room', () => {
      const hostService = createHostService();
      expect(hostService['room']).toEqual(MOCK_ROOM);
    });

    test('should subscribe to room events', () => {
      const hostService = createHostService();
      expect(MOCK_ROOM.presence.on).toHaveBeenCalledTimes(2);
      expect(MOCK_ROOM.presence.on).toHaveBeenCalledWith(
        'presence.leave',
        hostService['onPresenceLeave'],
      );
      expect(MOCK_ROOM.presence.on).toHaveBeenCalledWith(
        'presence.joined-room',
        hostService['onPresenceEnter'],
      );
      expect(MOCK_ROOM.on).toHaveBeenCalledTimes(1);
      expect(MOCK_ROOM.on).toHaveBeenCalledWith('state', hostService['onStateChange']);
    });
  });

  describe('destroy', () => {
    test('should destroy the HostService instance', () => {
      const hostService = createHostService();
      hostService.destroy();

      expect(MOCK_ROOM.presence.off).toHaveBeenCalledTimes(2);
      expect(MOCK_ROOM.presence.off).toHaveBeenCalledWith('presence.leave');
      expect(MOCK_ROOM.presence.off).toHaveBeenCalledWith('presence.joined-room');
      expect(MOCK_ROOM.off).toHaveBeenCalledTimes(1);
      expect(MOCK_ROOM.off).toHaveBeenCalledWith('state', hostService['onStateChange']);
      expect(MOCK_ROOM.disconnect).toHaveBeenCalledTimes(1);
      expect(MOCK_ROOM.presence.off).toHaveBeenCalledTimes(2);
    });
  });

  describe('getters', () => {
    test('should return isHost', () => {
      const ids = ['id1', 'ids2', 'local-participant-id'];
      const participantId = 'local-participant-id';
      const hostId = ids[Math.floor(Math.random() * 2)];

      const hostService = createHostService();
      hostService['setHostId'](hostId);

      expect(hostService.isHost).toBe(hostId === participantId);
    });

    test('should return hostId', () => {
      const hostService = createHostService();
      const hostId = Math.floor(Math.random() * 100000);
      hostService['setHostId'](String(hostId));
      expect(hostService.hostId).toBe(String(hostId));
    });
  });

  describe('searchHost', () => {
    test('should update host if the room has no history', () => {
      const hostService = createHostService();

      hostService['updateHost'] = jest.fn();
      mockRoomHistoryOnce([]);

      hostService['searchHost']();

      expect(hostService['updateHost']).toHaveBeenCalledTimes(1);
    });

    test('should early return if there is already a host', () => {
      const hostService = createHostService();

      hostService['setHostId']('hostId');
      hostService['updateHost'] = jest.fn();
      mockRoomHistoryOnce([
        {
          data: {
            hostId: 'hostId',
          },
        },
      ]);

      hostService['searchHost']();

      expect(hostService['updateHost']).not.toHaveBeenCalled();
    });

    test("should set the participant as the host if it's alone in in the room", () => {
      const hostService = createHostService();
      hostService['setHostInRoom'] = jest.fn();

      mockRoomHistoryOnce([
        {
          data: {},
        },
      ]);
      mockPresenceListOnce([
        {
          id: 'participantId',
        },
      ]);

      hostService['searchHost']();

      expect(hostService['setHostInRoom']).toHaveBeenCalledTimes(1);
      expect(hostService['setHostInRoom']).toHaveBeenCalledWith('participantId');
    });

    test('should update host if there is no hostId in the room history', () => {
      const hostService = createHostService();

      hostService['updateHost'] = jest.fn();
      mockRoomHistoryOnce([
        {
          data: {},
        },
      ]);
      mockPresenceListOnce([
        {
          id: 'participantId',
        },
        {
          id: 'anotherParticipant',
        },
      ]);

      hostService['searchHost']();

      expect(hostService['updateHost']).toHaveBeenCalledTimes(1);
    });

    test('should update host if the hostId is not in the participants list', () => {
      const hostService = createHostService();

      hostService['updateHost'] = jest.fn();
      mockRoomHistoryOnce([
        {
          data: {
            hostId: 'hostId',
          },
        },
      ]);
      mockPresenceListOnce([
        {
          id: 'participantId',
        },
        {
          id: 'anotherParticipant',
        },
      ]);

      hostService['searchHost']();

      expect(hostService['updateHost']).toHaveBeenCalledTimes(1);
    });

    test('should set hostId found in the room history', () => {
      const hostService = createHostService();

      hostService['setHostId'] = jest.fn();
      mockRoomHistoryOnce([
        {
          data: {
            hostId: 'hostId',
          },
        },
      ]);
      mockPresenceListOnce([
        {
          id: 'hostId',
        },
      ]);

      hostService['searchHost']();

      expect(hostService['setHostId']).toHaveBeenCalledTimes(1);
      expect(hostService['setHostId']).toHaveBeenCalledWith('hostId');
    });
  });

  describe('setHostId', () => {
    test('should set the hostId and call the callback', () => {
      const callback = jest.fn();
      const hostService = createHostService(callback);

      hostService['setHostId']('hostId');

      expect(hostService.hostId).toBe('hostId');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateHost', () => {
    test('should set the oldest in the room with data coming from presence', () => {
      const hostService = createHostService();

      hostService['setOldestAsHost'] = jest.fn();
      const participants = [
        {
          id: 'participantId',
        },
        {
          id: 'anotherParticipant',
        },
      ];
      mockPresenceListOnce(participants);

      hostService['updateHost']();

      expect(hostService['setOldestAsHost']).toHaveBeenCalledTimes(1);
      expect(hostService['setOldestAsHost']).toHaveBeenCalledWith(participants);
    });

    test('should set the oldest in the room with data passed as argument', () => {
      const hostService = createHostService();

      hostService['setOldestAsHost'] = jest.fn();
      const participants = [
        {
          id: 'participantId',
        },
        {
          id: 'anotherParticipant',
        },
      ];

      hostService['updateHost'](participants as PresenceEvent[]);

      expect(hostService['setOldestAsHost']).toHaveBeenCalledTimes(1);
      expect(hostService['setOldestAsHost']).toHaveBeenCalledWith(participants);
    });
  });

  describe('setOldestAsHost', () => {
    test('should set local participant as host in the room if it is the oldest', () => {
      const hostService = createHostService();

      hostService['setHostInRoom'] = jest.fn();
      hostService['setOldestAsHost']([
        {
          id: 'participantId',
          timestamp: 1,
        },
        {
          id: 'secondParticipant',
          timestamp: 150,
        },
        {
          id: 'anotherParticipant',
          timestamp: 200,
        },
      ] as PresenceEvent[]);

      expect(hostService['setHostInRoom']).toHaveBeenCalledTimes(1);
      expect(hostService['setHostInRoom']).toHaveBeenCalledWith('participantId');
    });

    test('should set remote participant as host locally if it is the oldest', () => {
      const hostService = createHostService();

      hostService['setHostId'] = jest.fn();
      hostService['setOldestAsHost']([
        {
          id: 'secondParticipant',
          timestamp: 1,
        },
        {
          id: 'participantId',
          timestamp: 150,
        },
        {
          id: 'anotherParticipant',
          timestamp: 200,
        },
      ] as PresenceEvent[]);

      expect(hostService['setHostId']).toHaveBeenCalledTimes(1);
      expect(hostService['setHostId']).toHaveBeenCalledWith('secondParticipant');
    });

    describe('setHostInRoom', () => {
      test('should emit the hostId to the room', () => {
        const hostService = createHostService();

        hostService['setHostInRoom']('hostId');

        expect(MOCK_ROOM.emit).toHaveBeenCalledTimes(1);
        expect(MOCK_ROOM.emit).toHaveBeenCalledWith('state', {
          hostId: 'hostId',
        });
      });
    });
  });

  describe('room callbacks', () => {
    describe('onPresenceLeave', () => {
      test('should update host if the host leaves the room', () => {
        const hostService = createHostService();
        hostService['setHostId']('hostId');
        hostService['updateHost'] = jest.fn();

        hostService['onPresenceLeave']({
          id: 'hostId',
        } as PresenceEvent);

        expect(hostService.hostId).toBe('');
        expect(hostService['updateHost']).toHaveBeenCalledTimes(1);
      });

      test('should do nothing if the host does not leave the room', () => {
        const hostService = createHostService();
        hostService['setHostId']('hostId');
        hostService['updateHost'] = jest.fn();

        hostService['onPresenceLeave']({
          id: 'anotherParticipant',
        } as PresenceEvent);

        expect(hostService.hostId).toBe('hostId');
        expect(hostService['updateHost']).not.toHaveBeenCalled();
      });
    });

    describe('onStateChange', () => {
      test('should set host if the hostId changes', () => {
        const hostService = createHostService();
        hostService['setHostId'] = jest.fn();

        hostService['onStateChange']({
          data: {
            hostId: 'hostId',
          },
        } as SocketEvent<RoomEvent>);

        expect(hostService['setHostId']).toHaveBeenCalledTimes(1);
      });

      test('should do nothing if the hostId does not change', () => {
        const hostService = createHostService();
        hostService['setHostId']('hostId');
        hostService['setHostId'] = jest.fn();

        hostService['onStateChange']({
          data: {
            hostId: 'hostId',
          },
        } as SocketEvent<RoomEvent>);

        expect(hostService['setHostId']).not.toHaveBeenCalled();
      });
    });

    describe('onPresenceEnter', () => {
      test('should search for the host if the participant when local participant enters the room', () => {
        const hostService = createHostService();

        hostService['searchHost'] = jest.fn();
        hostService['onPresenceEnter']({
          id: 'participantId',
        } as PresenceEvent);

        expect(hostService['searchHost']).toHaveBeenCalledTimes(1);
      });

      test('should do nothing when host is already set', () => {
        const hostService = createHostService();
        hostService['setHostId']('hostId');

        hostService['searchHost'] = jest.fn();
        hostService['onPresenceEnter']({
          id: 'participantId',
        } as PresenceEvent);

        expect(hostService['searchHost']).not.toHaveBeenCalled();
      });

      test('should do nothing when others enter room', () => {
        const hostService = createHostService();

        hostService['searchHost'] = jest.fn();
        hostService['onPresenceEnter']({
          id: 'anotherParticipant',
        } as PresenceEvent);

        expect(hostService['searchHost']).not.toHaveBeenCalled();
      });
    });
  });
});
