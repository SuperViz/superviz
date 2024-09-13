import { MOCK_CONFIG } from '../../../__mocks__/config.mock';

import { Configuration } from './types';

import { ConfigurationService } from '.';

describe('ConfigurationService', () => {
  let configService: ConfigurationService;
  beforeEach(() => {
    configService = new ConfigurationService();
  });

  describe('set', () => {
    test('should set a value in configuration', () => {
      const key = 'roomId';
      const value = '123456';

      configService.set(key, value);
      expect(configService['configuration'][key]).toBe(value);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      configService['configuration'] = MOCK_CONFIG;
    });

    test('should get a value from configuration', () => {
      const result = configService.get('debug', 'defaultValue');
      expect(result).toBe(MOCK_CONFIG.debug);
    });

    test('should provide a default value if key is not found', () => {
      const result = configService.get('unExistingKey' as keyof Configuration, 'defaultValue');
      expect(result).toBe('defaultValue');
    });

    test('should return the default value if the config is not available', () => {
      configService['configuration'] = null as unknown as Configuration;

      const pseudoRandom = Math.random().toString();
      expect(configService.get('roomId', pseudoRandom)).toBe(pseudoRandom);
    });
  });
});
