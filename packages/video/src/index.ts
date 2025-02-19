import './common/styles/global.css';

export { VideoConferenceProps } from './components/video-conference/types';
export { VideoConference } from './components/video-conference';

export { VideoHuddleProps } from './components/video-huddle/types';
export { VideoHuddle } from './components/video-huddle';


if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SuperVizVideo = {
    // @ts-ignore
    VideoConference,
    // @ts-ignore
    VideoHuddle,
  };
}
