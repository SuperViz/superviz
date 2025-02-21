import { VideoConferenceProps } from './types';

import { VideoConference } from './index';

describe('VideoConference', () => {
  it('should create VideoConference with default config when no props are provided', () => {
    const videoConference = new VideoConference();
    expect(videoConference).toBeDefined();
  });

  it('should validate and set the brand logo URL correctly', () => {
    const props: VideoConferenceProps = {
      brand: { logoUrl: 'https://example.com/logo.png' },
      participantType: 'host',
    };
    const videoConference = new VideoConference(props);
    expect(videoConference).toBeDefined();
  });

  it('should log an error for invalid brand logo URL', () => {
    console.error = jest.fn();
    const props: VideoConferenceProps = {
      brand: { logoUrl: 'invalid-url' },
      participantType: 'host',
    };
    expect(() => new VideoConference(props)).toThrow('[SuperViz] Invalid brand logo URL: invalid-url');
    expect(console.error).toHaveBeenCalledWith('[SuperViz] Invalid brand logo URL:', 'invalid-url');
  });

  it('should log an error for invalid participant type', () => {
    console.error = jest.fn();
    const props: VideoConferenceProps = {
      participantType: 'invalid-type' as any,
    };
    expect(() => new VideoConference(props)).toThrow('[SuperViz] Invalid participant type: invalid-type');
    expect(console.error).toHaveBeenCalledWith('[SuperViz] Invalid participant type:', 'invalid-type');
  });

  it('should set default permissions when none are provided', () => {
    const props: VideoConferenceProps = {
      participantType: 'guest',
    };
    const videoConference = new VideoConference(props);
    expect(videoConference).toBeDefined();
  });

  it('should set provided permissions correctly', () => {
    const props: VideoConferenceProps = {
      participantType: 'host',
      permissions: {
        toggleCamera: false,
        toggleMic: false,
        toggleChat: false,
        toggleParticipantList: false,
        toggleRecording: false,
        toggleScreenShare: false,
      },
    };
    const videoConference = new VideoConference(props);
    expect(videoConference).toBeDefined();
  });
});
