import { ParticipantType } from '../../common/types/participant.types';
import { BrowserService } from '../../services/browser';
import config from '../../services/config';
import VideoConfereceManager from '../../services/video-conference-manager';
import { CamerasPosition, LayoutMode, LayoutPosition } from '../../services/video-conference-manager/types';

import { VideoMeetingParams } from './types';

import { VideoMeeting } from '.';

jest.mock('../../services/config');
jest.mock('../../services/video-conference-manager');

describe('VideoMeeting Class', () => {
  const defaultParams: VideoMeetingParams = {
    permissions: {
      allowGuests: true,
      toggleMic: true,
      toggleCamera: true,
      toggleScreenShare: true,
      toggleRecording: true,
      toggleChat: true,
      toggleParticipantList: true,
    },
    participantType: ParticipantType.GUEST,
    i18n: {
      language: 'en',
      locales: [{ language: 'en', messages: {} }],
    },
    styles: 'default-style',
    callbacks: {
      onToggleMicrophone: jest.fn(),
      onToggleCam: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get = jest.fn().mockReturnValue(true);
  });

  test('should initialize with default values if no params are provided', () => {
    const videoMeeting = new VideoMeeting();

    expect(videoMeeting['allowGuests']).toBe(false);
    expect(videoMeeting['userType']).toBe(ParticipantType.GUEST);
  });

  test('should initialize with provided params', () => {
    const videoMeeting = new VideoMeeting(defaultParams);

    expect(videoMeeting['allowGuests']).toBe(true);
    expect(videoMeeting['userType']).toBe(ParticipantType.GUEST);
  });

  test('should set videoConfig correctly in startVideo', () => {
    const videoMeeting = new VideoMeeting(defaultParams);
    videoMeeting['startVideo']();

    expect(videoMeeting['videoConfig']).toEqual({
      canUseChat: true,
      canUseCams: true,
      canShowAudienceList: true,
      canUseRecording: true,
      canUseScreenshare: true,
      devices: {
        audioInput: true,
        audioOutput: true,
        videoInput: true,
      },
      language: 'en',
      locales: defaultParams.i18n?.locales,
      styles: 'default-style',
      callbacks: defaultParams.callbacks,
      canUseDefaultAvatars: false,
      canUseGather: false,
      canUseFollow: false,
      canUseGoTo: false,
      canUseDefaultToolbar: true,
      collaborationMode: false,
      skipMeetingSettings: false,
      camerasPosition: CamerasPosition.LEFT,
      waterMark: true,
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.GRID,
      browserService: new BrowserService(),
      avatars: [],
      offset: undefined,
    });
  });

  test('should instantiate VideoConferenceManager in startVideo', () => {
    const videoMeeting = new VideoMeeting(defaultParams);
    videoMeeting['startVideo']();

    expect(VideoConfereceManager).toHaveBeenCalledWith(videoMeeting['videoConfig']);
    expect(videoMeeting['videoManager']).toBeInstanceOf(VideoConfereceManager);
  });
});
