import { RemoteConfigParams } from '../../common/types/remote-config.types';
import { EnvironmentTypes } from '../../common/types/sdk-options.types';

import { RemoteConfig } from './types';

import RemoteConfigService from './index';

const REMOTE_CONFIG_MOCK = {
  apiUrl: 'https://dev.nodeapi.superviz.com',
  conferenceLayerUrl: 'https://video-conference-layer.superviz.com/14.0.1-rc.2/index.html',
};

const LOCAL_CONFIG_MOCK = {
  apiUrl: 'https://localhost:3000',
  conferenceLayerUrl: 'https://localhost:8080',
};

jest.mock('../../common/utils', () => {
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
      const expectedUrl = 'https://remote-config.superviz.com/sdk/1.0.0?env=prod';

      const result = RemoteConfigService.createUrl(params);

      expect(result).toBe(expectedUrl);
    });
  });
});
