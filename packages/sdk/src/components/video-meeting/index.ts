import { ParticipantType } from '../../common/types/participant.types';
import config from '../../services/config';
import VideoConfereceManager from '../../services/video-conference-manager';
import { CamerasPosition, LayoutMode, LayoutPosition, VideoManagerOptions } from '../../services/video-conference-manager/types';
import { VideoComponent } from '../video';

import { VideoMeetingParams } from './types';

export class VideoMeeting extends VideoComponent {
  protected allowGuests: boolean;
  protected userType: ParticipantType | `${ParticipantType}`;

  constructor(private params?: VideoMeetingParams) {
    super();

    this.allowGuests = params?.permissions?.allowGuests ?? false;
    this.userType = params?.participantType ?? ParticipantType.GUEST;
  }

  protected startVideo = (): void => {
    const options: VideoManagerOptions = {
      canUseChat: this.params?.permissions?.toggleChat ?? true,
      canUseCams: this.params.permissions?.toggleCamera ?? true,
      canShowAudienceList: this.params.permissions?.toggleParticipantList ?? true,
      canUseRecording: this.params.permissions?.toggleRecording ?? true,
      canUseScreenshare: this.params.permissions?.toggleScreenShare ?? true,
      devices: {
        audioInput: this.params.permissions.toggleMic ?? true,
        audioOutput: true,
        videoInput: true,
      },
      language: this.params?.i18n?.language,
      locales: this.params?.i18n?.locales ?? [],
      styles: this.params.styles,
      callbacks: this.params.callbacks,
      canUseDefaultAvatars: false,
      canUseGather: false,
      canUseFollow: false,
      canUseGoTo: false,
      canUseDefaultToolbar: true,
      collaborationMode: false,
      skipMeetingSettings: false,
      camerasPosition: CamerasPosition.LEFT,
      waterMark: config.get<boolean>('waterMark'),
      layoutPosition: LayoutPosition.CENTER,
      layoutMode: LayoutMode.GRID,
      browserService: this.browserService,
      avatars: [],
      offset: undefined,
    };

    this.videoConfig = options;
    this.logger.log('video meeting @ start video', this.videoConfig);
    this.videoManager = new VideoConfereceManager(options);
  };
}
