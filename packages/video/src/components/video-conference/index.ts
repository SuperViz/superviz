import { ParticipantType } from '../../common/types/participant.types';
import { Logger } from '../../common/utils/logger';
import { RemoteConfigService } from '../../services/remote-config';
import { EnvironmentTypes } from '../../services/remote-config/types';
import { CamerasPosition, LayoutMode, LayoutPosition, VideoFrameState, VideoManagerOptions } from '../../services/video-manager/types';
import { BaseComponent } from '../base';

import { VideoConferenceProps } from './types';

export class VideoConference extends BaseComponent {
  private config: VideoConferenceProps;

  protected logger: Logger;
  protected videoManagerConfig: VideoManagerOptions;

  constructor(props?: VideoConferenceProps) {
    super();
    this.logger = new Logger('@superviz/video/video-conference');
    this.setup(props);
  }

  private setup(props: VideoConferenceProps) {
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
      brand: props?.brand || { logoUrl: undefined, styles: undefined },
      participantType: props?.participantType || 'guest',
      i18n: props?.i18n || { language: 'en', locales: [] },
      permissions: {
        toggleCamera: props?.permissions?.toggleCamera || true,
        toggleMic: props?.permissions?.toggleMic || true,
        toggleChat: props?.permissions?.toggleChat || true,
        toggleParticipantList: props?.permissions?.toggleParticipantList || true,
        toggleRecording: props?.permissions?.toggleRecording || false,
        toggleScreenShare: props?.permissions?.toggleScreenShare || true,
        allowGuests: props?.permissions?.allowGuests || false,
      },
    };

    this.kickParticipantsOnHostLeave = !this.config.permissions.allowGuests;
    this.participantType = this.config.participantType as ParticipantType;
  }

  protected async start() {
    const { conferenceLayerUrl } = await RemoteConfigService.getRemoteConfig(
      this.globalConfig.environment as EnvironmentTypes,
    );

    this.videoManagerConfig = {
      provider: 'video-package',
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
      language: this.config.i18n?.language,
      locales: this.config.i18n?.locales,
      avatars: [],
      waterMark: this.globalConfig.waterMark,
      styles: this.config?.brand?.styles,
      collaborationMode: false,
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.GRID,
      callbacks: undefined,
    };

    this.startVideoManager();
  }

  protected destroy() {}
}
