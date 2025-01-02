import { ColorsVariables } from '../common/types/colors.types';
import { Group, Participant } from '../common/types/participant.types';
import { SuperVizSdkOptions } from '../common/types/sdk-options.types';
import ApiService from '../services/api';
import RemoteConfigService from '../services/remote-config-service';

import sdk from '.';

const COLOR_VARIABLES_MOCK = {
  'sv-primary-900': '16 29 70',
  'sv-primary-200': '141 164 239',
  'sv-primary': '58 92 204',
  'sv-gray-800': '250 250 252',
  'sv-gray-700': '233 229 239',
  'sv-gray-600': '201 196 209',
  'sv-gray-500': '174 169 184',
  'sv-gray-400': '126 122 136',
  'sv-gray-300': '87 83 95',
  'sv-gray-200': '57 54 62',
};

const REMOTE_CONFIG_MOCK = {
  apiUrl: 'https://dev.nodeapi.superviz.com',
  conferenceLayerUrl: 'https://video-conference-layer.superviz.com/14.0.1-rc.2/index.html',
};

const UNIT_TEST_API_KEY = 'unit-test-api-key';

const SIMPLE_INITIALIZATION_MOCK: SuperVizSdkOptions = {
  roomId: 'unit-test-room-id',
  participant: {
    id: 'unit-test-participant-id',
    name: 'unit-test-participant-name',
  },
  group: {
    name: 'unit-test-group-test-name',
    id: 'unit-test-group-test-id',
  },
};

jest.mock('../services/api');
jest.mock('../services/auth-service', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((_, apiKey: string) => {
    return apiKey === UNIT_TEST_API_KEY;
  }),
}));
jest.mock('../services/remote-config-service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('root export', () => {
  test('should export init function', () => {
    expect(sdk).toEqual(expect.any(Function));
  });
});

describe('initialization errors', () => {
  test('should throw an error if no API key is provided', async () => {
    await expect(sdk('', SIMPLE_INITIALIZATION_MOCK)).rejects.toThrow('API key is required');
  });

  test('should throw an error if API key is invalid', async () => {
    RemoteConfigService.getRemoteConfig = jest.fn().mockResolvedValue(REMOTE_CONFIG_MOCK);

    await expect(sdk('invalid-api-key', SIMPLE_INITIALIZATION_MOCK)).rejects.toThrow(
      'Failed to validate API key',
    );
  });

  test('should throw an error if no options are provided', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, undefined as unknown as SuperVizSdkOptions),
    ).rejects.toThrow('Options is required');
  });

  test('should throw an error if no room id is provided', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, { ...SIMPLE_INITIALIZATION_MOCK, roomId: '' }),
    ).rejects.toThrow('Room id is required');
  });

  test('should thrown an error if participant is not provided', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        participant: undefined as unknown as SuperVizSdkOptions['participant'],
      }),
    ).rejects.toThrow('Participant id is required');
  });

  test('should throw an error if no participant id is provided', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        participant: { name: 'unit-test-participant-name' } as SuperVizSdkOptions['participant'],
      }),
    ).rejects.toThrow('Participant id is required');
  });

  test('should throw an error if no group name is provided', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        group: { id: 'unit-test-group-test-id' } as Group,
      }),
    ).rejects.toThrow('Group fields is required');
  });

  test('should throw an error if custom colors variables names are invalid', async () => {
    const colorKey = 'invalid-color';

    const invalidColorVariables = { ...COLOR_VARIABLES_MOCK, [colorKey]: '0 0 0' };
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        customColors: invalidColorVariables as ColorsVariables,
      }),
    ).rejects.toThrow(`Color ${colorKey} is not a valid color variable name`);
  });

  test('should throw an error if custom colors variables values are invalid', async () => {
    const invalidColorVariables = { ...COLOR_VARIABLES_MOCK, 'sv-primary-900': 'rr bb gg' };
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        customColors: invalidColorVariables as ColorsVariables,
      }),
    ).rejects.toThrow(
      'Color sv-primary-900 is not a valid color variable value. Please check the documentation for more information.',
    );
  });

  test('should throw an error if room id is invalid', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        roomId: '<invalid-room-id>',
      }),
    ).rejects.toThrow(
      '[SuperViz] Room id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );

    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        roomId: '1',
      }),
    ).rejects.toThrow(
      '[SuperViz] Room id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('should throw an error if participant id is invalid', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        participant: { ...SIMPLE_INITIALIZATION_MOCK.participant, id: '<invalid-participant-id>' },
      }),
    ).rejects.toThrow(
      '[SuperViz] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );

    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        participant: { ...SIMPLE_INITIALIZATION_MOCK.participant, id: '1' },
      }),
    ).rejects.toThrow(
      '[SuperViz] Participant id is invalid, it should be between 2 and 64 characters and only accept letters, numbers and special characters: -_&@+=,(){}[]/«».|\'"',
    );
  });

  test('should throw an error if participant email is invalid', async () => {
    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        participant: { ...SIMPLE_INITIALIZATION_MOCK.participant, email: 'invalid-email' },
      }),
    ).rejects.toThrow('[SuperViz] Participant email is invalid');
  });

  test('should throw an error if participant does not exist and name is not defined', async () => {
    ApiService.fetchParticipant = jest.fn().mockRejectedValue({});

    await expect(
      sdk(UNIT_TEST_API_KEY, {
        ...SIMPLE_INITIALIZATION_MOCK,
        participant: { ...SIMPLE_INITIALIZATION_MOCK.participant, name: undefined },
      }),
    ).rejects.toThrow(
      '[SuperViz] - Participant does not exist, create the user in the API or add the name in the initialization to initialize the SuperViz room.',
    );
  });
});
