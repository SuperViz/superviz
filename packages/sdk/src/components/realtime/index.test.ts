import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { useStore } from '../../common/utils/use-store';
import { IOC } from '../../services/io';
import { Presence3DManager } from '../../services/presence-3d-manager';

import { RealtimeComponentState } from './types';

import { Realtime } from '.';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';
import { StoreType } from '../../common/types/stores.types';

jest.mock('lodash/throttle', () => jest.fn((fn) => fn));
jest.useFakeTimers();

describe('realtime component', () => {
  let RealtimeComponentInstance: Realtime;

  beforeEach(() => {
    jest.clearAllMocks();

    console.error = jest.fn();
    console.debug = jest.fn();

    const { hasJoinedRoom } = useStore(StoreType.GLOBAL);
    hasJoinedRoom.publish(true);

    RealtimeComponentInstance = new Realtime();
    RealtimeComponentInstance.attach({
      ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
      config: MOCK_CONFIG,
      eventBus: EVENT_BUS_MOCK,
      Presence3DManagerService: Presence3DManager,
      connectionLimit: LIMITS_MOCK.realtime.maxParticipants,
      useStore,
    });

    RealtimeComponentInstance['state'] = RealtimeComponentState.STARTED;
  });

  afterEach(() => {
    jest.clearAllMocks();
    RealtimeComponentInstance.detach();
  });

  test('should create a new instance of Realtime', () => {
    expect(RealtimeComponentInstance).toBeInstanceOf(Realtime);
  });

  describe('start', () => {
    test('should log started', () => {
      const spy = jest.spyOn(RealtimeComponentInstance['logger'], 'log');
      RealtimeComponentInstance['start']();

      expect(spy).toHaveBeenCalledWith('started');
      expect(RealtimeComponentInstance['state']).toBe(RealtimeComponentState.STARTED);
    });
  });

  describe('connect', () => {
    test('should return a promise when trying to create a channel before start', () => {
      RealtimeComponentInstance['start']();
      RealtimeComponentInstance['state'] = RealtimeComponentState.STOPPED;

      const channel = RealtimeComponentInstance.connect('test');

      expect(channel instanceof Promise).toBe(true);
    });

    test('should create a new channel', () => {
      const channel = RealtimeComponentInstance.connect('test');

      expect(channel).toBeDefined();
      expect(RealtimeComponentInstance['channels'].size).toBe(1);
      expect(RealtimeComponentInstance['channels'].get('test')).toBe(channel);
    });
  });

  describe('destroy', () => {
    test('should disconnect from the channels', () => {
      const channel = RealtimeComponentInstance.connect('test');

      const spy = jest.spyOn(RealtimeComponentInstance, 'disconnectFromAllChannels' as any);
      const spy2 = jest.spyOn(channel, 'disconnect' as any);
      RealtimeComponentInstance['destroy']();

      expect(spy).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    test('should change state to stopped', () => {
      RealtimeComponentInstance['destroy']();

      expect(RealtimeComponentInstance['state']).toBe('STOPPED');
    });
  });
});
