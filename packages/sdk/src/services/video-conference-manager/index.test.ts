import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import {
  DeviceEvent,
  FrameEvent,
  MeetingConnectionStatus,
  MeetingControlsEvent,
  MeetingEvent,
  MeetingState,
  RealtimeEvent,
} from '../../common/types/events.types';
import { Participant } from '../../common/types/participant.types';
import { BrowserService } from '../browser';

import { CamerasPosition, VideoFrameState, VideoManagerOptions } from './types';

import VideoConferenceManager from './index';

const createVideoConfrenceManager = (options?: VideoManagerOptions) => {
  const defaultOptions: VideoManagerOptions = {
    browserService: new BrowserService(),
    camerasPosition: CamerasPosition.RIGHT,
    canUseRecording: true,
    canShowAudienceList: true,
    canUseCams: true,
    canUseChat: true,
    canUseScreenshare: true,
    canUseDefaultAvatars: true,
    canUseDefaultToolbar: true,
    canUseFollow: true,
    canUseGather: true,
    canUseGoTo: true,
    collaborationMode: false,
    devices: {
      audioInput: true,
      audioOutput: true,
      videoInput: true,
    },
    skipMeetingSettings: false,
    locales: [],
    avatars: [],
  };

  const videoConferenceManager = new VideoConferenceManager(options ?? defaultOptions);

  return videoConferenceManager;
};

