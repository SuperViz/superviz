import { ParticipantType } from '../../common/types/participant.types';
import { Logger } from '../../common/utils/logger';
import VideoManager from '../../services/video-manager';
import { CamerasPosition, LayoutMode, LayoutPosition, VideoFrameState, VideoManagerOptions } from '../../services/video-manager/types';
import { BaseComponent } from '../base';

import { VideoConferenceProps } from './types';

export class VideoConference extends BaseComponent {
  private videoManager: VideoManager;
  private config: VideoConferenceProps;
  protected logger: Logger;

  constructor(props?: VideoConferenceProps) {
    super();
    this.logger = new Logger('@superviz/video/video-conference');
    this.validateProps(props);
  }

  private validateProps(props: VideoConferenceProps) {
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
      styles: props?.styles || '',
      brand: props?.brand || { logoUrl: undefined },
      participantType: props?.participantType || 'guest',
      permissions: {
        toggleCamera: props?.permissions?.toggleCamera || true,
        toggleMic: props?.permissions?.toggleMic || true,
        toggleChat: props?.permissions?.toggleChat || true,
        toggleParticipantList: props?.permissions?.toggleParticipantList || true,
        toggleRecording: props?.permissions?.toggleRecording || true,
        toggleScreenShare: props?.permissions?.toggleScreenShare || true,
      },
    };
  }

  protected start() {
    this.startVideo();
  }

  protected destroy() {}

  private startVideo() {
    const config: VideoManagerOptions = {
      group: this.globalConfig.group,
      apiKey: this.globalConfig.apiKey,
      apiUrl: this.globalConfig.apiUrl,
      conferenceLayerUrl: 'https://video-frame.superviz.com/lab/index.html',
      debug: this.globalConfig.debug,
      limits: this.globalConfig.limits,
      roomId: this.globalConfig.roomId,
      language: undefined,
      canUseRecording: this.config.permissions.toggleRecording,
      canShowAudienceList: true,
      canUseChat: this.config.permissions.toggleChat,
      canUseCams: this.config.permissions.toggleCamera,
      canUseScreenshare: this.config.permissions.toggleScreenShare,
      canUseDefaultAvatars: false,
      canUseGather: false,
      canUseFollow: false,
      canUseGoTo: false,
      canUseDefaultToolbar: true,
      camerasPosition: CamerasPosition.RIGHT,
      devices: {
        audioInput: true,
        audioOutput: true,
        videoInput: true,
      },
      skipMeetingSettings: false,
      offset: {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
      },
      locales: [],
      avatars: [],
      waterMark: this.globalConfig.waterMark,
      styles: this.config?.styles,
      collaborationMode: false,
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.GRID,
      callbacks: undefined,
    };

    this.videoManager = new VideoManager(config);
    this.videoManager.frameStateObserver.subscribe((state) => {
      if (state !== VideoFrameState.INITIALIZED) return;

      this.videoManager.start({
        participant: {
          ...this.localParticipant,
          type: ParticipantType.HOST,
        },
      });
    });
  }
}
