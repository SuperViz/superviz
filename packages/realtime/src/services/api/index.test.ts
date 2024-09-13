import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';
import config from '../config';
import { ApiService } from './index';

const CHECK_LIMITS_MOCK = {
  limits: LIMITS_MOCK,
};

const VALID_API_KEY = 'unit-test-valid-api-key';
const INVALID_API_KEY = 'unit-test-invalid-api-key';

jest.mock('../../utils', () => {
  return {
    doRequest: jest.fn((url: string, method: string, body: any) => {
      if (url.includes('/user/checkapikey')) {
        const { apiKey } = body;

        if (String(apiKey) === VALID_API_KEY) {
          return Promise.resolve(true);
        }

        return Promise.resolve({ status: 404 });
      }

      if (url.includes('/user/check_limits')) {
        return Promise.resolve(CHECK_LIMITS_MOCK);
      }

      if (url.includes('.error/socket/key')) {
        throw new Error('Error');
      }

      if (url.includes('/socket/key')) {
        return Promise.resolve({ apiKey: VALID_API_KEY });
      }

      if (url.includes('/activity')) {
        return Promise.resolve();
      }
    }),
  };
});

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const apiUrl = 'https://dev.nodeapi.superviz.com';
    const secret = 'unit-test-secret';
    const clientId = 'unit-test-client-id';
    const apiKey = 'unit-test-api-key';

    config.set('apiUrl', apiUrl);
    config.set('secret', secret);
    config.set('clientId', clientId);
    config.set('apiKey', apiKey);
  });

  describe('validateApiKey', () => {
    test('should return true if the api key is valid', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.validateApiKey(baseUrl, VALID_API_KEY);

      expect(response).toEqual(true);
    });

    test('should return 404 if the api key is invalid', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.validateApiKey(baseUrl, INVALID_API_KEY);

      expect(response.status).toEqual(404);
    });
  });

  describe('fetchLimits', () => {
    test('should return the usage object with limits', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.fetchLimits(baseUrl, VALID_API_KEY);

      expect(response).toEqual(CHECK_LIMITS_MOCK.limits);
    });
  });

  describe('createUrl', () => {
    test('should return a valid URL with query params', () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const path = '/user/checkapikey';
      const query = { apiKey: VALID_API_KEY };
      const url = ApiService.createUrl(baseUrl, path, query);

      expect(url).toEqual(`${baseUrl}${path}?apiKey=${VALID_API_KEY}`);
    });
  });

  describe('fetchApiKey', () => {
    test('should return the api key', async () => {
      const response = await ApiService.fetchApiKey();

      expect(response).toEqual(VALID_API_KEY);
    });

    test('should return nothing if error is thrown', async () => {
      config.set('apiUrl', 'https://dev.nodeapi.error');
      const response = await ApiService.fetchApiKey();

      expect(response).toEqual(undefined);
    });
  });

  describe('sendActivity', () => {
    test('should send activity to the api', () => {
      const userId = 'unit-test-user-id';

      expect(ApiService.sendActivity(userId)).resolves.toBeUndefined();
    });
  });
});
