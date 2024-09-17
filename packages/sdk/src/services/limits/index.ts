import { ComponentNames, PresenceMap } from '../../components/types';
import config from '../config';

import { ComponentLimits, Limit, VideoConferenceLimit } from './types';

export default class LimitsService {
  static checkComponentLimit(name: ComponentNames): Limit | VideoConferenceLimit {
    const limits = config.get<ComponentLimits>('limits');
    const componentName = PresenceMap[name] ?? name;

    return limits?.[componentName] ?? { canUse: false, maxParticipants: 50 };
  }
}
