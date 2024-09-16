import { TranscriptState } from '../../../common/types/events.types';
import { RealtimeStateTypes } from '../../../common/types/realtime.types';
import { DrawingData } from '../../video-conference-manager/types';
import { Singleton } from '../common/types';
import { CreateSingleton } from '../common/utils';
import subject from '../subject';

const instance: Singleton<VideoStore> = CreateSingleton<VideoStore>();

export class VideoStore {
  public meetingState = subject<RealtimeStateTypes>(RealtimeStateTypes.DISCONNECTED);
  public gather = subject<boolean>(false);
  public hostId = subject<string>('');
  public isGridModeEnabled = subject<boolean>(false);
  public followParticipantId = subject<string>('');
  public drawing = subject<DrawingData>(null);
  public transcript = subject<TranscriptState>(null);

  constructor() {
    if (instance.value) {
      throw new Error('VideoStore is a singleton. There can only be one instance of it.');
    }

    instance.value = this;
  }

  public destroy() {
    this.meetingState.destroy();
    this.gather.destroy();
    this.hostId.destroy();
    this.isGridModeEnabled.destroy();
    this.followParticipantId.destroy();
    this.drawing.destroy();
    this.transcript.destroy();
  }
}

const store = new VideoStore();
const destroy = store.destroy.bind(store);

const meetingState = store.meetingState.expose();
const gather = store.gather.expose();
const hostId = store.hostId.expose();
const isGridModeEnabled = store.isGridModeEnabled.expose();
const followParticipantId = store.followParticipantId.expose();
const drawing = store.drawing.expose();
const transcript = store.transcript.expose();

export function useVideoStore() {
  return {
    meetingState,
    gather,
    destroy,
    hostId,
    isGridModeEnabled,
    followParticipantId,
    drawing,
    transcript,
  };
}
