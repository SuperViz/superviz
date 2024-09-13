import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import config from '../config';

import { IOC } from '.';

describe('io', () => {
  let instance: IOC | null = null;

  beforeEach(() => {
    instance = new IOC(MOCK_LOCAL_PARTICIPANT);
  });

  afterEach(() => {
    instance?.destroy();
    instance = null;
  });

  test('should create an instance', () => {
    expect(instance).toBeInstanceOf(IOC);
  });

  test('should create a room', () => {
    const room = instance?.createRoom('test');

    expect(room).toBeDefined();
    expect(room).toHaveProperty('on');
    expect(room).toHaveProperty('off');
    expect(room).toHaveProperty('emit');
  });

  describe('handleConnectionState', () => {
    test('should handle unauthorized connection', () => {
      const spy = jest.spyOn(console, 'error');
      const subjectSpy = jest.spyOn(instance!['stateSubject'], 'next');
      instance!['handleConnectionState']({ reason: 'Unauthorized connection' } as any);

      expect(spy).toHaveBeenCalled();
      expect(instance!['state']).toEqual({
        state: 'DISCONNECTED',
        reason: 'Unauthorized connection',
      });
      expect(subjectSpy).toHaveBeenCalledWith('AUTH_ERROR');
    });

    test('should handle already in room error', () => {
      const subjectSpy = jest.spyOn(instance!['stateSubject'], 'next');
      instance!['handleConnectionState']({ reason: 'user-already-in-room' } as any);

      expect(instance!['state']).toEqual({ reason: 'user-already-in-room' });
      expect(subjectSpy).toHaveBeenCalledWith('SAME_ACCOUNT_ERROR');
    });

    test('should set and publish state', () => {
      const subjectSpy = jest.spyOn(instance!['stateSubject'], 'next');
      instance!['handleConnectionState']({ state: 'CONNECTED' } as any);

      expect(instance!['state']).toEqual({ state: 'CONNECTED' });
      expect(subjectSpy).toHaveBeenCalledWith('CONNECTED');
    });
  });

  describe('createClient', () => {
    test('should create a client', () => {
      config.set('environment', 'dev');
      const subscribeSpy = jest.spyOn(instance!, 'subscribeToDefaultEvents' as any);
      instance!.createClient();

      expect(instance!['client']).toBeDefined();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should default environment to dev', () => {
      config.set('environment', 'test');

      instance!.createClient();

      expect(instance!['client']).toBeDefined();
      expect(instance!['client']['environment']).toEqual('dev');
    });
  });
});
