import { MOCK_CONFIG } from '../../../__mocks__/config.mock';
import { EVENT_BUS_MOCK } from '../../../__mocks__/event-bus.mock';
import { LIMITS_MOCK } from '../../../__mocks__/limits.mock';
import { MOCK_LOCAL_PARTICIPANT } from '../../../__mocks__/participants.mock';
import { MeetingEvent } from '../../common/types/events.types';
import { useStore } from '../../common/utils/use-store';
import { IOC } from '../../services/io';
import { Presence3DManager } from '../../services/presence-3d-manager';
import { VideoFrameState } from '../../services/video-conference-manager/types';

import { VideoMeeting } from '.';

describe('Video Meeting', () => {
  let VideoMeetingInstance: VideoMeeting;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    VideoMeetingInstance = new VideoMeeting();

    VideoMeetingInstance.attach({
      ioc: new IOC(MOCK_LOCAL_PARTICIPANT),
      config: MOCK_CONFIG,
      eventBus: EVENT_BUS_MOCK,
      Presence3DManagerService: Presence3DManager,
      connectionLimit: LIMITS_MOCK.videoConference.maxParticipants,
      useStore,
    });

    VideoMeetingInstance['start']();
    VideoMeetingInstance['startVideoConferenceManager']();
    VideoMeetingInstance['videoManager']['onFrameLoad']();
    VideoMeetingInstance['onFrameStateChange'](VideoFrameState.INITIALIZED);
  });

  test('should initialize the services', () => {
    expect(VideoMeetingInstance['browserService']).not.toBe(undefined);
    expect(VideoMeetingInstance['connectionService']).not.toBe(undefined);
    expect(VideoMeetingInstance['videoManager']).not.toBe(undefined);
  });

  test('should destroy all services', () => {
    const spyPublish = jest.spyOn(VideoMeetingInstance, 'publish' as any);
    const spyUnsubscribeToVideoUpdates = jest.spyOn(VideoMeetingInstance, 'unsubscribeToVideoUpdates' as any);
    const spyUnsubscribeToStoreUpdates = jest.spyOn(VideoMeetingInstance, 'unsubscribeToStoreUpdates' as any);
    const spyUnsusbscribeToRealtimeUpdates = jest.spyOn(VideoMeetingInstance, 'unsusbscribeToRealtimeUpdates' as any);

    const spyVideoManagerLeave = jest.spyOn(VideoMeetingInstance['videoManager'], 'leave');

    VideoMeetingInstance['destroy']();

    expect(VideoMeetingInstance['browserService']).toBe(undefined);
    expect(VideoMeetingInstance['connectionService']).toBe(undefined);
    expect(VideoMeetingInstance['videoManager']).toBe(undefined);
    expect(spyVideoManagerLeave).toHaveBeenCalled();
    expect(spyUnsubscribeToVideoUpdates).toHaveBeenCalled();
    expect(spyUnsubscribeToStoreUpdates).toHaveBeenCalled();
    expect(spyUnsusbscribeToRealtimeUpdates).toHaveBeenCalled();
    expect(spyPublish).toHaveBeenCalledWith(MeetingEvent.DESTROY);
  });
});
