import { ComponentLimits } from '../src/services/limits/types';

export const LIMITS_MOCK: ComponentLimits = {
  presence: {
    canUse: true,
    maxParticipants: 50,
  },
  realtime: {
    canUse: true,
    maxParticipants: 200,
  },
  videoConference: {
    canUse: true,
    maxParticipants: 255,
    canUseTranscript: true,
  },
};
