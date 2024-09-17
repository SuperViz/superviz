import { EnvironmentTypes } from '../src/common/types/sdk-options.types';
import { Configuration } from '../src/services/config/types';

import { MOCK_COLORS } from './colors.mock';
import { LIMITS_MOCK } from './limits.mock';
import { WATERMARK_MOCK } from './watermark.mock';

export const MOCK_CONFIG: Configuration = {
  apiKey: 'unit-test-api-key',
  apiUrl: 'http://unit-test-api-url',
  conferenceLayerUrl: 'https://unit-test-conference-layer-url',
  environment: EnvironmentTypes.DEV,
  roomId: 'unit-test-room-id',
  debug: true,
  limits: LIMITS_MOCK,
  waterMark: WATERMARK_MOCK,
  colors: MOCK_COLORS,
  features: {
    realtime: true,
    presence: true,
    videoConference: true,
    comments: true,
    whoIsOnline: true,
    presence3dMatterport: true,
    presence3dAutodesk: true,
    presence3dThreejs: true,
    formElements: true,
    transcriptLangs: ['en-US'],
  },
};
