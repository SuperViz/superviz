import { EnvironmentTypes } from '../src/types/options.types';
import { Configuration } from '../src/services/config/types';

export const MOCK_CONFIG: Configuration = {
  apiKey: 'unit-test-api-key',
  environment: EnvironmentTypes.DEV,
  roomId: 'unit-test-room-id',
  debug: true,
  apiUrl: 'unit-test-api-url',
  clientId: 'unit-test-client-id',
  secret: 'unit-test-secret',
};