describe('VideoConferenceManager', () => {
  let VideoConferenceManagerInstance: VideoConferenceManager;

  beforeEach(() => {
    jest.clearAllMocks();
    VideoConferenceManagerInstance = createVideoConfrenceManager();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should create a new instance of VideoConferenceManager', () => {
      expect(VideoConferenceManagerInstance).toBeInstanceOf(VideoConferenceManager);
    });

    test('should update the frame state to "initializing"', () => {
      expect(VideoConferenceManagerInstance.frameState).toBe(VideoFrameState.INITIALIZING);
    });

    test('should create video wrapper', () => {
      const element = document.querySelector('#sv-video-wrapper');

      expect(element).not.toBeNull();
      expect(element?.classList).toContain('sv_video_wrapper');
    });

    test('should create a video iframe element', () => {
      const element = document.querySelector('#sv-video-frame');
      const childElement = document.querySelector('#sv-video-wrapper > iframe');

      expect(element).not.toBeNull();
      expect(childElement).toBe(element);
    });

    test('should create a video iframe element with the correct src', () => {
      const element = document.querySelector('#sv-video-frame');

      expect(element?.getAttribute('src')).toBe('https://unit-test-conference-layer-url/');
    });

    test('should set the default style classes to iframe', () => {
      const element = document.querySelector('#sv-video-frame');

      expect(element?.classList).toContain('sv-video-frame--right');
    });
  });

  describe('destroy', () => {
    test('should remove FrameBricklayer instance', () => {
      VideoConferenceManagerInstance.destroy();

      expect(VideoConferenceManagerInstance['bricklayer']).toBeNull();
    });

    test('should remove observers', () => {
      const frameSizeObserverSpy = jest.spyOn(
        VideoConferenceManagerInstance.frameSizeObserver,
        'destroy',
      );
      const realtimeEventsObserverSpy = jest.spyOn(
        VideoConferenceManagerInstance.realtimeEventsObserver,
        'destroy',
      );
      const sameAccountErrorSpy = jest.spyOn(
        VideoConferenceManagerInstance.sameAccountErrorObserver,
        'destroy',
      );
      const devicesObserverSpy = jest.spyOn(
        VideoConferenceManagerInstance.devicesObserver,
        'destroy',
      );
      const meetingStateObserverSpy = jest.spyOn(
        VideoConferenceManagerInstance.meetingStateObserver,
        'destroy',
      );
      const meetingConnectionObserverSpy = jest.spyOn(
        VideoConferenceManagerInstance.meetingConnectionObserver,
        'destroy',
      );
      const participantJoinedSpy = jest.spyOn(
        VideoConferenceManagerInstance.participantJoinedObserver,
        'destroy',
      );
      const participantLeftSpy = jest.spyOn(
        VideoConferenceManagerInstance.participantLeftObserver,
        'destroy',
      );

      VideoConferenceManagerInstance.destroy();

      expect(frameSizeObserverSpy).toBeCalled();
      expect(realtimeEventsObserverSpy).toBeCalled();
      expect(sameAccountErrorSpy).toBeCalled();
      expect(devicesObserverSpy).toBeCalled();
      expect(meetingStateObserverSpy).toBeCalled();
      expect(meetingConnectionObserverSpy).toBeCalled();
      expect(participantJoinedSpy).toBeCalled();
      expect(participantLeftSpy).toBeCalled();
    });

    test('remove window listeners', () => {
      const spy = jest.spyOn(window, 'removeEventListener');

      VideoConferenceManagerInstance.destroy();

      expect(spy).toBeCalledWith('resize', VideoConferenceManagerInstance['onWindowResize']);
      expect(spy).toBeCalledWith(
        'orientationchange',
        VideoConferenceManagerInstance['onWindowResize'],
      );
    });
  });

  describe('updateFrameState', () => {
    test('should set the frame state', () => {
      VideoConferenceManagerInstance['updateFrameState'](VideoFrameState.INITIALIZED);

      expect(VideoConferenceManagerInstance.frameState).toBe(VideoFrameState.INITIALIZED);
    });

    test('should emit the frame state change event', () => {
      const spy = jest.spyOn(VideoConferenceManagerInstance.frameStateObserver, 'publish');

      VideoConferenceManagerInstance['updateFrameState'](VideoFrameState.INITIALIZED);

      expect(spy).toBeCalledTimes(1);
    });

    test('should skip emitting the frame state change event if the frame state is the same', () => {
      const spy = jest.spyOn(VideoConferenceManagerInstance.frameStateObserver, 'publish');

      VideoConferenceManagerInstance['updateFrameState'](VideoFrameState.INITIALIZED);
      VideoConferenceManagerInstance['updateFrameState'](VideoFrameState.INITIALIZED);

      expect(spy).toBeCalledTimes(1);
    });
  });

  describe('onFrameLoad', () => {
    test('should update the frame state to "initialized"', () => {
      VideoConferenceManagerInstance['onFrameLoad']();

      expect(VideoConferenceManagerInstance.frameState).toBe(VideoFrameState.INITIALIZED);
    });

    test('should update the frame locale', () => {
      VideoConferenceManagerInstance['updateFrameLocale'] = jest.fn();
      VideoConferenceManagerInstance['onFrameLoad']();

      expect(VideoConferenceManagerInstance['updateFrameLocale']).toBeCalled();
    });

    test('should update the meeting avatars', () => {
      VideoConferenceManagerInstance['updateMeetingAvatars'] = jest.fn();
      VideoConferenceManagerInstance['onFrameLoad']();

      expect(VideoConferenceManagerInstance['updateMeetingAvatars']).toBeCalled();
    });

    test('should call widnow resize event', () => {
      VideoConferenceManagerInstance['onWindowResize'] = jest.fn();
      VideoConferenceManagerInstance['onFrameLoad']();

      expect(VideoConferenceManagerInstance['onWindowResize']).toBeCalled();
    });

    test('should update the frame colors', () => {
      VideoConferenceManagerInstance['setCustomColors'] = jest.fn();
      VideoConferenceManagerInstance['onFrameLoad']();

      expect(VideoConferenceManagerInstance['setCustomColors']).toBeCalled();
    });
  });

  describe('setFrameStyle', () => {
    test('should set default frame style', () => {
      VideoConferenceManagerInstance['setFrameStyle']('right');

      const element = document.querySelector('#sv-video-frame');

      expect(element?.classList).toContain('sv-video-frame--right');
    });
  });

  describe('setCustomColors', () => {
    test('should skip set custom colors if custom colors are not defined', () => {
      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance['setCustomColors']();

      expect(VideoConferenceManagerInstance['messageBridge'].publish).not.toBeCalled();
    });

    test('should set custom colors if custom colors are defined', () => {
      const customColos = {
        'sv-primary-900': '16 29 70',
        'sv-primary-200': '141 164 239',
        'sv-primary': '58 92 204',
        'sv-gray-800': '250 250 252',
        'sv-gray-700': '233 229 239',
        'sv-gray-600': '201 196 209',
        'sv-gray-500': '174 169 184',
        'sv-gray-400': '126 122 136',
        'sv-gray-300': '87 83 95',
        'sv-gray-200': '57 54 62',
      };

      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      // @ts-ignore
      VideoConferenceManagerInstance['customColors'] = customColos;

      VideoConferenceManagerInstance['setCustomColors']();

      expect(VideoConferenceManagerInstance['messageBridge'].publish).toBeCalledWith(
        FrameEvent.FRAME_COLOR_LIST_UPDATE,
        customColos,
      );
    });
  });

  describe('setCallbacks', () => {
    test('should skip set callbacks if callbacks are not defined', () => {
      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance['setCallbacks']();

      expect(VideoConferenceManagerInstance['messageBridge'].publish).not.toBeCalled();
    });

    test('should set callbacks if callbacks are defined', () => {
      const callbacks = {
        onToggleMicrophone: jest.fn(),
        onToggleCam: jest.fn(),
        onToggleRecording: jest.fn(),
        onToggleChat: jest.fn(),
        onToggleScreenShare: jest.fn(),
        onClickHangup: jest.fn(),
        onToggleMeetingSetup: jest.fn(),
      };

      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      // @ts-ignore
      VideoConferenceManagerInstance['callbacks'] = callbacks;

      VideoConferenceManagerInstance['setCallbacks']();

      expect(VideoConferenceManagerInstance['messageBridge'].publish).toBeCalledWith(
        FrameEvent.FRAME_CALLBACKS_UPDATE,
        JSON.stringify({
          onToggleMicrophone: true,
          onToggleCam: true,
          onToggleRecording: true,
          onToggleChat: true,
          onToggleScreenShare: true,
          onClickHangup: true,
          onToggleMeetingSetup: true,
        }),
      );
    });
  });
  describe('updateFrameLocale', () => {
    test('should skip update frame locale if locale is not defined', () => {
      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance['updateFrameLocale']();

      expect(VideoConferenceManagerInstance['messageBridge'].publish).not.toBeCalled();
    });

    test('should throw an error if the default locale is not available in the language list', () => {
      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance['frameLocale'] = {
        language: 'pt-BR',
        locales: [],
      };

      expect(() => VideoConferenceManagerInstance['updateFrameLocale']()).toThrowError(
        'The default language is not available in the language listing.',
      );
    });

    test('should set the frame locale', () => {
      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance['frameLocale'] = {
        language: 'pt-BR',
        locales: [
          {
            language: 'pt-BR',
            messages: {
              username: 'Nome de usuário',
            },
          },
        ],
      };

      VideoConferenceManagerInstance['updateFrameLocale']();

      expect(VideoConferenceManagerInstance['messageBridge'].publish).toBeCalledWith(
        FrameEvent.FRAME_LOCALE_UPDATE,
        VideoConferenceManagerInstance['frameLocale'],
      );
    });
  });

  describe('onFrameDimensionsUpdate', () => {
    test('should update the frame dimensions', () => {
      VideoConferenceManagerInstance['onFrameDimensionsUpdate']({ width: 100, height: 100 });

      const element = document.getElementById('sv-video-frame');

      if (!element) {
        throw new Error('Element not found');
      }

      expect(element.style.width).toBe('100px');
      expect(element.style.height).toBe('100px');
    });

    test('should add the watermark height to the frame height', () => {
      jest.spyOn(VideoConferenceManagerInstance, 'isWaterMarkEnabled', 'get').mockReturnValue(true);

      VideoConferenceManagerInstance['onFrameDimensionsUpdate']({ width: 100, height: 100 });

      const element = document.getElementById('sv-video-frame');

      if (!element) {
        throw new Error('Element not found');
      }

      expect(element.style.height).toBe('140px');
    });

    test('should set the frame width to 100% if the horizontal cameras is enabled', () => {
      jest
        .spyOn(VideoConferenceManagerInstance, 'isHorizontalCameraEnabled', 'get')
        .mockReturnValue(true);

      VideoConferenceManagerInstance['onFrameDimensionsUpdate']({ width: 100, height: 100 });

      const element = document.getElementById('sv-video-frame');

      if (!element) {
        throw new Error('Element not found');
      }

      expect(element.style.width).toBe('calc(100% - 0px - 0px)');
      expect(element.style.height).toBe('100px');
    });

    test('if the dimensions are bigger than window, should set the frame width to 100%', () => {
      Object.defineProperty(window, 'innerWidth', {
        get() {
          return 1000;
        },
      });
      Object.defineProperty(window, 'innerHeight', {
        get() {
          return 1000;
        },
      });

      VideoConferenceManagerInstance['onFrameDimensionsUpdate']({ width: 1000, height: 1000 });

      const element = document.getElementById('sv-video-frame');

      if (!element) {
        throw new Error('Element not found');
      }

      expect(element.style.width).toBe('calc(100% - 0px - 0px)');
      expect(element.style.height).toBe('calc(100% - 0px - 0px)');
    });
  });

  describe('publishMessageToFrame', () => {
    beforeEach(() => {
      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();
    });

    test('should publish the meeting control event', () => {
      Object.values(MeetingControlsEvent).forEach((event: MeetingControlsEvent) => {
        VideoConferenceManagerInstance.publishMessageToFrame(event);

        expect(VideoConferenceManagerInstance['messageBridge'].publish).toBeCalledWith(
          event,
          undefined,
        );
      });
    });
  });

  describe('leave', () => {
    test('should call the leave method', () => {
      jest.spyOn(VideoConferenceManagerInstance, 'destroy');
      jest.spyOn(VideoConferenceManagerInstance, 'leave');

      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance.leave();

      expect(VideoConferenceManagerInstance['leave']).toBeCalled();
      expect(VideoConferenceManagerInstance.destroy).toBeCalled();
      expect(VideoConferenceManagerInstance['messageBridge'].publish).toBeCalledWith(
        MeetingEvent.MEETING_LEAVE,
      );
    });
  });

  describe('start', () => {
    test('should call the start method', () => {
      jest.spyOn(VideoConferenceManagerInstance, 'start');

      const startParams = {
        roomId: 'unit-test-room-id',
        participant: MOCK_LOCAL_PARTICIPANT,
        group: {
          id: 'unit-test-group-id',
          name: 'unit-test-group-name',
        },
      };

      VideoConferenceManagerInstance['onFrameLoad']();
      VideoConferenceManagerInstance['messageBridge'].publish = jest.fn();

      VideoConferenceManagerInstance.start(startParams);

      expect(VideoConferenceManagerInstance['start']).toBeCalled();
      expect(VideoConferenceManagerInstance['messageBridge'].publish).toBeCalledWith(
        MeetingEvent.MEETING_START,
        {
          ...startParams,
          config: VideoConferenceManagerInstance['frameConfig'],
        },
      );
    });
  });

  describe('onParticipantLeft', () => {
    test('should publish the left participant', () => {
      const participant: Participant = { id: '1', name: 'Alice' };
      const spy = jest.spyOn(VideoConferenceManagerInstance.participantLeftObserver, 'publish');

      VideoConferenceManagerInstance['onParticipantLeft'](participant);

      expect(spy).toHaveBeenCalledWith(participant);
    });
  });

  describe('onMeetingHostChange', () => {
    test('should publish the new host ID', () => {
      const hostId = '1';
      const spy = jest.spyOn(VideoConferenceManagerInstance.realtimeEventsObserver, 'publish');

      VideoConferenceManagerInstance['onMeetingHostChange'](hostId);

      expect(spy).toHaveBeenCalledWith({
        event: RealtimeEvent.REALTIME_HOST_CHANGE,
        data: hostId,
      });
    });
  });

  describe('onMeetingKickParticipant', () => {
    test('should publish the participant ID to be kicked', () => {
      const participantId = '1';
      const spy = jest.spyOn(VideoConferenceManagerInstance.realtimeEventsObserver, 'publish');

      VideoConferenceManagerInstance['onMeetingKickParticipant'](participantId);

      expect(spy).toHaveBeenCalledWith({
        event: MeetingEvent.MEETING_KICK_PARTICIPANT,
        data: participantId,
      });
    });
  });

  describe('onFollowParticipantDidChange', () => {
    test('should publish the new participant ID', () => {
      const participantId = '1';
      const spy = jest.spyOn(VideoConferenceManagerInstance.realtimeEventsObserver, 'publish');

      VideoConferenceManagerInstance['onFollowParticipantDidChange'](participantId);

      expect(spy).toHaveBeenCalledWith({
        event: RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
        data: participantId,
      });
    });
  });

  describe('onGoToDidChange', () => {
    test('should publish the new participant ID', () => {
      const participantId = '1';
      const spy = jest.spyOn(VideoConferenceManagerInstance.realtimeEventsObserver, 'publish');

      VideoConferenceManagerInstance['onGoToDidChange'](participantId);

      expect(spy).toHaveBeenCalledWith({
        event: RealtimeEvent.REALTIME_GO_TO_PARTICIPANT,
        data: participantId,
      });
    });
  });

  describe('onGather', () => {
    test('should publish an empty message', () => {
      const spy = jest.spyOn(VideoConferenceManagerInstance.realtimeEventsObserver, 'publish');

      VideoConferenceManagerInstance['onGather']();

      expect(spy).toHaveBeenCalledWith({
        event: RealtimeEvent.REALTIME_GATHER,
        data: true,
      });
    });
  });

  describe('onGridModeChange', () => {
    test('should publish the new grid mode state', () => {
      const isGridModeEnabled = true;
      const spy = jest.spyOn(VideoConferenceManagerInstance.realtimeEventsObserver, 'publish');

      VideoConferenceManagerInstance['onGridModeChange'](isGridModeEnabled);

      expect(spy).toHaveBeenCalledWith({
        event: RealtimeEvent.REALTIME_GRID_MODE_CHANGE,
        data: isGridModeEnabled,
      });
    });
  });

  describe('onSameAccountError', () => {
    test('should publish the error message', () => {
      const error = 'Same account error';
      const spy = jest.spyOn(VideoConferenceManagerInstance.sameAccountErrorObserver, 'publish');

      VideoConferenceManagerInstance['onSameAccountError'](error);

      expect(spy).toHaveBeenCalledWith(error);
    });
  });

  describe('onDevicesChange', () => {
    test('should publish the new device state', () => {
      const state: DeviceEvent = DeviceEvent.DEVICES_BLOCKED;
      const spy = jest.spyOn(VideoConferenceManagerInstance.devicesObserver, 'publish');

      VideoConferenceManagerInstance['onDevicesChange'](state);

      expect(spy).toHaveBeenCalledWith(state);
    });
  });

  describe('meetingStateUpdate', () => {
    test('should publish the new meeting state', () => {
      const newState: MeetingState = MeetingState.MEETING_CONNECTED;
      const spy = jest.spyOn(VideoConferenceManagerInstance.meetingStateObserver, 'publish');

      VideoConferenceManagerInstance['meetingStateUpdate'](newState);

      expect(spy).toHaveBeenCalledWith(newState);
    });
  });

  describe('onConnectionStatusChange', () => {
    test('should publish the new connection status', () => {
      const newStatus: MeetingConnectionStatus = MeetingConnectionStatus.GOOD;
      const spy = jest.spyOn(VideoConferenceManagerInstance.meetingConnectionObserver, 'publish');

      VideoConferenceManagerInstance['onConnectionStatusChange'](newStatus);

      expect(spy).toHaveBeenCalledWith(newStatus);
    });
  });
});
