import { RemoteConfigParams } from './types';
import { EnvironmentTypes } from '../../types/options.types';

import { RemoteConfig } from './types';

import { RemoteConfigService } from './index';

const REMOTE_CONFIG_MOCK: RemoteConfig = {
  apiUrl: 'https://api.superviz.com',
  version: EnvironmentTypes.DEV,
};

const LOCAL_CONFIG_MOCK = {
  apiUrl: 'https://localhost:3000',
  version: 'local',
};

jest.mock('../../utils', () => {
  return {
    doRequest: jest.fn((url: string, method: string, body: any): Promise<RemoteConfig> => {
      return Promise.resolve(REMOTE_CONFIG_MOCK);
    }),
  };
});

jest.mock('../../../.remote-config', () => {
  return {
    remoteConfig: LOCAL_CONFIG_MOCK,
  };
});

jest.mock('../../../.version', () => {
  return {
    version: '1.0.0',
  };
});

describe('RemoteConfigService', () => {
  describe('getRemoteConfig', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should return the remote config from the server when environment is not LOCAL', async () => {
      const result = await RemoteConfigService.getRemoteConfig();

      expect(result).toBe(REMOTE_CONFIG_MOCK);
    });

    test('should return the local remote config when environment is LOCAL', async () => {
      const result = await RemoteConfigService.getRemoteConfig(EnvironmentTypes.LOCAL);

      expect(result).toBe(LOCAL_CONFIG_MOCK);
    });
  });

  describe('createUrl', () => {
    it('should create a URL with the correct version and environment', () => {
      const params: RemoteConfigParams = { version: '1.0.0', environment: EnvironmentTypes.PROD };
      const expectedUrl = 'https://remote-config.superviz.com/realtime/prod?env=prod';

      const result = RemoteConfigService.createUrl(params);

      expect(result).toBe(expectedUrl);
    });
  });
});
