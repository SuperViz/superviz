import './common/styles/global.css';

import { VideoConferenceProps } from './components/video-conference/types';
import { VideoConference } from './components/video-conference';

import { VideoHuddleProps } from './components/video-huddle/types';
import { VideoHuddle } from './components/video-huddle';
import { VideoEvent } from './components/base/types';


if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SuperVizVideo = {
    VideoConference: VideoConference,
    VideoHuddle: VideoHuddle,
    VideoEvent: VideoEvent,
  };
}

export { VideoConferenceProps, VideoConference, VideoHuddleProps, VideoHuddle, VideoEvent };
