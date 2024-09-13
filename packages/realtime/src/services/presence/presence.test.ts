import { PresenceEvent, PresenceEvents, Room } from '@superviz/socket-client';

import { MOCK_IO } from '../../../__mocks__/io.mock';

import { RealtimePresence } from './presence';

describe('realtime component', () => {
  let RealtimePresenceInstance: RealtimePresence;

  beforeEach(() => {
    jest.clearAllMocks();

    const room = new MOCK_IO.Realtime('', '', '');
    RealtimePresenceInstance = new RealtimePresence(room.connect() as unknown as Room);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Realtime Participant Presence', () => {
    test('should update presence', () => {
      const spy = jest.spyOn(RealtimePresenceInstance['room'].presence as any, 'update' as any);
      const data = {
        id: '123',
        name: 'John Doe',
      };

      RealtimePresenceInstance['update'](data);

      expect(spy).toHaveBeenCalledWith(data);
    });

    test('should subscribe to presence events', () => {
      const spy = jest.spyOn(RealtimePresenceInstance['room'].presence as any, 'on' as any);
      const event = MOCK_IO.PresenceEvents.UPDATE;
      const callback = jest.fn();

      RealtimePresenceInstance['subscribe'](event as PresenceEvents, callback);

      expect(spy).toHaveBeenCalledWith(event, callback);
    });

    test('should unsubscribe from presence events', () => {
      const spy = jest.spyOn(RealtimePresenceInstance['room'].presence as any, 'off' as any);
      const event = MOCK_IO.PresenceEvents.UPDATE;

      RealtimePresenceInstance['unsubscribe'](event as PresenceEvents);

      expect(spy).toHaveBeenCalledWith(event);
    });

    test('should get all presences', () => {
      const spy = jest.spyOn(RealtimePresenceInstance['room'].presence as any, 'get' as any);
      RealtimePresenceInstance['getAll']();

      expect(spy).toHaveBeenCalled();
    });

    test('should get all presences and resolve', async () => {
      RealtimePresenceInstance['room'].presence.get = jest.fn((callback) => {
        callback([{ id: '123', name: 'John Doe' }] as PresenceEvent[]);
      });
      const presences = RealtimePresenceInstance['getAll']();

      expect(presences instanceof Promise).toBe(true);

      const data = await presences;

      expect(data).toEqual([{ id: '123', name: 'John Doe' }]);
    });

    test('should get throw error if fail on getting presences', async () => {
      RealtimePresenceInstance['room'].presence.get = jest.fn((callback, errorCallback) => {
        errorCallback!(new Error('Failed to get presences'));
      });

      const presences = RealtimePresenceInstance['getAll']();

      expect(presences instanceof Promise).toBe(true);

      try {
        await presences;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
