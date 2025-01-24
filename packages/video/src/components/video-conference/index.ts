import { Logger } from '../../common/utils/logger';
import { BaseComponent } from '../base';

import { VideoConferenceProps } from './types';

export class VideoConference extends BaseComponent {
  private config: VideoConferenceProps;
  private logger: Logger;

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

  protected start() {}
  protected destroy() {}
}
