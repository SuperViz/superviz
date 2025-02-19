import doRequest from './do-request';

describe('doRequest', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('should make a GET request with the correct URL and headers', async () => {
    const url = 'https://example.com';
    const method = 'GET';
    const body = null;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn(),
    });

    await doRequest(url, method, body);

    expect(mockFetch).toHaveBeenCalledWith(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: null,
    });
  });

  test('should make a POST request with the correct URL, headers, and body', async () => {
    const url = 'https://example.com';
    const method = 'POST';
    const body = { foo: 'bar' };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn(),
    });

    await doRequest(url, method, body);

    expect(mockFetch).toHaveBeenCalledWith(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  });

  test('should throw an error if the response is not ok', async () => {
    const url = 'https://example.com';
    const method = 'GET';
    const body = null;

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(doRequest(url, method, body)).rejects.toEqual({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
  });

  test('should make a GET request with the correct URL and custom headers', async () => {
    const url = 'https://example.com';
    const method = 'GET';
    const body = null;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn(),
    });

    await doRequest(url, method, body, { any_header: 'any_value' });

    expect(mockFetch).toHaveBeenCalledWith(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        any_header: 'any_value',
      },
      body: null,
    });
  });
});
