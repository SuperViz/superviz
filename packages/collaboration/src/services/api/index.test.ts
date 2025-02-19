import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';

import ApiService from './index';

const VALID_API_KEY = 'unit-test-valid-api-key';
const INVALID_API_KEY = 'unit-test-invalid-api-key';
const MOCK_ABLY_KEY = 'unit-test-ably-key';

const CHECK_LIMITS_MOCK = {
  limits: LIMITS_MOCK,
};

const FETCH_PARTICIPANT_MOCK = {
  id: 'any_user_id',
  name: 'any_user_name',
  email: null,
  avatar: null,
  createdAt: '2024-08-13T09:13:09.438Z',
};

const FETCH_PARTICIPANTS_BY_GROUP_MOCK = [
  {
    id: 'any_user_id',
    name: 'any_name',
    avatar: null,
    email: 'any_email',
  },
];

jest.mock('../../common/utils', () => {
  return {
    doRequest: jest.fn((url: string, method: string, body: any) => {
      if (url.includes('/user/checkapikey')) {
        const { apiKey } = body;

        if (String(apiKey) === VALID_API_KEY) {
          return Promise.resolve(true);
        }

        return Promise.resolve({ status: 404 });
      }

      if (url.includes('/user/watermark')) {
        return Promise.resolve({
          message: true,
        });
      }

      if (url.includes('/activity')) {
        return Promise.resolve({
          message: 'any message',
        });
      }

      if (url.includes('/annotations') && method === 'POST') {
        return Promise.resolve({});
      }

      if (url.includes('/annotations') && method === 'GET') {
        return Promise.resolve([]);
      }

      if (url.includes('/comments') && method === 'POST') {
        return Promise.resolve({});
      }

      if (url.includes('/comments/any_comment_id') && method === 'PUT') {
        return Promise.resolve({});
      }

      if (url.includes('/annotations/resolve/any_annotation_id') && method === 'POST') {
        return Promise.resolve({});
      }

      if (url.includes('/comments/any_comment_id') && method === 'DELETE') {
        return Promise.resolve({});
      }

      if (url.includes('/groups/participants/any_group_id') && method === 'GET') {
        return Promise.resolve(FETCH_PARTICIPANTS_BY_GROUP_MOCK);
      }

      if (url.includes('/participants/any_user_id') && method === 'GET') {
        return Promise.resolve(FETCH_PARTICIPANT_MOCK);
      }

      if (url.includes('/mentions') && method === 'POST') {
        return Promise.resolve({});
      }

      if (url.includes('/user/check_limits')) {
        return Promise.resolve(CHECK_LIMITS_MOCK);
      }
    }),
  };
});

describe('ApiService', () => {
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

  describe('fetchWatermark', () => {
    test('should return the watermark', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.fetchWaterMark(baseUrl, VALID_API_KEY);

      expect(response).toEqual(true);
    });
  });

  describe('Annotations and comments', () => {
    test('should create a comment', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.createComment(baseUrl, VALID_API_KEY, {
        annotationId: 'any_annotation_id',
        userId: 'any_user_id',
        text: 'any_text',
      });

      expect(response).toEqual({});
    });

    test('should create an annotation', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.createAnnotations(baseUrl, VALID_API_KEY, {
        roomId: 'any_room_id',
        position: 'any_position',
        userId: 'any_user_id',
      });

      expect(response).toEqual({});
    });

    test('should update a comment', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.updateComment(
        baseUrl,
        VALID_API_KEY,
        'any_comment_id',
        'any_text',
      );

      expect(response).toEqual({});
    });

    test('should fetch annotations', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.fetchAnnotation(baseUrl, VALID_API_KEY, {
        roomId: 'any_room_id',
      });

      expect(response).toEqual([]);
    });

    test('should resolve an annotation', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.resolveAnnotation(
        baseUrl,
        VALID_API_KEY,
        'any_annotation_id',
      );

      expect(response).toEqual({});
    });

    test('should delete a comment', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.deleteComment(baseUrl, VALID_API_KEY, 'any_comment_id');

      expect(response).toEqual({});
    });
  });

  describe('sendActivity', () => {
    test('should return any message', async () => {
      const userId = 'user-id';
      const groupId = 'group-id';
      const groupName = 'group-name';
      const product = 'video-component';
      const response = await ApiService.sendActivity(userId, groupId, groupName, product);

      expect(response).toEqual({ message: 'any message' });
    });
  });

  describe('fetchLimits', () => {
    test('should return the usage object with limits', async () => {
      const baseUrl = 'https://dev.nodeapi.superviz.com';
      const response = await ApiService.fetchLimits(baseUrl, VALID_API_KEY);

      expect(response).toEqual(CHECK_LIMITS_MOCK.limits);
    });
  });

  describe('fetchParticipants', () => {
    test('should return the participants', async () => {
      const response = await ApiService.fetchParticipantsByGroup('any_group_id');

      expect(response).toEqual([
        { avatar: null, id: 'any_user_id', name: 'any_name', email: 'any_email' },
      ]);
    });
  });

  describe('Mentions', () => {
    test('should create a mention', async () => {
      const response = await ApiService.createMentions({
        commentsId: 'any_comment_id',
        participants: [],
      });

      expect(response).toEqual({});
    });
  });

  describe('fetchParticipant', () => {
    test('should return the participant', async () => {
      const response = await ApiService.fetchParticipant('any_user_id');

      expect(response).toEqual(FETCH_PARTICIPANT_MOCK);
    });
  });
});
