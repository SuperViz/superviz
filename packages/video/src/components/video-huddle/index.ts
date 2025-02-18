import { RealtimeEvent } from '../../common/types/events.types';
import { ParticipantType } from '../../common/types/participant.types';
import { Logger } from '../../common/utils/logger';
import { RemoteConfigService } from '../../services/remote-config';
import { EnvironmentTypes } from '../../services/remote-config/types';
import { CamerasPosition, LayoutMode, LayoutPosition, RealtimeObserverPayload, VideoFrameState, VideoManagerOptions } from '../../services/video-manager/types';
import { BaseComponent } from '../base';

import { VideoHuddleProps } from './types';

export class VideoHuddle extends BaseComponent {
  private config: VideoHuddleProps;

  protected logger: Logger;
  protected videoManagerConfig: VideoManagerOptions;

  constructor(props?: VideoHuddleProps) {
    super();
    this.logger = new Logger('@superviz/video/video-conference');
    this.setup(props);
  }

  private setup(props: VideoHuddleProps) {
    if (props?.brand?.logoUrl) {
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlPattern.test(props.brand.logoUrl)) {
        console.error('[SuperViz] Invalid brand logo URL:', props.brand.logoUrl);
        throw new Error(`[SuperViz] Invalid brand logo URL: ${props.brand.logoUrl}`);
      }
    }

    if (props?.participantType && !['audience', 'host', 'guest'].includes(props?.participantType)) {
      console.error('[SuperViz] Invalid participant type:', props.participantType);
      throw new Error(`[SuperViz] Invalid participant type: ${props.participantType}`);
    }

    this.config = {
      brand: props?.brand ?? { logoUrl: undefined, styles: undefined },
      participantType: props?.participantType ?? 'guest',
      i18n: props?.i18n ?? { language: 'en', locales: [] },
      permissions: {
        toggleCamera: props?.permissions?.toggleCamera ?? true,
        toggleMic: props?.permissions?.toggleMic ?? true,
        toggleChat: props?.permissions?.toggleChat ?? true,
        toggleParticipantList: props?.permissions?.toggleParticipantList ?? true,
        toggleRecording: props?.permissions?.toggleRecording ?? false,
        toggleScreenShare: props?.permissions?.toggleScreenShare ?? true,
        enableFollow: props?.permissions?.enableFollow ?? true,
        enableGoTo: props?.permissions?.enableGoTo ?? true,
        enableGather: props?.permissions?.enableGather ?? true,
        allowGuests: props?.permissions?.allowGuests ?? false,
        enableDefaultAvatars: props?.permissions?.enableDefaultAvatars ?? false,
      },
      offset: props?.offset ?? {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
      },
      camerasPosition: props?.camerasPosition ?? CamerasPosition.RIGHT,
      avatars: props?.avatars ?? [],
    };

    this.kickParticipantsOnHostLeave = !this.config.permissions.allowGuests;
    this.participantType = this.config.participantType as ParticipantType;
  }

  protected async start() {
    const { conferenceLayerUrl } = await RemoteConfigService.getRemoteConfig(
      this.globalConfig.environment as EnvironmentTypes,
    );

    this.videoManagerConfig = {
      // NOTE: this is temporary, we need to implement the new UI for the video huddle
      provider: 'sdk-package',
      conferenceLayerUrl,
      group: this.globalConfig.group,
      apiKey: this.globalConfig.apiKey,
      apiUrl: this.globalConfig.apiUrl,
      debug: this.globalConfig.debug,
      limits: this.globalConfig.limits,
      roomId: this.globalConfig.roomId,
      canUseRecording: this.config.permissions.toggleRecording,
      canShowAudienceList: true,
      canUseChat: this.config.permissions.toggleChat,
      canUseCams: this.config.permissions.toggleCamera,
      canUseScreenshare: this.config.permissions.toggleScreenShare,
      canUseDefaultAvatars: this.config.permissions.enableDefaultAvatars,
      canUseGather: this.config.permissions.enableGather,
      canUseFollow: this.config.permissions.enableFollow,
      canUseGoTo: this.config.permissions.enableGoTo,
      canUseDefaultToolbar: true,
      camerasPosition: this.config.camerasPosition as CamerasPosition,
      canUseParticipantList: this.config.permissions.toggleParticipantList,
      devices: {
        audioInput: this.config.permissions.toggleMic,
        audioOutput: true,
        videoInput: true,
      },
      skipMeetingSettings: false,
      offset: this.config.offset,
      language: this.config.i18n?.language,
      locales: this.config.i18n?.locales,
      avatars: this.config.avatars,
      waterMark: this.globalConfig.waterMark,
      styles: this.config?.brand?.styles,
      collaborationMode: true,
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.LIST,
      callbacks: undefined,
    };

    this.startVideoManager();
    this.subscribeToParticularVideoManagerEvents();
    this.subscribeToParticularStateObservers();
    this.subscribeToParticularRealtimeEvents();
  }

  protected destroy() {
    this.unsubscribeToParticularVideoManagerEvents();
    this.unsubscribeToParticularRealtimeEvents();
  }

  /**
   * Video Manager events
   */

  private subscribeToParticularVideoManagerEvents() {
    this.videoManager.realtimeEventsObserver.subscribe(this.onRealtimeEventFromVideoManager);
  }

  private unsubscribeToParticularVideoManagerEvents() {
    this.videoManager.realtimeEventsObserver.unsubscribe(this.onRealtimeEventFromVideoManager);
  }

  private onRealtimeEventFromVideoManager = ({ event, data }: RealtimeObserverPayload): void => {
    this.logger.log('video conference @ on realtime event from frame', event, data);

    const map = {
      [RealtimeEvent.REALTIME_GATHER]: (participantId: boolean) => {
        this.room.emit(RealtimeEvent.REALTIME_GATHER, participantId);
      },
      [RealtimeEvent.REALTIME_GRID_MODE_CHANGE]: (isGrid: boolean) => {
        this.roomState.update({ cameraMode: isGrid ? LayoutMode.GRID : LayoutMode.LIST });
      },
      [RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT]: (followParticipantId: string) => {
        this.roomState.update({ followParticipantId });
      },
      [RealtimeEvent.REALTIME_GO_TO_PARTICIPANT]: (data: string) => {
        this.eventBus.publish(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, data);
      },
    };

    if (!map[event]) return;

    map[event](data);
  };

  /**
   * State observers
   */

  private subscribeToParticularStateObservers() {
    this.roomState?.followObserver.subscribe((followParticipantId) => {
      this.videoManager?.publishMessageToFrame(
        RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
        followParticipantId,
      );

      this.eventBus.publish(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, followParticipantId);
    });

    this.roomState?.cameraModeObserver?.subscribe((mode) => {
      this.videoManager?.publishMessageToFrame(
        RealtimeEvent.REALTIME_GRID_MODE_CHANGE,
        mode === LayoutMode.GRID,
      );
    });
  }

  /**
   * Realtime Events
   */

  private subscribeToParticularRealtimeEvents = () => {
    this.room.on(RealtimeEvent.REALTIME_GATHER, this.onGather);
  };

  private unsubscribeToParticularRealtimeEvents = () => {
    this.room.off(RealtimeEvent.REALTIME_GATHER, this.onGather);
  };

  private onGather = () => {
    if (!this.roomState?.state?.hostId) return;

    if (this.roomState?.state?.hostId !== this.localParticipant.id) {
      this.eventBus.publish(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.roomState?.state?.hostId);
      return;
    }

    this.videoManager.publishMessageToFrame(RealtimeEvent.REALTIME_GATHER, true);
  };
}
