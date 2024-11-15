import { ColorsVariables } from '../../common/types/colors.types';
import { ParticipantType } from '../../common/types/participant.types';
import config from '../../services/config';
import VideoConferecenManager from '../../services/video-conference-manager';
import { CamerasPosition, LayoutMode, LayoutPosition } from '../../services/video-conference-manager/types';
import { VideoComponent } from '../video';

import { VideoConferenceOptions } from './types';

export class VideoConference extends VideoComponent {
  private params: VideoConferenceOptions;
  protected allowGuests: boolean;
  protected userType: ParticipantType | `${ParticipantType}`;

  constructor(params: VideoConferenceOptions) {
    super();

    this.params = params;

    this.userType = params?.participantType ?? params?.userType ?? ParticipantType.GUEST;
    this.allowGuests = params.allowGuests ?? false;
  }

  /**
   * @function startVideo
   * @description start video manager
   * @returns {void}
   */
  protected startVideo = (): void => {
    const defaultAvatars =
      this.userType !== ParticipantType.AUDIENCE && this.params?.defaultAvatars === true;

    this.videoConfig = {
      language: this.params?.language,
      canUseRecording: !!this.params?.enableRecording,
      canShowAudienceList: this.params?.showAudienceList ?? true,
      canUseChat: !this.params?.chatOff,
      canUseCams: !this.params?.camsOff,
      canUseScreenshare: !this.params?.screenshareOff,
      canUseDefaultAvatars: defaultAvatars && !this.localParticipant?.avatar?.model3DUrl,
      canUseGather: !!this.params?.enableGather,
      canUseFollow: !!this.params?.enableFollow,
      canUseGoTo: !!this.params?.enableGoTo,
      canUseDefaultToolbar: this.params?.defaultToolbar ?? true,
      camerasPosition: this.params?.collaborationMode?.position as CamerasPosition,
      devices: this.params?.devices,
      skipMeetingSettings: this.params?.skipMeetingSettings,
      browserService: this.browserService,
      offset: this.params?.offset,
      locales: this.params?.locales ?? [],
      avatars: this.params?.avatars ?? [],
      customColors: config.get<ColorsVariables>('colors'),
      waterMark: config.get<boolean>('waterMark'),
      styles: this.params?.styles,
      collaborationMode: this.params?.collaborationMode?.enabled ?? true,
      layoutPosition:
        this.params?.collaborationMode?.enabled === false
          ? LayoutPosition.CENTER
          : (this.params?.collaborationMode?.modalPosition as LayoutPosition) ??
            LayoutPosition.CENTER,
      layoutMode: (this.params?.collaborationMode?.initialView as LayoutMode) ?? LayoutMode.LIST,
      callbacks: this.params?.callbacks,
    };

    this.logger.log('video conference @ start video', this.videoConfig);
    this.videoManager = new VideoConferecenManager(this.videoConfig);
  };
}
