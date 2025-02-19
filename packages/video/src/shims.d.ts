declare global {
  interface Window {
    SuperViz: Record<string, unknown>;
    SuperVizVideo: {
      VideoConference: typeof import('./components/video-conference').VideoConference;
      VideoHuddle: typeof import('./components/video-huddle').VideoHuddle;
    };
  }
}
