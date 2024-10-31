import { ColorsVariables } from '../../common/types/colors.types';
import { ParticipantType } from '../../common/types/participant.types';
import { BrowserService } from '../../services/browser';
import config from '../../services/config';
import VideoConferecenManager from '../../services/video-conference-manager';
import { CamerasPosition, LayoutMode, LayoutPosition } from '../../services/video-conference-manager/types';

import { VideoConferenceOptions } from './types';

import { VideoConference } from '.';

// Mock dependencies
jest.mock('../../services/config');
jest.mock('../../services/video-conference-manager');

describe('VideoConference Class', () => {
  const defaultParams: VideoConferenceOptions = {
    showAudienceList: true,
    camsOff: false,
    screenshareOff: false,
    chatOff: false,
    enableRecording: true,
    defaultAvatars: true,
    offset: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
    enableFollow: true,
    enableGoTo: true,
    enableGather: true,
    defaultToolbar: true,
    devices: { audioInput: true, videoInput: true, audioOutput: true },
    language: 'en',
    locales: [{ language: 'en', messages: {} }],
    avatars: [],
    skipMeetingSettings: false,
    allowGuests: true,
    userType: ParticipantType.GUEST,
    participantType: ParticipantType.GUEST,
    styles: 'default-style',
    collaborationMode: {
      enabled: true,
      position: CamerasPosition.LEFT,
      modalPosition: LayoutPosition.CENTER,
      initialView: LayoutMode.GRID,
    },
    callbacks: {
      onToggleMicrophone: jest.fn(),
      onToggleCam: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get = jest.fn().mockImplementation((key) => {
      if (key === 'colors') return { primary: '#000000' } as ColorsVariables;
      if (key === 'waterMark') return true;
      return undefined;
    });
  });

  test('should initialize with provided params', () => {
    const videoConference = new VideoConference(defaultParams);

    expect(videoConference['allowGuests']).toBe(true);
    expect(videoConference['userType']).toBe(ParticipantType.GUEST);
  });

  test('should initialize with default values when no params are provided', () => {
    const videoConference = new VideoConference({});

    expect(videoConference['allowGuests']).toBe(false);
    expect(videoConference['userType']).toBe(ParticipantType.GUEST);
  });

  test('should set videoConfig correctly in startVideo', () => {
    const videoConference = new VideoConference(defaultParams);
    videoConference['startVideo']();

    expect(videoConference['videoConfig']).toEqual({
      language: 'en',
      canUseRecording: true,
      canShowAudienceList: true,
      canUseChat: true,
      canUseCams: true,
      canUseScreenshare: true,
      canUseDefaultAvatars: true,
      canUseGather: true,
      canUseFollow: true,
      canUseGoTo: true,
      canUseDefaultToolbar: true,
      camerasPosition: CamerasPosition.LEFT,
      devices: { audioInput: true, videoInput: true, audioOutput: true },
      skipMeetingSettings: false,
      browserService: new BrowserService(),
      offset: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      locales: defaultParams.locales,
      avatars: [],
      customColors: { primary: '#000000' },
      waterMark: true,
      styles: 'default-style',
      collaborationMode: true,
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.GRID,
      callbacks: defaultParams.callbacks,
    });
  });

  test('should instantiate VideoConferecenManager in startVideo', () => {
    const videoConference = new VideoConference(defaultParams);
    videoConference['startVideo']();

    expect(VideoConferecenManager).toHaveBeenCalledWith(videoConference['videoConfig']);
    expect(videoConference['videoManager']).toBeInstanceOf(VideoConferecenManager);
  });

  test('should handle undefined collaborationMode gracefully', () => {
    const paramsWithoutCollabMode: VideoConferenceOptions = {
      ...defaultParams,
      collaborationMode: undefined,
    };
    const videoConference = new VideoConference(paramsWithoutCollabMode);
    videoConference['startVideo']();

    expect(videoConference['videoConfig'].collaborationMode).toBe(true); // Default to true
    expect(videoConference['videoConfig'].layoutPosition).toBe(LayoutPosition.CENTER);
    expect(videoConference['videoConfig'].layoutMode).toBe(LayoutMode.LIST);
  });

  test('should handle undefined permissions gracefully', () => {
    const paramsWithoutPermissions: VideoConferenceOptions = {
      ...defaultParams,
      camsOff: undefined,
      screenshareOff: undefined,
      chatOff: undefined,
    };
    const videoConference = new VideoConference(paramsWithoutPermissions);
    videoConference['startVideo']();

    expect(videoConference['videoConfig'].canUseChat).toBe(true);
    expect(videoConference['videoConfig'].canUseCams).toBe(true);
    expect(videoConference['videoConfig'].canUseScreenshare).toBe(true);
  });

  test('should pass callbacks correctly in videoConfig', () => {
    const videoConference = new VideoConference(defaultParams);
    videoConference['startVideo']();

    expect(videoConference['videoConfig'].callbacks).toEqual(defaultParams.callbacks);
  });
});
