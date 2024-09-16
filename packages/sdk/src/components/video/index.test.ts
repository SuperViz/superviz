import { TextEncoder, TextDecoder } from 'util';

import { PresenceEvent } from '@superviz/socket-client';

import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import { MOCK_OBSERVER_HELPER } from '../../../__mocks__/observer-helper.mock';
import { MOCK_AVATAR, MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import {
  DeviceEvent,
  FrameEvent,
  MeetingConnectionStatus,
  MeetingControlsEvent,
  MeetingEvent,
  MeetingState,
  RealtimeEvent,
  TranscriptState,
} from '../../common/types/events.types';
import {
  Participant,
  ParticipantType,
  VideoParticipant,
} from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { useStore } from '../../common/utils/use-store';
import { IOC } from '../../services/io';
import { Presence3DManager } from '../../services/presence-3d-manager';
import { VideoFrameState } from '../../services/video-conference-manager/types';
import { ParticipantToFrame } from './types';

import { VideoConference } from '.';
import { MEETING_COLORS } from '../../common/types/meeting-colors.types';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';

Object.assign(global, { TextDecoder, TextEncoder });

const VIDEO_MANAGER_MOCK = {
  start: jest.fn(),
  leave: jest.fn(),
  publishMessageToFrame: jest.fn(),
  frameStateObserver: MOCK_OBSERVER_HELPER,
  frameSizeObserver: MOCK_OBSERVER_HELPER,
  realtimeEventsObserver: MOCK_OBSERVER_HELPER,
  waitingForHostObserver: MOCK_OBSERVER_HELPER,
  sameAccountErrorObserver: MOCK_OBSERVER_HELPER,
  devicesObserver: MOCK_OBSERVER_HELPER,
  meetingStateObserver: MOCK_OBSERVER_HELPER,
  meetingConnectionObserver: MOCK_OBSERVER_HELPER,
  participantJoinedObserver: MOCK_OBSERVER_HELPER,
  participantLeftObserver: MOCK_OBSERVER_HELPER,
  participantListObserver: MOCK_OBSERVER_HELPER,
  isMessageBridgeReady: jest.fn().mockReturnValue(true),
};

const MOCK_DRAW_DATA = {
  name: 'participant1',
  lineColor: '255, 239, 51',
  textColor: '#000000',
  pencil: 'blob:http://localhost:8080/b3cde217-c2cc-4092-a2e5-cf4c498f744e',
  clickX: [0, 109],
  clickY: [0, 109],
  clickDrag: [],
  drawingWidth: 300,
  drawingHeight: 600,
  externalClickX: 566,
  externalClickY: 300,
  fadeOut: false,
};

jest.mock('../../services/video-conference-manager', () => {
  return jest.fn().mockImplementation(() => VIDEO_MANAGER_MOCK);
});

jest.mock('../../services/event-bus', () => {
  return jest.fn().mockImplementation(() => EVENT_BUS_MOCK);
});

jest.useFakeTimers();

describe('VideoConference', () => {
  let VideoConferenceInstance: VideoConference;

  const { localParticipant, hasJoinedRoom } = useStore(StoreType.GLOBAL);
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    localParticipant.publish(MOCK_LOCAL_PARTICIPANT);
    hasJoinedRoom.publish(true);

    VideoConferenceInstance = new VideoConference({
      userType: 'host',
      allowGuests: false,
    });

    VideoConferenceInstance['localParticipant'] = MOCK_LOCAL_PARTICIPANT as VideoParticipant;
    VideoConferenceInstance.attach({
      ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
      config: MOCK_CONFIG,
      eventBus: EVENT_BUS_MOCK,
      Presence3DManagerService: Presence3DManager,
      connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
      useStore,
    });

    VideoConferenceInstance['startVideo']();
    VideoConferenceInstance['onFrameStateChange'](VideoFrameState.INITIALIZED);
  });

  test('should not show avatar settings if local participant has avatar', () => {
    VideoConferenceInstance.detach();

    VideoConferenceInstance = new VideoConference({
      defaultAvatars: true,
    });

    VideoConferenceInstance['localParticipant'] = {
      ...MOCK_LOCAL_PARTICIPANT,
      avatar: MOCK_AVATAR,
    } as VideoParticipant;

    VideoConferenceInstance.attach({
      ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
      Presence3DManagerService: Presence3DManager,
      config: MOCK_CONFIG,
      eventBus: EVENT_BUS_MOCK,
      connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
      useStore,
    });

    VideoConferenceInstance['start']();
    expect(VideoConferenceInstance['videoConfig'].canUseDefaultAvatars).toBeFalsy();
  });

  test('should subscribe from video events', () => {
    expect(VIDEO_MANAGER_MOCK.meetingStateObserver.subscribe).toHaveBeenCalled();
    expect(VIDEO_MANAGER_MOCK.frameStateObserver.subscribe).toHaveBeenCalled();
    expect(VIDEO_MANAGER_MOCK.realtimeEventsObserver.subscribe).toHaveBeenCalled();
    expect(VIDEO_MANAGER_MOCK.participantJoinedObserver.subscribe).toHaveBeenCalled();
    expect(VIDEO_MANAGER_MOCK.participantLeftObserver.subscribe).toHaveBeenCalled();
  });

  describe('host handler', () => {
    test('should set as host the first participant that joins the room and type is host', () => {
      const participant: Participant[] = [
        {
          timestamp: 0,
          id: MOCK_LOCAL_PARTICIPANT.id,
          name: MOCK_LOCAL_PARTICIPANT.name,
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      ];

      const fn = jest.fn();

      VideoConferenceInstance['useStore'] = jest.fn().mockReturnValue({
        participants: {
          value: {
            [MOCK_LOCAL_PARTICIPANT.id]: {
              ...participant[0],
              type: ParticipantType.HOST,
            },
          },
        },
        hostId: {
          value: '',
          publish: fn,
        },
      });

      VideoConferenceInstance['roomState']['setHost'] = fn;
      VideoConferenceInstance['onParticipantListUpdate']({
        [MOCK_LOCAL_PARTICIPANT.id]: {
          ...participant[0],
        },
      });

      expect(fn).toHaveBeenCalledWith(MOCK_LOCAL_PARTICIPANT.id);
      expect(fn).toHaveBeenCalledWith(MOCK_LOCAL_PARTICIPANT.id);
    });

    test('should keep the host if it is already set and stays in the room', () => {
      const originalList: Record<string, Participant> = {
        [MOCK_LOCAL_PARTICIPANT.id]: {
          timestamp: 0,
          id: MOCK_LOCAL_PARTICIPANT.id,
          name: MOCK_LOCAL_PARTICIPANT.name,
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      };

      VideoConferenceInstance['roomState'].setHost = jest.fn();
      VideoConferenceInstance['onParticipantListUpdate'](originalList);

      const secondList: Participant[] = [
        {
          timestamp: 1,
          id: 'second-id',
          name: 'second name',
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      ];

      const { participants } = VideoConferenceInstance['useStore'](StoreType.GLOBAL);
      participants.publish({
        [MOCK_LOCAL_PARTICIPANT.id]: {
          ...originalList[0],
        },
        'second-id': {
          ...secondList[0],
        },
      });

      VideoConferenceInstance['participantsOnMeeting'] = [secondList[MOCK_LOCAL_PARTICIPANT.id]];

      VideoConferenceInstance['onRealtimeParticipantsDidChange'](secondList);

      expect(VideoConferenceInstance['roomState'].setHost).toHaveBeenCalledTimes(0);
    });

    test('should not set host if the participant is not me', () => {
      const participant: Participant[] = [
        {
          timestamp: 0,
          id: 'another-client-id',
          name: 'another name',
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      ];

      VideoConferenceInstance['roomState'].setHost = jest.fn();
      VideoConferenceInstance['onRealtimeParticipantsDidChange'](participant);

      VideoConferenceInstance['useStore'](StoreType.GLOBAL).participants.publish({
        [MOCK_LOCAL_PARTICIPANT.id]: { ...MOCK_LOCAL_PARTICIPANT },
      });

      expect(VideoConferenceInstance['roomState'].setHost).not.toBeCalled();
    });

    test('should init the timer to kick participants if the host leaves', () => {
      VideoConferenceInstance['participantsTypes'] = {};
      VideoConferenceInstance['localParticipant'] = {
        ...MOCK_LOCAL_PARTICIPANT,
        type: ParticipantType.GUEST,
      };
      VideoConferenceInstance['kickParticipantsOnHostLeave'] = true;
      VideoConferenceInstance['useStore'] = jest.fn().mockReturnValue({
        participants: {
          value: {
            [MOCK_LOCAL_PARTICIPANT.id]: VideoConferenceInstance['localParticipant'],
          },
        },
        destroy: jest.fn(),
      });
      VideoConferenceInstance['validateIfInTheRoomHasHost']();

      jest.advanceTimersByTime(3000 * 60);

      // check if the participant is kicked
      expect(VideoConferenceInstance['kickParticipantsOnHostLeave']).toBe(false);
      expect(VideoConferenceInstance['isAttached']).toBe(false);
    });

    test('should clear the timer to kick participants if in the room has host candidates', () => {
      VideoConferenceInstance['onParticipantJoined']({
        ...MOCK_LOCAL_PARTICIPANT,
        type: ParticipantType.GUEST,
      });

      expect(VideoConferenceInstance['kickParticipantsOnHostLeave']).toBe(true);

      const host: Participant[] = [
        {
          timestamp: 0,
          id: MOCK_LOCAL_PARTICIPANT.id,
          name: MOCK_LOCAL_PARTICIPANT.name,
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      ];

      VideoConferenceInstance['onRealtimeParticipantsDidChange'](host);

      jest.advanceTimersByTime(1000 * 60);

      expect(VideoConferenceInstance['kickParticipantsOnHostLeave']).toBe(true);
    });
  });

  describe('detach', () => {
    beforeEach(() => {
      VideoConferenceInstance.detach();
    });

    test('should unsubscribe from video events', () => {
      expect(VIDEO_MANAGER_MOCK.meetingStateObserver.unsubscribe).toHaveBeenCalled();
      expect(VIDEO_MANAGER_MOCK.frameStateObserver.unsubscribe).toHaveBeenCalled();
      expect(VIDEO_MANAGER_MOCK.realtimeEventsObserver.unsubscribe).toHaveBeenCalled();
      expect(VIDEO_MANAGER_MOCK.participantJoinedObserver.unsubscribe).toHaveBeenCalled();
      expect(VIDEO_MANAGER_MOCK.participantLeftObserver.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('connection events', () => {
    test('should freeze sync if the connection status is bad', () => {
      VideoConferenceInstance['roomState'].freezeSync = jest.fn();
      VideoConferenceInstance['onConnectionStatusChange'](MeetingConnectionStatus.BAD);

      expect(VideoConferenceInstance['roomState'].freezeSync).toHaveBeenCalledWith(true);
    });

    test('should enable sync if the connection status becomes good', () => {
      VideoConferenceInstance['roomState'].freezeSync = jest.fn();
      VideoConferenceInstance['connectionService'].oldConnectionStatus =
        MeetingConnectionStatus.BAD;

      VideoConferenceInstance['onConnectionStatusChange'](MeetingConnectionStatus.GOOD);

      expect(VideoConferenceInstance['roomState'].freezeSync).toHaveBeenCalledWith(false);
    });
  });

  describe('video events', () => {
    test('should initialize video when frame is initialized', () => {
      VideoConferenceInstance['onFrameStateChange'](VideoFrameState.INITIALIZED);

      expect(VIDEO_MANAGER_MOCK.start).toHaveBeenCalledWith({
        participant: VideoConferenceInstance['localParticipant'],
        group: VideoConferenceInstance['group'],
        roomId: MOCK_CONFIG.roomId,
      });
    });

    test('should not initialize video when frame is not initialized', () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();

      VideoConferenceInstance['onFrameStateChange'](VideoFrameState.INITIALIZING);

      expect(VIDEO_MANAGER_MOCK.start).not.toHaveBeenCalled();
    });

    test('should change host from video frame', () => {
      VideoConferenceInstance['roomState'].setHost = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_HOST_CHANGE,
        data: MOCK_LOCAL_PARTICIPANT.id,
      });

      expect(VideoConferenceInstance['roomState'].setHost).toHaveBeenCalledWith(
        MOCK_LOCAL_PARTICIPANT.id,
      );
    });

    test('should change grid mode from video frame', () => {
      VideoConferenceInstance['roomState'].setGridMode = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_GRID_MODE_CHANGE,
        data: true,
      });

      expect(VideoConferenceInstance['roomState'].setGridMode).toHaveBeenCalledWith(true);
    });

    test('should set gather from video frame', () => {
      VideoConferenceInstance['roomState'].setGather = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_GATHER,
        data: true,
      });

      expect(VideoConferenceInstance['roomState'].setGather).toHaveBeenCalledWith(true);
    });

    test('should set go to from video frame', () => {
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_GO_TO_PARTICIPANT,
        data: MOCK_LOCAL_PARTICIPANT.id,
      });

      expect(EVENT_BUS_MOCK.publish).toHaveBeenCalledWith(
        RealtimeEvent.REALTIME_GO_TO_PARTICIPANT,
        MOCK_LOCAL_PARTICIPANT.id,
      );
    });

    test('should set draw data from video frame', () => {
      VideoConferenceInstance['roomState'].setDrawing = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_DRAWING_CHANGE,
        data: MOCK_DRAW_DATA,
      });

      expect(VideoConferenceInstance['roomState'].setDrawing).toHaveBeenCalledWith(MOCK_DRAW_DATA);
    });

    test('should set follow participant from video frame', () => {
      VideoConferenceInstance['roomState'].setFollowParticipant = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
        data: MOCK_LOCAL_PARTICIPANT.id,
      });

      expect(VideoConferenceInstance['roomState'].setFollowParticipant).toHaveBeenCalledWith(
        MOCK_LOCAL_PARTICIPANT.id,
      );
    });

    test('should set participant to be kicked', () => {
      VideoConferenceInstance['roomState'].setKickParticipant = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: MeetingEvent.MEETING_KICK_PARTICIPANT,
        data: MOCK_LOCAL_PARTICIPANT.id,
      });

      expect(VideoConferenceInstance['roomState'].setKickParticipant).toHaveBeenCalledWith(
        MOCK_LOCAL_PARTICIPANT.id,
      );
    });

    test('should set transcript state', () => {
      VideoConferenceInstance['roomState'].setTranscript = jest.fn();
      VideoConferenceInstance['onRealtimeEventFromFrame']({
        event: RealtimeEvent.REALTIME_TRANSCRIPT_CHANGE,
        data: TranscriptState.TRANSCRIPT_START,
      });

      expect(VideoConferenceInstance['roomState'].setTranscript).toHaveBeenCalledWith(
        TranscriptState.TRANSCRIPT_START,
      );
    });

    test('should update participant properties from video frame', () => {
      const participant = {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'John Doe',
        type: ParticipantType.HOST,
      };

      VideoConferenceInstance['roomState'].updateMyProperties = jest.fn();
      VideoConferenceInstance['onParticipantJoined'](participant);

      expect(VideoConferenceInstance['roomState'].updateMyProperties).toHaveBeenCalledWith({
        name: 'John Doe',
        type: ParticipantType.HOST,
        joinedMeeting: true,
      });
    });

    test('should update participant avatar if it is not set and video frame has default avatars', () => {
      const participant = {
        ...MOCK_LOCAL_PARTICIPANT,
        name: 'John Doe',
        avatar: MOCK_AVATAR,
        type: ParticipantType.HOST,
      };

      VideoConferenceInstance['roomState'].updateMyProperties = jest.fn();
      VideoConferenceInstance['videoConfig'].canUseDefaultAvatars = true;
      VideoConferenceInstance['onParticipantJoined'](participant);

      expect(VideoConferenceInstance['roomState'].updateMyProperties).toHaveBeenCalledWith({
        name: 'John Doe',
        avatar: MOCK_AVATAR,
        type: ParticipantType.HOST,
        joinedMeeting: true,
      });
    });

    test('should publish message to client when my participant left', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      VideoConferenceInstance['localParticipant'] = MOCK_LOCAL_PARTICIPANT;

      VideoConferenceInstance['onParticipantLeft'](MOCK_LOCAL_PARTICIPANT);
      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MY_PARTICIPANT_LEFT,
        { ...MOCK_LOCAL_PARTICIPANT, type: ParticipantType.HOST },
      );
    });

    test('should publish message to client when meeting state changed', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      VideoConferenceInstance['onMeetingStateChange'](MeetingState.MEETING_CONNECTED);

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_STATE_UPDATE,
        MeetingState.MEETING_CONNECTED,
      );
    });

    test('should publish message to client and detach when same account error happened', () => {
      VideoConferenceInstance['publish'] = jest.fn();
      VideoConferenceInstance['roomState'].destroy = jest.fn();

      VideoConferenceInstance['onSameAccountError']('same-account-error');

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_SAME_PARTICIPANT_ERROR,
        'same-account-error',
      );
      expect(VideoConferenceInstance['roomState'].destroy).toHaveBeenCalledWith();
    });

    test('should publish a message to client when devices change', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      VideoConferenceInstance['onDevicesChange'](DeviceEvent.DEVICES_BLOCKED);

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_DEVICES_CHANGE,
        DeviceEvent.DEVICES_BLOCKED,
      );
    });

    test('should publish a message to client when waiting for host', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      VideoConferenceInstance['onWaitingForHost'](true);

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_WAITING_FOR_HOST,
        true,
      );
    });

    test('should publish a message to client when frame size change', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      VideoConferenceInstance['onFrameSizeDidChange']({
        height: 100,
        width: 100,
      });

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        FrameEvent.FRAME_DIMENSIONS_UPDATE,
        {
          height: 100,
          width: 100,
        },
      );
    });

    test('should update participant list', () => {
      const { participants } = VideoConferenceInstance['useStore'](StoreType.GLOBAL);
      participants.publish({
        [MOCK_LOCAL_PARTICIPANT.id]: {
          ...MOCK_LOCAL_PARTICIPANT,
        },
      });

      const participantInfoList: VideoParticipant[] = [
        {
          id: participants.value[MOCK_LOCAL_PARTICIPANT.id].id,
          avatar: participants.value[MOCK_LOCAL_PARTICIPANT.id].avatar,
          name: participants.value[MOCK_LOCAL_PARTICIPANT.id].name,
          type: participants.value[MOCK_LOCAL_PARTICIPANT.id].type,
          isHost: participants.value[MOCK_LOCAL_PARTICIPANT.id].isHost ?? false,
          slot: participants.value[MOCK_LOCAL_PARTICIPANT.id].slot,
          timestamp: participants.value[MOCK_LOCAL_PARTICIPANT.id].timestamp,
          color: MEETING_COLORS.turquoise,
        },
      ];

      VideoConferenceInstance['participantsOnMeeting'] = [];
      VideoConferenceInstance['publish'] = jest.fn();
      VideoConferenceInstance['onParticipantListUpdate']({
        [MOCK_LOCAL_PARTICIPANT.id]: {
          ...participants.value[MOCK_LOCAL_PARTICIPANT.id],
        },
      });

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_PARTICIPANT_LIST_UPDATE,
        participantInfoList,
      );

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_PARTICIPANT_AMOUNT_UPDATE,
        Object.values(participants.value).length,
      );
    });

    test('should not update participant list if new list is equal to old list', () => {
      const participants: Record<string, Participant> = {
        [MOCK_LOCAL_PARTICIPANT.id]: {
          timestamp: 0,
          id: 'another-client-id',
          name: 'another name',
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.GUEST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      };

      VideoConferenceInstance['participantsOnMeeting'] = [];

      VideoConferenceInstance['publish'] = jest.fn();
      VideoConferenceInstance['onHostAvailabilityChange'] = jest.fn();

      VideoConferenceInstance['onParticipantListUpdate']({
        [MOCK_LOCAL_PARTICIPANT.id]: {
          ...participants[MOCK_LOCAL_PARTICIPANT.id],
          timestamp: 0,
          color: MEETING_COLORS.turquoise,
        },
      });
      VideoConferenceInstance['onParticipantListUpdate']({
        [MOCK_LOCAL_PARTICIPANT.id]: {
          ...participants[MOCK_LOCAL_PARTICIPANT.id],
          timestamp: 0,
          color: MEETING_COLORS.turquoise,
        },
      });

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledTimes(3);
    });
  });

  describe('realtime events', () => {
    test('should update host', () => {
      VIDEO_MANAGER_MOCK.publishMessageToFrame = jest.fn();
      const { hostId } = VideoConferenceInstance['useStore'](StoreType.VIDEO);
      hostId.publish('new-host');

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        RealtimeEvent.REALTIME_HOST_CHANGE,
        'new-host',
      );
    });

    test('should update participants', () => {
      const participant: Participant[] = [
        {
          timestamp: 0,
          id: MOCK_LOCAL_PARTICIPANT.id,
          name: MOCK_LOCAL_PARTICIPANT.name,
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      ];

      VideoConferenceInstance['onRealtimeParticipantsDidChange'](participant);

      const expectedParticipants: ParticipantToFrame = {
        timestamp: 0,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        isHost: true,
        avatar: MOCK_AVATAR,
        type: ParticipantType.HOST,
        participantId: MOCK_LOCAL_PARTICIPANT.id,
        color: MEETING_COLORS.turquoise,
        id: MOCK_LOCAL_PARTICIPANT.id,
        slot: {
          colorName: 'turquoise',
          index: 0,
          color: MEETING_COLORS.turquoise,
          textColor: '#fff',
          timestamp: 0,
        },
      };

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        RealtimeEvent.REALTIME_PARTICIPANT_LIST_UPDATE,
        [expectedParticipants],
      );
    });

    test('should publish message to client when participant joined', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      const presenceParticipant: PresenceEvent<Participant> = {
        connectionId: 'connection1',
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        timestamp: 0,
        data: {
          id: MOCK_LOCAL_PARTICIPANT.id,
          name: MOCK_LOCAL_PARTICIPANT.name,
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      };

      VideoConferenceInstance['onParticipantJoinedOnRealtime'](presenceParticipant);

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_PARTICIPANT_JOINED,
        VideoConferenceInstance['createParticipantFromPresence'](presenceParticipant),
      );
    });

    test('should publish message to client when participant left', () => {
      VideoConferenceInstance['publish'] = jest.fn();

      const presenceParticipant: PresenceEvent<Participant> = {
        connectionId: 'connection1',
        id: MOCK_LOCAL_PARTICIPANT.id,
        name: MOCK_LOCAL_PARTICIPANT.name as string,
        timestamp: 0,
        data: {
          id: MOCK_LOCAL_PARTICIPANT.id,
          name: MOCK_LOCAL_PARTICIPANT.name,
          isHost: true,
          avatar: MOCK_AVATAR,
          type: ParticipantType.HOST,
          slot: {
            colorName: 'turquoise',
            index: 0,
            color: MEETING_COLORS.turquoise,
            textColor: '#fff',
            timestamp: 0,
          },
        },
      };

      VideoConferenceInstance['onParticipantLeftOnRealtime'](presenceParticipant);

      expect(VideoConferenceInstance['publish']).toHaveBeenCalledWith(
        MeetingEvent.MEETING_PARTICIPANT_LEFT,
        VideoConferenceInstance['createParticipantFromPresence'](presenceParticipant),
      );
    });

    test('should publish a message to client and detach when kick local participant happend', () => {
      VideoConferenceInstance['roomState'].destroy = jest.fn();
      VideoConferenceInstance['onKickLocalParticipant']();

      expect(VideoConferenceInstance['roomState'].destroy).toHaveBeenCalledWith();
    });
  });

  describe('toolbar controls', () => {
    test('should toggle chat', () => {
      VideoConferenceInstance['toggleChat']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.TOGGLE_MEETING_CHAT,
      );
    });

    test('should toggle meeting setup', () => {
      VideoConferenceInstance['toggleMeetingSetup']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.TOGGLE_MEETING_SETUP,
      );
    });

    test('should toggle user`s cam', () => {
      VideoConferenceInstance['toggleCam']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.TOGGLE_CAM,
      );
    });

    test('should toggle user`s mic', () => {
      VideoConferenceInstance['toggleMicrophone']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.TOGGLE_MICROPHONE,
      );
    });

    test('should toggle screenshare', () => {
      VideoConferenceInstance['toggleScreenShare']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.TOGGLE_SCREENSHARE,
      );
    });

    test('should toggle transcript', () => {
      VideoConferenceInstance['toggleRecording']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.TOGGLE_RECORDING,
      );
    });

    test('should hang up', () => {
      VideoConferenceInstance['hangUp']();

      expect(VIDEO_MANAGER_MOCK.publishMessageToFrame).toHaveBeenCalledWith(
        MeetingControlsEvent.HANG_UP,
      );
    });
  });
});
