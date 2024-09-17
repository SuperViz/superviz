import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';
import { ComponentNames } from '../../components/types';
import config from '../config';

import LimitsService from './index';
import { ComponentLimits } from './types';

describe('LimitsService', () => {
  describe('checkComponentLimit', () => {
    it('should return true if the component limit is not exceeded', () => {
      const componentName = ComponentNames.VIDEO_CONFERENCE;
      jest.spyOn(config, 'get').mockReturnValue(LIMITS_MOCK);

      const result = LimitsService.checkComponentLimit(componentName);

      expect(result).toBe(LIMITS_MOCK.videoConference);
    });

    it('should return false if the component limit is exceeded', () => {
      const componentName = ComponentNames.COMMENTS;

      const expected: ComponentLimits = {
        ...LIMITS_MOCK,
        presence: {
          ...LIMITS_MOCK.presence,
          canUse: false,
        },
      };

      jest.spyOn(config, 'get').mockReturnValue(expected);

      const result = LimitsService.checkComponentLimit(componentName);

      expect(result).toBe(expected.presence);
    });
  });
});
