import { Params } from '../src/component/types';
import { EnvironmentTypes } from '../src/types/options.types';

export const MOCK_PARAMS: Params = {
  participant: {
    id: 'unit-test-participant-id',
    name: 'unit-test-participant-name',
  },
  debug: true,
  environment: EnvironmentTypes.DEV,
};
