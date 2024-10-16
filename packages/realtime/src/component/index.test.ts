import { MOCK_PARAMS } from '../../__mocks__/params.mock';
import { ApiService } from '../services/api';
import { isValidApiKey } from '../services/auth-service';
import config from '../services/config';
import { RemoteConfigService } from '../services/remote-config';
import { EnvironmentTypes } from '../types/options.types';
import * as environment from '../utils/environment';

import { RealtimeComponentState } from './types';

import { Realtime } from '.';

jest.mock('../utils/generate-hash', () => {
  return {
    generateHash: jest.fn().mockReturnValue('test-hash'),
  };
});

jest.mock('../services/config', () => ({
  get: jest.fn().mockImplementation((key) => {
    if (key === 'apiUrl') return 'https://test.nodeapi.com';
    if (key === 'apiKey') return 'unit-test-api-key';
    return '';
  }),
  set: jest.fn(),
}));

const secretAuth = {
  clientId: 'unit-test-client-id',
  secret: 'unit-test-secret',
};

jest.mock('../services/api', () => ({
  ApiService: {
    fetchLimits: jest.fn().mockReturnValue({
      realtime: {
        canUse: true,
        maxParticipants: 'unlimited',
      },
    }),
    fetchApiKey: jest.fn().mockReturnValue('unit-test-api-key'),
    sendActivity: jest.fn(),
  },
}));

jest.mock('../services/auth-service', () => ({
  isValidApiKey: jest.fn().mockReturnValue(true),
}));

jest.mock('../services/remote-config', () => ({
  RemoteConfigService: {
    getRemoteConfig: jest.fn().mockReturnValue({ apiUrl: 'https://test.nodeapi.com' }),
  },
}));

jest.useFakeTimers();

