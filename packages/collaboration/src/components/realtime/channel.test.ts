import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';
import { MOCK_OBSERVER_HELPER } from '../../../__mocks__/observer-helper.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { IOC } from '../../services/io';

import { Channel } from './channel';
import { RealtimeChannelState } from './types';

jest.mock('lodash/throttle', () => jest.fn((fn) => fn));
jest.useFakeTimers();

describe('Realtime Channel', () => {
  let ChannelInstance: Channel;

  beforeEach(() => {
    jest.clearAllMocks();

    console.error = jest.fn();
    console.warn = jest.fn();
    console.debug = jest.fn();

    ChannelInstance = new Channel(
      'channel',
      new IOC(MOCK_LOCAL_PARTICIPANT),
      MOCK_LOCAL_PARTICIPANT,
      LIMITS_MOCK.realtime.maxParticipants,
    );

    ChannelInstance['state'] = RealtimeChannelState.CONNECTED;
  });

  describe('publish', () => {
    test('should log an error when trying to publish an event before start', () => {
      ChannelInstance['state'] = RealtimeChannelState.DISCONNECTED;

      const spy = jest.spyOn(ChannelInstance['logger'], 'log' as any);
      ChannelInstance.publish('test', {});

      expect(spy).toHaveBeenCalled();
    });

    test('should publish an event', () => {
      const spy = jest.spyOn(ChannelInstance['channel'], 'emit' as any);
      ChannelInstance.publish('test', {});

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    test('should subscribe to an event', () => {
      ChannelInstance['observers']['test'] = MOCK_OBSERVER_HELPER;
      const spy = jest.spyOn(ChannelInstance['observers']['test'], 'subscribe' as any);
      ChannelInstance.subscribe('test', () => {});

      expect(spy).toHaveBeenCalled();
    });

    test('should subscribe to an event when joined', () => {
      ChannelInstance['state'] = RealtimeChannelState.DISCONNECTED;
      ChannelInstance.subscribe('test', () => {});

      expect(ChannelInstance['callbacksToSubscribeWhenJoined']).toHaveLength(1);
    });
  });

  describe('unsubscribe', () => {
    test('should unsubscribe from an event', () => {
      ChannelInstance['observers']['test'] = MOCK_OBSERVER_HELPER;
      const spy = jest.spyOn(ChannelInstance['observers']['test'], 'unsubscribe' as any);
      ChannelInstance.unsubscribe('test', () => {});

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('subscribeToRealtimeEvents', () => {
    test('should subscribe to all realtime events', () => {
      const spy = jest.spyOn(ChannelInstance['channel'], 'on' as any);
      ChannelInstance['subscribeToRealtimeEvents']();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('fetchHistory', () => {
    test('should return null when the realtime is not started', async () => {
      ChannelInstance['state'] = RealtimeChannelState.DISCONNECTED;
      const h = await ChannelInstance.fetchHistory();

      expect(h).toEqual(null);
    });

    test('should return null when the history is empty', async () => {
      const spy = jest
        .spyOn(ChannelInstance['channel'], 'history' as any)
        .mockImplementationOnce((...args: unknown[]) => {
          const next = args[0] as (data: any) => void;
          next({ events: [] });
        });

      const h = await ChannelInstance.fetchHistory();

      expect(spy).toHaveBeenCalled();
      expect(h).toEqual(null);
    });

    test('should return the history', async () => {
      const spy = jest
        .spyOn(ChannelInstance['channel'], 'history' as any)
        .mockImplementationOnce((...args: unknown[]) => {
          const next = args[0] as (data: any) => void;
          next({
            events: [
              {
                timestamp: 1710336284652,
                presence: { id: 'unit-test-presence-id', name: 'unit-test-presence-name' },
                data: { name: 'unit-test-event-name', payload: 'unit-test-event-payload' },
              },
            ],
          });
        });

      const h = await ChannelInstance.fetchHistory();

      expect(spy).toHaveBeenCalled();
      expect(h).toEqual({
        'unit-test-event-name': [
          {
            data: 'unit-test-event-payload',
            name: 'unit-test-event-name',
            participantId: 'unit-test-presence-id',
            timestamp: 1710336284652,
          },
        ],
      });
    });

    test('should return the history for a specific event', async () => {
      const spy = jest
        .spyOn(ChannelInstance['channel'], 'history' as any)
        .mockImplementationOnce((...args: unknown[]) => {
          const next = args[0] as (data: any) => void;
          next({
            events: [
              {
                timestamp: 1710336284652,
                presence: { id: 'unit-test-presence-id', name: 'unit-test-presence-name' },
                data: { name: 'unit-test-event-name', payload: 'unit-test-event-payload' },
              },
            ],
          });
        });

      const h = await ChannelInstance.fetchHistory('unit-test-event-name');

      expect(spy).toHaveBeenCalled();
      expect(h).toEqual([
        {
          data: 'unit-test-event-payload',
          name: 'unit-test-event-name',
          participantId: 'unit-test-presence-id',
          timestamp: 1710336284652,
        },
      ]);
    });

    test('should reject when the event is not found', async () => {
      const spy = jest
        .spyOn(ChannelInstance['channel'], 'history' as any)
        .mockImplementationOnce((...args: unknown[]) => {
          const next = args[0] as (data: any) => void;
          next({
            events: [
              {
                timestamp: 1710336284652,
                presence: { id: 'unit-test-presence-id', name: 'unit-test-presence-name' },
                data: { name: 'unit-test-event-name', payload: 'unit-test-event-payload' },
              },
            ],
          });
        });

      const h = ChannelInstance.fetchHistory('unit-test-event-wrong-name');

      await expect(h).rejects.toThrow('Event unit-test-event-wrong-name not found in the history');
    });
  });

  describe('disconnect', () => {
    test('should disconnect from the channel', () => {
      const spy = jest.spyOn(ChannelInstance['channel'], 'disconnect' as any);

      expect(ChannelInstance['state']).toEqual(RealtimeChannelState.CONNECTED);

      ChannelInstance.disconnect();

      expect(spy).toHaveBeenCalled();
      expect(ChannelInstance['state']).toEqual(RealtimeChannelState.DISCONNECTED);
    });

    test('should not disconnect from the channel when already disconnected', () => {
      const spy = jest.spyOn(ChannelInstance['channel'], 'disconnect' as any);
      ChannelInstance['state'] = RealtimeChannelState.DISCONNECTED;

      ChannelInstance.disconnect();

      expect(spy).not.toHaveBeenCalled();
    });

    test('Should log an error if a disconnect attempt is made when the channel is already disconnected', () => {
      const spy = jest.spyOn(ChannelInstance['logger'], 'log' as any);
      ChannelInstance['state'] = RealtimeChannelState.DISCONNECTED;

      ChannelInstance.disconnect();

      expect(spy).toHaveBeenCalled();
    });
  });
});
