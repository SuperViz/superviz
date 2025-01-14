import { Configuration } from '../src/services/config/types';

export const MOCK_CONFIG: Configuration = {
  apiKey: 'unit-test-api-key',
  environment: 'dev',
  roomId: 'unit-test-room-id',
  debug: true,
  apiUrl: 'unit-test-api-url',
  group: {
    id: 'unit-test-group-id',
    name: 'unit-test-group-name',
  },
  limits: {
    videoConference: {
      canUse: true,
      maxParticipants: 10,
      canUseTranscript: true,
    },
    presence: {
      canUse: true,
      maxParticipants: 10,
    },
    realtime: {
      canUse: true,
      maxParticipants: 10,
    },
  },
  waterMark: true,
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