describe('realtime component', () => {
  let RealtimeComponentInstance: Realtime;

  beforeEach(() => {
    jest.clearAllMocks();

    console.error = jest.fn();
    console.debug = jest.fn();

    RealtimeComponentInstance = new Realtime(secretAuth, MOCK_PARAMS);
  });

  afterEach(() => {
    jest.clearAllMocks();

    if (RealtimeComponentInstance['state'] === RealtimeComponentState.STOPPED) return;
    RealtimeComponentInstance.destroy();
  });

  describe('constructor', () => {
    test('should create a new instance of Realtime', () => {
      RealtimeComponentInstance['state'] = RealtimeComponentState.STOPPED;
      expect(RealtimeComponentInstance).toBeInstanceOf(Realtime);
    });

    test('should disable debug when debug is false', () => {
      RealtimeComponentInstance = new Realtime(secretAuth, {
        ...MOCK_PARAMS,
        debug: false,
      });

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('setApiUrl', () => {
    test('should set the api url', async () => {
      await RealtimeComponentInstance['setApiUrl']();

      expect(RemoteConfigService.getRemoteConfig).toHaveBeenCalled();
      expect(config.set).toHaveBeenCalledWith('apiUrl', 'https://test.nodeapi.com');
    });
  });

  describe('validateLimits', () => {
    test('should validate the limits', async () => {
      await RealtimeComponentInstance['validateLimits']();

      expect(config.get).toHaveBeenCalledWith('apiUrl');
      expect(config.get).toHaveBeenCalledWith('apiKey');
      expect(config.set).toHaveBeenCalledWith('apiUrl', 'https://test.nodeapi.com');
    });

    test('should throw an error when the limits are reached', async () => {
      (ApiService.fetchLimits as any).mockReturnValueOnce({
        realtime: {
          canUse: false,
          maxParticipants: 1,
        },
      });

      expect(RealtimeComponentInstance['validateLimits']).rejects.toThrow();
    });
  });

  describe('validateApiKey', () => {
    test('should validate the api key', async () => {
      await RealtimeComponentInstance['validateApiKey']();

      expect(isValidApiKey).toHaveBeenCalled();
    });

    test('should throw an error when the api key is invalid', async () => {
      (isValidApiKey as any).mockReturnValueOnce(false);

      expect(RealtimeComponentInstance['validateApiKey']).rejects.toThrow();
    });

    test('should throw an error if there is no api key', async () => {
      (config.get as any).mockReturnValueOnce('');

      expect(RealtimeComponentInstance['validateApiKey']).rejects.toThrow();
    });
  });

  describe('start', () => {
    test('should log started', () => {
      const spy = jest.spyOn(RealtimeComponentInstance['logger'], 'log');

      RealtimeComponentInstance['start']();

      expect(spy).toHaveBeenNthCalledWith(1, '[SuperViz - Real-Time Data Engine] - Starting');

      expect(RealtimeComponentInstance['state']).toBe(RealtimeComponentState.STARTED);
    });
  });

  describe('validateSecretAndClientId', () => {
    test('should set the api key fetched', async () => {
      await RealtimeComponentInstance['validateSecretAndClientId']();

      expect(ApiService.fetchApiKey).toHaveBeenCalled();
      expect(config.set).toHaveBeenCalledWith('apiKey', 'unit-test-api-key');
    });

    test('should throw an error when the api key is invalid', async () => {
      (ApiService.fetchApiKey as any).mockReturnValueOnce('');

      expect(RealtimeComponentInstance['validateSecretAndClientId']).rejects.toThrow();
    });
  });

  describe('connect', () => {
    test('should return a promise when trying to create a channel before start', () => {
      RealtimeComponentInstance['changeState'](RealtimeComponentState.STOPPED);

      const channel = RealtimeComponentInstance.connect('test');

      expect(channel instanceof Promise).toBe(true);
    });

    test('should create a new channel', async () => {
      expect(RealtimeComponentInstance['channels'].size).toBe(0);

      const channel = await RealtimeComponentInstance.connect('test');

      expect(channel).toBeDefined();
      expect(RealtimeComponentInstance['channels'].size).toBe(1);
      expect(RealtimeComponentInstance['channels'].get('test')).toBe(channel);
    });

    test('should resolve channel when join', async () => {
      RealtimeComponentInstance['changeState'](RealtimeComponentState.STOPPED);
      const channel = RealtimeComponentInstance.connect('test');

      await RealtimeComponentInstance['start']();

      const resolvedChannel = await channel;

      expect(resolvedChannel).toBeDefined();
    });

    test('should return already connected channel', async () => {
      const channel = await RealtimeComponentInstance.connect('test');
      const channel2 = await RealtimeComponentInstance.connect('test');

      expect(channel2).toBe(channel);
    });
  });

  describe('destroy', () => {
    test('should disconnect from the channels', async () => {
      const channel = await RealtimeComponentInstance.connect('test');

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

  describe('validateParams', () => {
    test('should throw an error if passed params is not an object', () => {
      expect(() => {
        RealtimeComponentInstance['validateParams'](null as any);
      }).toThrow();
    });

    test('should throw an error if participant is missing id', () => {
      expect(() => {
        RealtimeComponentInstance['validateParams']({
          participant: {} as any,
        });
      }).toThrow();

      expect(() => {
        RealtimeComponentInstance['validateParams']({
          participant: { name: 'test' } as any,
        });
      }).toThrow();
    });

    test('should throw an error if environment has an invalid type', () => {
      expect(() =>
        RealtimeComponentInstance['validateParams']({
          participant: { id: 'test', name: 'test' },
          environment: 'test' as any,
        }),
      ).toThrow();
    });

    test('should throw an error if participant fields are not strings', () => {
      expect(() =>
        RealtimeComponentInstance['validateParams']({
          participant: { id: 1 as any, name: 'test' },
        }),
      ).toThrow();

      expect(() =>
        RealtimeComponentInstance['validateParams']({
          participant: { id: 'test', name: 1 as any },
        }),
      ).toThrow();
    });

    test('should not throw an error if participant is not passed', () => {
      expect(() => RealtimeComponentInstance['validateParams']()).not.toThrow();
    });

    test('should throw an error if passed participant is not an object', () => {
      expect(() =>
        RealtimeComponentInstance['validateParams']({
          participant: 'test' as any,
        }),
      ).toThrow();
    });

    test('should throw an error if debug has an invalid type', () => {
      expect(() =>
        RealtimeComponentInstance['validateParams']({
          debug: 'test' as any,
        }),
      ).toThrow();
    });
  });

  describe('setConfigs', () => {
    test('should set api key', () => {
      RealtimeComponentInstance['setConfigs']('unit-test-api-key', {});

      expect(config.set).toHaveBeenCalledWith('apiKey', 'unit-test-api-key');
    });

    test('should set secret and client id', () => {
      RealtimeComponentInstance['setConfigs'](secretAuth, {});

      expect(config.set).toHaveBeenCalledWith('secret', secretAuth.secret);
      expect(config.set).toHaveBeenCalledWith('clientId', secretAuth.clientId);
    });

    test('should set environment', () => {
      RealtimeComponentInstance['setConfigs'](secretAuth, { environment: EnvironmentTypes.DEV });

      expect(config.set).toHaveBeenCalledWith('environment', EnvironmentTypes.DEV);
    });

    test('should set prod as default environment', () => {
      RealtimeComponentInstance['setConfigs'](secretAuth, {});

      expect(config.set).toHaveBeenCalledWith('environment', EnvironmentTypes.PROD);
    });

    test('should set local participant', () => {
      RealtimeComponentInstance['setConfigs'](secretAuth, {});

      expect(RealtimeComponentInstance['localParticipant']).toBeDefined();
    });

    test('should generate random id for participant if no participant is passed', () => {
      RealtimeComponentInstance['setConfigs'](secretAuth, {});

      expect(RealtimeComponentInstance['localParticipant']).toBeDefined();
      expect(RealtimeComponentInstance['localParticipant'].id).toBe('sv-test-hash');
    });
  });

  describe('validateAuth', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    test('should throw an error if auth is not an object nor a string', () => {
      expect(() => {
        RealtimeComponentInstance['validateAuth'](null as any);
      }).toThrow();
    });

    test('should throw an error if auth is a string in a node environment', () => {
      jest.spyOn(environment as any, 'isNode').mockReturnValueOnce(true);
      expect(() => {
        RealtimeComponentInstance['validateAuth']('test');
      }).toThrow();
    });

    test('should not throw an error if auth is a object in a node environment', () => {
      jest.spyOn(environment as any, 'isNode').mockReturnValueOnce(true);
      expect(() => {
        RealtimeComponentInstance['validateAuth']({
          clientId: 'test-client-id',
          secret: 'test-secret',
        });
      }).not.toThrow();
    });

    test('should not throw an error if auth is a string in a browser environment', () => {
      jest.spyOn(environment as any, 'isNode').mockReturnValueOnce(false);
      expect(() => {
        RealtimeComponentInstance['validateAuth']('test');
      }).not.toThrow();
    });

    test('should throw an error if auth is a object in a browser environment', () => {
      jest.spyOn(environment as any, 'isNode').mockReturnValueOnce(false);
      expect(() => {
        RealtimeComponentInstance['validateAuth']({} as any);
      }).toThrow();
    });

    test('should throw an error if auth object is missing clientId', () => {
      jest.spyOn(environment as any, 'isNode').mockReturnValueOnce(true);

      expect(() => {
        RealtimeComponentInstance['validateAuth']({ secret: 'test-secret' } as any);
      }).toThrow();
    });

    test('should throw an error if auth object is missing secret', () => {
      jest.spyOn(environment as any, 'isNode').mockReturnValueOnce(true);

      expect(() => {
        RealtimeComponentInstance['validateAuth']({ clientId: 'test-client-id' } as any);
      }).toThrow();
    });
  });
});
