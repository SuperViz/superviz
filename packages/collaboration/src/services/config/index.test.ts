import { MOCK_CONFIG } from '../../../__mocks__/config.mock';

import { Configuration } from './types';

import { ConfigurationService } from '.';

describe('ConfigurationService', () => {
  let configService: ConfigurationService;
  beforeEach(() => {
    configService = new ConfigurationService();
    configService.setConfig(MOCK_CONFIG);
  });

  describe('setConfig', () => {
    test('configuration should be set correctly', () => {
      expect(configService.get('apiKey')).toEqual(MOCK_CONFIG.apiKey);
      expect(configService.get('apiUrl')).toEqual(MOCK_CONFIG.apiUrl);
      expect(configService.get('conferenceLayerUrl')).toEqual(MOCK_CONFIG.conferenceLayerUrl);
      expect(configService.get('environment')).toEqual(MOCK_CONFIG.environment);
      expect(configService.get('roomId')).toEqual(MOCK_CONFIG.roomId);
    });
  });

  describe('get', () => {
    test('should get a value from configuration', () => {
      const result = configService.get('apiKey', 'defaultValue');
      expect(result).toBe(MOCK_CONFIG.apiKey);
    });

    test('should provide a default value if key is not found', () => {
      const result = configService.get('unExistingKey' as keyof Configuration, 'defaultValue');
      expect(result).toBe('defaultValue');
    });

    test('should return the default value if the config is not available', () => {
      configService.setConfig(null as unknown as Configuration);
      expect(configService.get('apiKey')).toBeUndefined();
    });
  });
});
