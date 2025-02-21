import { ColorsVariables } from '../../common/types/colors.types';
import {
  DeviceEvent,
  MeetingConnectionStatus,
  MeetingEvent,
  MeetingState,
  RealtimeEvent,
  Dimensions,
  MeetingControlsEvent,
  FrameEvent,
  TranscriptState,
} from '../../common/types/events.types';
import { StartMeetingOptions } from '../../common/types/meeting.types';
import { Participant, Avatar } from '../../common/types/participant.types';
import { Logger, Observer } from '../../common/utils';
import { BrowserService } from '../browser';
import config from '../config';
import { FrameBricklayer } from '../frame-brick-layer';
import { ComponentLimits } from '../limits/types';
import { MessageBridge } from '../message-bridge';

import {
  DrawingData,
  VideoFrameState,
  VideoManagerOptions,
  Offset,
  FrameLocale,
  FrameConfig,
  LayoutPosition,
  CamerasPosition,
  LayoutModalsAndCameras,
} from './types';

const FRAME_ID = 'sv-video-frame';

export default class VideoConfereceManager {
  private readonly logger: Logger = new Logger('@superviz/sdk/video-conference-manager');
  private messageBridge: MessageBridge;
  private bricklayer: FrameBricklayer;
  private browserService: BrowserService;

  private frameOffset: Offset;
  private frameLocale: FrameLocale;

  private meetingAvatars: Avatar[];

  private readonly frameConfig: FrameConfig;
  private readonly customColors: ColorsVariables;
  private readonly styles: string;

  private readonly callbacks: Record<string, () => void>;
  public readonly frameStateObserver = new Observer({ logger: this.logger });
  public readonly frameSizeObserver = new Observer({ logger: this.logger });

  public readonly waitingForHostObserver = new Observer({ logger: this.logger });
  public readonly realtimeEventsObserver = new Observer({ logger: this.logger });

  public readonly sameAccountErrorObserver = new Observer({ logger: this.logger });
  public readonly devicesObserver = new Observer({ logger: this.logger });
  public readonly meetingStateObserver = new Observer({ logger: this.logger });
  public readonly meetingConnectionObserver = new Observer({ logger: this.logger });

  public readonly participantJoinedObserver = new Observer({ logger: this.logger });
  public readonly participantLeftObserver = new Observer({ logger: this.logger });
  public readonly participantListObserver = new Observer({ logger: this.logger });

  frameState = VideoFrameState.UNINITIALIZED;

