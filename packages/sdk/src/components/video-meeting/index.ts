import { ParticipantType } from '../../common/types/participant.types';
import config from '../../services/config';
import VideoConfereceManager from '../../services/video-conference-manager';
import { CamerasPosition, LayoutMode, LayoutPosition, VideoManagerOptions } from '../../services/video-conference-manager/types';
import { VideoComponent } from '../video';

export class VideoMeeting extends VideoComponent {
  protected allowGuests: boolean;
  protected userType: ParticipantType | `${ParticipantType}`;

  constructor() {
    super();

    this.allowGuests = false;
    this.userType = 'host';
  }

  protected startVideo = (): void => {
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

    this.videoConfig = options;
    this.logger.log('video meeting @ start video', this.videoConfig);
    this.videoManager = new VideoConfereceManager(options);
  };
}
