import { EnvironmentTypes, RemoteConfig, RemoteConfigParams } from './types';

import { RemoteConfigService } from './index';

const REMOTE_CONFIG_MOCK = {
  apiUrl: 'https://dev.nodeapi.superviz.com',
  conferenceLayerUrl: 'https://video-conference-layer.superviz.com/14.0.1-rc.2/index.html',
};

const LOCAL_CONFIG_MOCK = {
  apiUrl: 'https://localhost:3000',
  conferenceLayerUrl: 'https://localhost:8080',
};

jest.mock('../../../.remote-config', () => {
  return {
    remoteConfig: LOCAL_CONFIG_MOCK,
  };
});

describe('RemoteConfigService', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn().mockReturnValue({
      ok: true,
      json: jest.fn().mockReturnValue(REMOTE_CONFIG_MOCK),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRemoteConfig', () => {
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
      const expectedUrl = 'https://remote-config.superviz.com/video/1.0.0?env=prod';

      const result = RemoteConfigService.createUrl(params);

      expect(result).toBe(expectedUrl);
    });
  });
});
