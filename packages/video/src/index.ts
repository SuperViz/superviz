import './common/styles/global.css';

import { VideoConferenceProps } from './components/video-conference/types';
import { VideoConference } from './components/video-conference';

import { VideoHuddleProps } from './components/video-huddle/types';
import { VideoHuddle } from './components/video-huddle';


if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SuperVizVideo = {
    VideoConference: VideoConference,
    VideoHuddle: VideoHuddle,
  };
}

export { VideoConferenceProps, VideoConference, VideoHuddleProps, VideoHuddle };