  constructor(options: VideoManagerOptions) {
    const {
      language,
      canUseCams,
      canUseChat,
      canUseScreenshare,
      canUseDefaultAvatars,
      canUseFollow,
      canUseGoTo,
      canUseGather,
      canShowAudienceList,
      canUseDefaultToolbar,
      canUseRecording,
      browserService,
      offset,
      locales,
      avatars,
      customColors,
      styles,
      waterMark,
      layoutPosition,
      camerasPosition,
      skipMeetingSettings,
      devices,
      layoutMode,
      collaborationMode,
      callbacks,
    } = options;

    this.browserService = browserService;

    const positions = this.layoutModalsAndCamerasConfig(layoutPosition, camerasPosition);

    const wrapper = document.createElement('div');

    this.frameConfig = {
      provider: 'sdk-package',
      apiKey: config.get<string>('apiKey'),
      apiUrl: config.get<string>('apiUrl'),
      debug: config.get<boolean>('debug'),
      roomId: config.get<string>('roomId'),
      limits: config.get<ComponentLimits>('limits'),
      collaborationMode,
      canUseFollow,
      canUseGoTo,
      canUseCams,
      canUseChat,
      canUseGather,
      canUseScreenshare,
      canUseDefaultAvatars,
      canUseRecording,
      canShowAudienceList,
      camerasPosition: positions.camerasPosition ?? CamerasPosition.RIGHT,
      canUseDefaultToolbar,
      devices: {
        audioInput: devices?.audioInput ?? true,
        audioOutput: devices?.audioOutput ?? true,
        videoInput: devices?.videoInput ?? true,
      },
      waterMark,
      layoutMode,
      skipMeetingSettings,
      layoutPosition: positions.layoutPosition,
      transcriptLangs: config.get<string[]>('features.transcriptLangs'),
    };

    this.customColors = customColors;
    this.callbacks = callbacks;
    this.styles = styles;

    wrapper.classList.add('sv_video_wrapper');
    wrapper.id = 'sv-video-wrapper';

    document.body.appendChild(wrapper);

    this.updateFrameState(VideoFrameState.INITIALIZING);

    this.bricklayer = new FrameBricklayer();
    this.bricklayer.build(
      wrapper.id,
      config.get<string>('conferenceLayerUrl'),
      FRAME_ID,
      undefined,
      {
        allow: 'camera *;microphone *; display-capture *;',
      },
    );

    this.setFrameOffset(offset);
    this.setFrameStyle(positions.camerasPosition);
    this.bricklayer.element.addEventListener('load', this.onFrameLoad);
    this.frameLocale = {
      language,
      locales,
    };
    this.meetingAvatars = avatars;

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onWindowResize);
      window.addEventListener('orientationchange', this.onWindowResize);
    }
  }

  get isWaterMarkEnabled(): boolean {
    if (this.browserService.isMobileDevice) return false;
    return this.frameConfig.waterMark;
  }

  get isHorizontalCameraEnabled(): boolean {
    if (this.browserService.isMobileDevice) return false;

    return [CamerasPosition.TOP, CamerasPosition.BOTTOM].includes(this.frameConfig.camerasPosition);
  }

  /**
   * @function layoutModalsAndCamerasConfig
   * @description returns the correct layout and cameras position
   * @param {LayoutPosition} layout - layout position
   * @param {CamerasPosition} cameras - cameras position
   * @returns {LayoutModalsAndCameras}
   */
  private layoutModalsAndCamerasConfig = (
    layout: LayoutPosition,
    cameras: CamerasPosition,
  ): LayoutModalsAndCameras => {
    let layoutPosition = layout;
    let camerasPosition = cameras;

    const hasValidCamerasPositionValue = [
      CamerasPosition.LEFT,
      CamerasPosition.RIGHT,
      CamerasPosition.BOTTOM,
      CamerasPosition.TOP,
    ].includes(camerasPosition);

    const hasValidLAyoutPositionValue = [
      LayoutPosition.LEFT,
      LayoutPosition.RIGHT,
      LayoutPosition.CENTER,
    ].includes(layoutPosition);

    if (!hasValidCamerasPositionValue) {
      camerasPosition = CamerasPosition.RIGHT;
    }
    if (!hasValidLAyoutPositionValue) {
      layoutPosition = LayoutPosition.RIGHT;
    }
    if (this.browserService.isMobileDevice) {
      camerasPosition = CamerasPosition.BOTTOM;
      return { layoutPosition, camerasPosition };
    }

    if (layoutPosition === LayoutPosition.LEFT && camerasPosition === CamerasPosition.RIGHT) {
      layoutPosition = LayoutPosition.RIGHT;
    }
    if (layoutPosition === LayoutPosition.RIGHT && camerasPosition === CamerasPosition.LEFT) {
      layoutPosition = LayoutPosition.LEFT;
    }

    return { layoutPosition, camerasPosition };
  };

  /**
   * @function onFrameLoad
   * @returns {void}
   */
  private onFrameLoad = (): void => {
    this.messageBridge = new MessageBridge({
      logger: this.logger,
      contentWindow: this.bricklayer.element.contentWindow,
    });

    this.addMessagesListeners();
    this.updateFrameState(VideoFrameState.INITIALIZED);
    this.updateFrameLocale();
    this.updateMeetingAvatars();
    this.onWindowResize();
    this.setCustomColors();
    this.setCallbacks();
  };

  /**
   * @function addMessagesListeners
   * @description Adds listeners for various meeting and realtime events using the message bridge.
   * @returns {void}
   */
  private addMessagesListeners(): void {
    // @TODO: create option on MessageBridge to destroy all these listens.

    this.messageBridge.listen(
      MeetingEvent.MEETING_WAITING_FOR_HOST,
      this.onWaitingForHostDidChange,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_PARTICIPANT_JOINED, this.onParticipantJoined);
    this.messageBridge.listen(
      MeetingEvent.MEETING_PARTICIPANT_LIST_UPDATE,
      this.onParticipantListUpdate,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_PARTICIPANT_LEFT, this.onParticipantLeft);
    this.messageBridge.listen(MeetingEvent.MEETING_HOST_CHANGE, this.onMeetingHostChange);
    this.messageBridge.listen(MeetingEvent.MEETING_KICK_PARTICIPANT, this.onMeetingKickParticipant);
    this.messageBridge.listen(MeetingEvent.MEETING_SAME_PARTICIPANT_ERROR, this.onSameAccountError);
    this.messageBridge.listen(MeetingEvent.MEETING_STATE_UPDATE, this.meetingStateUpdate);
    this.messageBridge.listen(
      MeetingEvent.MEETING_CONNECTION_STATUS_CHANGE,
      this.onConnectionStatusChange,
    );
    this.messageBridge.listen(MeetingEvent.MEETING_DEVICES_CHANGE, this.onDevicesChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_GRID_MODE_CHANGE, this.onGridModeChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_DRAWING_CHANGE, this.onDrawingChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_TRANSCRIPT_CHANGE, this.onTranscriptChange);

    this.messageBridge.listen(FrameEvent.FRAME_DIMENSIONS_UPDATE, this.onFrameDimensionsUpdate);
    this.messageBridge.listen(
      RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
      this.onFollowParticipantDidChange,
    );
    this.messageBridge.listen(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, this.onGoToDidChange);
    this.messageBridge.listen(RealtimeEvent.REALTIME_GATHER, this.onGather);
  }

  /**
   * @function setFrameOffset
   * @description adds the offset to aid frame positioning.
   * @param {Offset} customOffset
   * @returns {void}
   */
  private setFrameOffset = (customOffset: Offset): void => {
    const offset = customOffset ?? {};

    // add the keys that were not set
    ['top', 'bottom', 'left', 'right'].forEach((key) => {
      const usedKeys = Object.keys(offset);

      if (usedKeys.includes(key)) return;

      offset[key] = 0;
    });

    this.frameOffset = offset as Offset;
  };

  private setCustomColors = (): void => {
    if (this.customColors) this.messageBridge.publish(FrameEvent.FRAME_COLOR_LIST_UPDATE, this.customColors);

    if (this.styles) this.messageBridge.publish(FrameEvent.FRAME_STYLES_UPDATE, this.styles);
  };

  /**
   * @function setCallbacks
   * @description adds the callbacks to the frame.
   * @returns {void}
   */
  private setCallbacks = (): void => {
    if (!this.callbacks) return;

    const callbacks = {
      onToggleMicrophone: !!this.callbacks.onToggleMicrophone,
      onToggleCam: !!this.callbacks.onToggleCam,
      onToggleRecording: !!this.callbacks.onToggleRecording,
      onToggleChat: !!this.callbacks.onToggleChat,
      onToggleScreenShare: !!this.callbacks.onToggleScreenShare,
      onClickHangup: !!this.callbacks.onClickHangup,
      onToggleMeetingSetup: !!this.callbacks.onToggleMeetingSetup,
    };

    this.messageBridge.listen(MeetingControlsEvent.CALLBACK_CALLED, (callback: string) => {
      this.callbacks[callback]?.();
    });

    this.messageBridge.publish(FrameEvent.FRAME_CALLBACKS_UPDATE, JSON.stringify(callbacks));
  };

  /**
   * @function setFrameStyle
   * @description injects the style and positions the frame container.
   * @param {string} position
   * @returns {void}
   */
  private setFrameStyle = (position: string): void => {
    const style = document.createElement('style');
    const { bottom, left, right, top } = this.frameOffset;

    style.innerHTML = `
      :root {
        --superviz-offset-top: ${top}px;
        --superviz-offset-right: ${right}px;
        --superviz-offset-left: ${left}px;
        --superviz-offset-bottom: ${bottom}px;
      }     
    `;

    document.head.appendChild(style);

    if (this.browserService.isMobileDevice) {
      this.bricklayer.element.classList.add('sv-video-frame--bottom');
      return;
    }

    this.bricklayer.element.classList.add(`sv-video-frame--${position}`);
  };

  /**
   * @function onFrameDimensionsUpdate
   * @param {Dimensions} params
   * @description callback that updates the frame size according to the size of the inner content
   * @returns {void}
   */
  private onFrameDimensionsUpdate = ({ width, height }: Dimensions): void => {
    if (typeof window === 'undefined') return;

    const frame = document.getElementById(FRAME_ID);
    const {
      bottom: offsetBottom,
      right: offsetRight,
      left: offsetLeft,
      top: offsetTop,
    } = this.frameOffset;

    const waterMarkHeight: number = this.isWaterMarkEnabled ? 40 : 0;

    let frameWidth: string = `${width}px`;
    let frameHeight: string = `${height + waterMarkHeight}px`;

    if (width >= window.innerWidth || this.isHorizontalCameraEnabled) {
      frameWidth = `calc(100% - ${offsetRight}px - ${offsetLeft}px)`;
    }

    if (height >= window.innerHeight) {
      frameHeight = `calc(100% - ${offsetTop}px - ${offsetBottom}px)`;
    }

    frame.style.width = frameWidth;
    frame.style.height = frameHeight;

    this.frameSizeObserver.publish({ width: frame.offsetWidth, height: frame.offsetHeight });
  };

  /**
   * @function onWindowResize
   * @description update window-host size to iframe
   * @returns {void}
   */
  private onWindowResize = (): void => {
    const { top, bottom, right, left } = this.frameOffset;
    const { innerHeight, innerWidth } = window;

    const height = innerHeight - top - bottom;
    const width = innerWidth - right - left;

    // when the frame is not mounted, the message bridge is not available
    if (!this.messageBridge) return;

    this.messageBridge.publish(FrameEvent.FRAME_PARENT_SIZE_UPDATE, { height, width });
  };

  /**
   * @function updateFrameLocale
   * @description update default language and locales
   * @returns {void}
   */
  private updateFrameLocale = (): void => {
    if (!this.frameLocale || (!this.frameLocale?.language && this.frameLocale?.locales)) return;

    const { language, locales } = this.frameLocale;
    const languages = locales.map((locale) => locale?.language);
    const availableLanguages = ['en', ...languages];

    if (language && !availableLanguages.includes(language)) {
      throw new Error('The default language is not available in the language listing.');
    }

    this.messageBridge.publish(FrameEvent.FRAME_LOCALE_UPDATE, this.frameLocale);
  };

  /**
   * @function updateMeetingAvatars
   * @description update list of avatars
   * @returns {void}
   */
  private updateMeetingAvatars = (): void => {
    this.messageBridge.publish(FrameEvent.FRAME_AVATAR_LIST_UPDATE, this.meetingAvatars);
  };

  private onParticipantJoined = (participant: Participant): void => {
    this.participantJoinedObserver.publish(participant);
  };

  /**
   * @function onParticipantLeft
   * @param {Participant} participant
   * @description callback that is triggered whenever a participant left the meeting room
   * @returns {void}
   */
  private onParticipantLeft = (participant: Participant): void => {
    this.participantLeftObserver.publish(participant);
  };

  /**
   * @function updateFrameState
   * @description updates frame state
   * @param {VideoFrameState} state
   * @returns {void}
   */
  private updateFrameState(state: VideoFrameState): void {
    if (state !== this.frameState) {
      this.frameState = state;
      this.frameStateObserver.publish(this.frameState);
    }

    const states = {
      [VideoFrameState.INITIALIZING]: MeetingState.FRAME_INITIALIZING,
      [VideoFrameState.INITIALIZED]: MeetingState.FRAME_INITIALIZED,
      [VideoFrameState.UNINITIALIZED]: MeetingState.FRAME_UNINITIALIZED,
    };

    this.meetingStateUpdate(states[state]);
  }

  /**
   * @function onMeetingHostChange
   * @param {string} hostId
   * @returns {void}
   */
  private onMeetingHostChange = (hostId: string): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_HOST_CHANGE,
      data: hostId,
    });
  };

  /**
   * @function onMeetingKickParticipant
   * @param {string} participantId - ID of the participant
   * @returns {void}
   */
  private onMeetingKickParticipant = (participantId: string): void => {
    this.realtimeEventsObserver.publish({
      event: MeetingEvent.MEETING_KICK_PARTICIPANT,
      data: participantId,
    });
  };

  /**
   * @function onFollowParticipantDidChange
   * @param {string} participantId
   * @returns {void}
   */
  private onFollowParticipantDidChange = (participantId?: string): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
      data: participantId,
    });
  };

  /**
   * @function onGoToDidChange
   * @param {string} participantId
   * @returns {void}
   */
  private onGoToDidChange = (participantId: string): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_GO_TO_PARTICIPANT,
      data: participantId,
    });
  };

  /**
   * @function onGather
   * @returns {void}
   */
  private onGather = (): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_GATHER,
      data: true,
    });
  };

  /**
   * @function onGridModeChange
   * @param {boolean} isGridModeEnabled
   * @returns {void}
   */
  private onGridModeChange = (isGridModeEnabled: boolean): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_GRID_MODE_CHANGE,
      data: isGridModeEnabled,
    });
  };

  /**
   * @function onDrawingChange
   * @param drawing {DrawingData}
   * @returns {void}
   */
  private onDrawingChange = (drawing: DrawingData): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_DRAWING_CHANGE,
      data: drawing,
    });
  };

  /**
   * @function onTranscriptChange
   * @param state {TranscriptState}
   * @returns {void}
   */
  private onTranscriptChange = (state: TranscriptState): void => {
    this.realtimeEventsObserver.publish({
      event: RealtimeEvent.REALTIME_TRANSCRIPT_CHANGE,
      data: state,
    });
  };

  /**
   * @function onSameAccountError
   * @param {string} error
   * @returns {void}
   */
  private onSameAccountError = (error: string): void => {
    this.sameAccountErrorObserver.publish(error);
  };

  /**
   * @function onDevicesChange
   * @param {DeviceEvent} state
   * @returns {void}
   */
  private onDevicesChange = (state: DeviceEvent): void => {
    this.devicesObserver.publish(state);
  };

  /**
   * @function meetingStateUpdate
   * @param {MeetingState} newState
   * @returns {void}
   */
  private meetingStateUpdate = (newState: MeetingState): void => {
    this.meetingStateObserver.publish(newState);
  };

  /**
   * @function onConnectionStatusChange
   * @param {MeetingConnectionStatus} newStatus
   * @returns {void}
   */
  private onConnectionStatusChange = (newStatus: MeetingConnectionStatus): void => {
    this.meetingConnectionObserver.publish(newStatus);
  };

  private onWaitingForHostDidChange = (isWaitingForHost: boolean): void => {
    this.waitingForHostObserver.publish(isWaitingForHost);
  };

  private onParticipantListUpdate = (participants: Partial<Participant>[]): void => {
    this.participantListObserver.publish(participants);
  };

  /**
   * @function start
   * @param {StartMeetingOptions} options
   * @returns {void}
   */
  public start(options: StartMeetingOptions): void {
    this.messageBridge.publish(MeetingEvent.MEETING_START, {
      ...options,
      config: this.frameConfig,
    });
  }

  /**
   * @function leave
   * @returns {void}
   */
  public leave(): void {
    this.messageBridge.publish(MeetingEvent.MEETING_LEAVE);

    this.destroy();
  }

  /**
   * @function destroy
   * @returns {void}
   */
  public destroy(): void {
    this.messageBridge?.destroy();
    this.bricklayer?.destroy();

    this.frameSizeObserver?.destroy();
    this.realtimeEventsObserver?.destroy();
    this.sameAccountErrorObserver?.destroy();
    this.devicesObserver?.destroy();
    this.meetingStateObserver?.destroy();
    this.meetingConnectionObserver?.destroy();
    this.participantJoinedObserver?.destroy();
    this.participantLeftObserver?.destroy();

    this.bricklayer = null;
    this.frameState = null;

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize);
      window.removeEventListener('orientationchange', this.onWindowResize);
    }
  }

  /**
   * @function publishMessageToFrame
   * @description Publishes a message to the frame
   * @param event - The event to publish
   * @param payload  - The payload to publish
   */
  public publishMessageToFrame(
    event: MeetingControlsEvent | MeetingEvent | RealtimeEvent,
    payload?: unknown,
  ): void {
    if (!this.messageBridge) return;

    this.messageBridge.publish(event, payload);
  }
}
