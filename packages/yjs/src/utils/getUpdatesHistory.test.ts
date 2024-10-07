import { getUpdatesHistory } from './getUpdatesHistory';

describe('getUpdatesHistory', () => {
  const mockChannelName = 'test-channel';
  const mockApiKey = 'mock-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return updates as Uint8Array when the API responds with status 200', async () => {
    const mockResponseData = {
      events: [
        { update: { type: 'someType', data: [1, 2, 3] } },
        { update: { type: 'someType', data: [4, 5, 6] } },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockResponseData),
    });

    const result = await getUpdatesHistory(mockChannelName, mockApiKey);

    expect(fetch).toHaveBeenCalledWith(
      `https://io.superviz.com/yjs/${mockChannelName}:yjs-provider`,
      {
        headers: { 'sv-api-key': mockApiKey },
      },
    );

    expect(result).toEqual([new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])]);
  });

  test('should return an empty array if the response status is not 200', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 500,
    });

    const result = await getUpdatesHistory(mockChannelName, mockApiKey);

    expect(fetch).toHaveBeenCalledWith(
      `https://io.superviz.com/yjs/${mockChannelName}:yjs-provider`,
      {
        headers: { 'sv-api-key': mockApiKey },
      },
    );

    expect(result).toEqual([]);
  });

  test('should return an empty array if there is a fetch error', async () => {
    const mockError = new Error('Network error');

    (fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const result = await getUpdatesHistory(mockChannelName, mockApiKey);

    expect(fetch).toHaveBeenCalledWith(
      `https://io.superviz.com/yjs/${mockChannelName}:yjs-provider`,
      {
        headers: { 'sv-api-key': mockApiKey },
      },
    );

    expect(result).toEqual([]);
  });
});
