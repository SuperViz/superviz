import { MeetingEvent } from '../../common/types/events.types';
import { ParticipantType, VideoParticipant } from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { BrowserService } from '../../services/browser';
import config from '../../services/config';
import { ConnectionService } from '../../services/connection-status';
import VideoConfereceManager from '../../services/video-conference-manager';
import { CamerasPosition, LayoutMode, LayoutPosition, VideoFrameState, VideoManagerOptions } from '../../services/video-conference-manager/types';
import { BaseComponent } from '../base';
import { ComponentNames } from '../types';

export class VideoMeeting extends BaseComponent {
  public name: ComponentNames;
  protected logger: Logger;

  // services
  private videoManager: VideoConfereceManager;
  private connectionService: ConnectionService;
  private browserService: BrowserService;

  // data
  private localParticipant: VideoParticipant;

  constructor() {
    super();

    this.name = ComponentNames.VIDEO_CONFERENCE;
    this.logger = new Logger(`@superviz/sdk/${ComponentNames.VIDEO_CONFERENCE}`);

    this.browserService = new BrowserService();
    this.connectionService = new ConnectionService();
    this.connectionService.addListeners();
  }

  protected start() {
    this.subscribetToStoreUpdates();
    this.subscribeToRealtimeUpdates();

    this.startVideoConferenceManager();
  }

  protected destroy(): void {
    this.logger.log('video meeting @ destroy');

    this.unsubscribeToStoreUpdates();
    this.unsusbscribeToRealtimeUpdates();
    this.unsubscribeToVideoUpdates();

    this.browserService = undefined;

    this.videoManager?.leave();
    this.videoManager = undefined;

    this.connectionService?.removeListeners();
    this.connectionService = undefined;

    this.publish(MeetingEvent.DESTROY);
  }

  private startVideoConferenceManager() {
    const options: VideoManagerOptions = {
      canUseChat: true,
      canUseCams: true,
      canShowAudienceList: true,
      canUseRecording: true,
      canUseScreenshare: true,
      canUseDefaultAvatars: false,
      canUseGather: true,
      canUseFollow: true,
      canUseGoTo: true,
      canUseDefaultToolbar: true,
      collaborationMode: false,
      skipMeetingSettings: false,
      camerasPosition: CamerasPosition.LEFT,
      waterMark: config.get<boolean>('waterMark'),
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.GRID,
      devices: { audioInput: true, audioOutput: true, videoInput: true },
      browserService: this.browserService,
      locales: [],
      avatars: [],
      styles: undefined,
      offset: undefined,
      callbacks: undefined,
    };

    this.videoManager = new VideoConfereceManager(options);

    this.subscribeToVideoUpdates();
  }

  private subscribeToVideoUpdates() {
    this.logger.log('video conference @ subscribe to video events');
    this.videoManager.meetingConnectionObserver.subscribe(
      this.connectionService.updateMeetingConnectionStatus,
    );
    this.videoManager.participantListObserver.subscribe((data) => { console.log(data); });
    this.videoManager.waitingForHostObserver.subscribe((data) => { console.log(data); });
    this.videoManager.frameSizeObserver.subscribe((data) => { console.log(data); });
    this.videoManager.frameStateObserver.subscribe(this.onFrameStateChange);
    this.videoManager.meetingStateObserver.subscribe((data) => { console.log(data); });
    this.videoManager.realtimeEventsObserver.subscribe((data) => { console.log(data); });
    this.videoManager.participantJoinedObserver.subscribe((data) => { console.log(data); });
    this.videoManager.participantLeftObserver.subscribe((data) => { console.log(data); });
    this.videoManager.sameAccountErrorObserver.subscribe((data) => { console.log(data); });
    this.videoManager.devicesObserver.subscribe((data) => { console.log(data); });
  }

  private unsubscribeToVideoUpdates() {}

  private subscribeToRealtimeUpdates() {}
  private unsusbscribeToRealtimeUpdates() {}

  private subscribetToStoreUpdates() {
    const { localParticipant } = this.useStore(StoreType.GLOBAL);

    localParticipant.subscribe((participant) => {
      this.localParticipant = {
        ...this.localParticipant,
        ...participant,
        type: 'host',
      };
    });
  }

  private unsubscribeToStoreUpdates() {}

  // Video Listeners

  /**
   * @function onFrameStateChange
   * @description handler for frame state change event
   * @param {VideoFrameState} state - frame state
   * @returns
   */
  private onFrameStateChange = (state: VideoFrameState): void => {
    this.logger.log('video conference @ on frame state change', state);

    if (state !== VideoFrameState.INITIALIZED) return;

    this.videoManager.start({
      group: this.group,
      participant: this.localParticipant,
      roomId: config.get<string>('roomId'),
    });

    this.publish(MeetingEvent.MEETING_START);
  };
}
