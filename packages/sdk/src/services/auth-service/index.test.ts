import ApiService from '../api';

import auth from './index';

jest.mock('../api');

describe('auth', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  const baseUrl = 'https://example.com';
  const key = 'unit-test-key';

  beforeEach(() => {
    (ApiService.validateApiKey as jest.Mock).mockReset();
  });

  it('should return true if the API key is valid', async () => {
    (ApiService.validateApiKey as jest.Mock).mockResolvedValue(true);

    const result = await auth(baseUrl, key);

    expect(result).toBe(true);
    expect(ApiService.validateApiKey).toHaveBeenCalledWith(baseUrl, key);
  });

  it('should return false if the API key is invalid', async () => {
    (ApiService.validateApiKey as jest.Mock).mockRejectedValue({ status: 404 });

    const result = await auth(baseUrl, key);

    expect(result).toBe(false);
    expect(ApiService.validateApiKey).toHaveBeenCalledWith(baseUrl, key);
  });

  it('should throw an error if an unexpected error occurs', async () => {
    (ApiService.validateApiKey as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

    await expect(auth(baseUrl, key)).rejects.toThrow('Unable to validate API key');
    expect(ApiService.validateApiKey).toHaveBeenCalledWith(baseUrl, key);
  });
});
