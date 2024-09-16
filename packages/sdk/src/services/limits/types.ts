export type Limit = {
  canUse: boolean;
  maxParticipants: number;
};

export type VideoConferenceLimit = Limit & {
  canUseTranscript: boolean;
};

export type ComponentLimits = {
  videoConference: VideoConferenceLimit;
  presence: Limit;
  realtime: Limit;
};
