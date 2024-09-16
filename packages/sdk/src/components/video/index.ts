import { PresenceEvent, PresenceEvents, Room } from '@superviz/socket-client';

import { ColorsVariables } from '../../common/types/colors.types';
import {
  DeviceEvent,
  Dimensions,
  FrameEvent,
  MeetingConnectionStatus,
  MeetingControlsEvent,
  MeetingEvent,
  MeetingState,
  RealtimeEvent,
  TranscriptState,
} from '../../common/types/events.types';
import {
  VideoParticipant,
  ParticipantType,
  Participant,
} from '../../common/types/participant.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger } from '../../common/utils';
import { BrowserService } from '../../services/browser';
import config from '../../services/config';
import { ConnectionService } from '../../services/connection-status';
import { RoomStateService } from '../../services/room-state';
import VideoConferenceManager from '../../services/video-conference-manager';
import {
  CamerasPosition,
  DrawingData,
  LayoutMode,
  LayoutPosition,
  RealtimeObserverPayload,
  VideoFrameState,
  VideoManagerOptions,
} from '../../services/video-conference-manager/types';
import { BaseComponent } from '../base';
import { ComponentNames } from '../types';

import { ParticipantToFrame, VideoComponentOptions } from './types';
import { MEETING_COLORS } from '../../common/types/meeting-colors.types';
import { coreBridge } from '../../services/core-bridge';

const KICK_PARTICIPANTS_TIME = 1000 * 60;
let KICK_PARTICIPANTS_TIMEOUT: ReturnType<typeof setTimeout> | null = null;
export class VideoConference extends BaseComponent {
  public name: ComponentNames;
  protected logger: Logger;
  private participantsOnMeeting: Partial<VideoParticipant>[] = [];
  private localParticipant: VideoParticipant;
  private videoManager: VideoConferenceManager;
  private connectionService: ConnectionService;
  private browserService: BrowserService;
  private videoConfig: VideoManagerOptions;
  private params?: VideoComponentOptions;
  private roomState: RoomStateService;
  private drawingRoom: Room;

  private kickParticipantsOnHostLeave = false;

  constructor(params?: VideoComponentOptions) {
    super();

    this.params = {
      ...params,
      userType: params?.participantType ?? params?.userType ?? ParticipantType.GUEST,
    };

    this.name = ComponentNames.VIDEO_CONFERENCE;
    this.logger = new Logger(`@superviz/sdk/${ComponentNames.VIDEO_CONFERENCE}`);

    this.browserService = new BrowserService();
    this.connectionService = new ConnectionService();
    this.connectionService.addListeners();

    // Connection observers
    this.connectionService.connectionStatusObserver.subscribe(this.onConnectionStatusChange);
  }

  /**
   * @function toggleMeetingSetup
   * @description open/close meeting setup
   * @returns {void}
   */
  public toggleMeetingSetup(): void {
    return this.videoManager?.publishMessageToFrame(MeetingControlsEvent.TOGGLE_MEETING_SETUP);
  }

  /**
   * @function toggleMicrophone
   * @description mute/unmute user's microphone
   * @returns {void}
   */
  public toggleMicrophone(): void {
    if (this.localParticipant.type === ParticipantType.AUDIENCE) {
      console.warn('[SuperViz] Audience cannot toggle microphone');
      return;
    }

    return this.videoManager?.publishMessageToFrame(MeetingControlsEvent.TOGGLE_MICROPHONE);
  }

  /**
   * @function toggleCam
   * @description enable/disable user's camera
   * @returns {void}
   */
  public toggleCam(): void {
    if (this.localParticipant.type === ParticipantType.AUDIENCE) {
      console.warn('[SuperViz] Audience cannot toggle camera');
      return;
    }

    this.videoManager?.publishMessageToFrame(MeetingControlsEvent.TOGGLE_CAM);
  }

  /**
   * @function toggleScreenShare
   * @description enable/disable user's screen share
   * @returns {void}
   */
  public toggleScreenShare(): void {
    if (this.localParticipant.type === ParticipantType.AUDIENCE) {
      console.warn('[SuperViz] Audience cannot toggle screen share');
      return;
    }

    return this.videoManager?.publishMessageToFrame(MeetingControlsEvent.TOGGLE_SCREENSHARE);
  }

  /**
   * @function toggleChat
   * @description open/close meeting chat
   * @returns {void}
   */
  public toggleChat(): void {
    return this.videoManager?.publishMessageToFrame(MeetingControlsEvent.TOGGLE_MEETING_CHAT);
  }

  /**
   * @function toggleRecording
   * @description open/close meeting recording
   * @returns {void}
   */
  public toggleRecording(): void {
    if (this.localParticipant.isHost) {
      console.warn('[SuperViz] Only host can toggle recording');
      return;
    }

    return this.videoManager?.publishMessageToFrame(MeetingControlsEvent.TOGGLE_RECORDING);
  }

  /**
   * @function hangUp
   * @description hang up user's call
   * @returns {void}
   * */
  public hangUp(): void {
    this.videoManager?.publishMessageToFrame(MeetingControlsEvent.HANG_UP);
  }

  /**
   * @function start
   * @description start video conference
   * @returns {void}
   */
  protected start(): void {
    this.logger.log('video conference @ start');

    this.drawingRoom = this.ioc.createRoom('drawing');

    this.subscribeToStoreUpdates();
    this.suscribeToRealtimeEvents();
    this.startVideo();
  }

  /**
   * @function destroy
   * @description destroy video conference
   * @returns {void}
   */
  protected destroy(): void {
    this.logger.log('video conference @ destroy');
    const { destroy } = this.useStore(StoreType.VIDEO);
    destroy();

    this.roomState?.destroy();
    this.drawingRoom.disconnect();

    this.kickParticipantsOnHostLeave = false;

    this.publish(MeetingEvent.DESTROY);

    this.unsubscribeFromRealtimeEvents();
    this.unsubscribeFromVideoEvents();

    this.videoManager?.leave();
    this.connectionService?.removeListeners();
  }

  /**
   * @function startVideo
   * @description start video manager
   * @returns {void}
   */
  private startVideo = (): void => {
    const defaultAvatars =
      this.params?.userType !== ParticipantType.AUDIENCE && this.params?.defaultAvatars === true;

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
    this.videoManager = new VideoConferenceManager(this.videoConfig);

    this.subscribeToVideoEvents();
  };

  /**
   * @function subscribeToVideoEvents
   * @description subscribe to video events
   * @returns {void}
   */
  private subscribeToVideoEvents = (): void => {
    this.logger.log('video conference @ subscribe to video events');
    this.videoManager.meetingConnectionObserver.subscribe(
      this.connectionService.updateMeetingConnectionStatus,
    );
    this.videoManager.participantListObserver.subscribe(this.onParticipantListUpdate);
    this.videoManager.waitingForHostObserver.subscribe(this.onWaitingForHost);
    this.videoManager.frameSizeObserver.subscribe(this.onFrameSizeDidChange);
    this.videoManager.meetingStateObserver.subscribe(this.onMeetingStateChange);
    this.videoManager.frameStateObserver.subscribe(this.onFrameStateChange);
    this.videoManager.realtimeEventsObserver.subscribe(this.onRealtimeEventFromFrame);
    this.videoManager.participantJoinedObserver.subscribe(this.onParticipantJoined);
    this.videoManager.participantLeftObserver.subscribe(this.onParticipantLeft);
    this.videoManager.sameAccountErrorObserver.subscribe(this.onSameAccountError);
    this.videoManager.devicesObserver.subscribe(this.onDevicesChange);
  };

  /**
   * @function unsubscribeFromVideoEvents
   * @description unsubscribe from video events
   * @returns {void}
   * */
  private unsubscribeFromVideoEvents = (): void => {
    if (!this.videoManager) return;

    this.logger.log('video conference @ unsubscribe from video events');

    this.videoManager.meetingConnectionObserver.unsubscribe(
      this.connectionService.updateMeetingConnectionStatus,
    );
    this.videoManager.participantListObserver.unsubscribe(this.onParticipantListUpdate);
    this.videoManager.waitingForHostObserver.unsubscribe(this.onWaitingForHost);
    this.videoManager.frameSizeObserver.unsubscribe(this.onFrameSizeDidChange);
    this.videoManager.meetingStateObserver.unsubscribe(this.onMeetingStateChange);
    this.videoManager.frameStateObserver.unsubscribe(this.onFrameStateChange);
    this.videoManager.realtimeEventsObserver.unsubscribe(this.onRealtimeEventFromFrame);
    this.videoManager.participantJoinedObserver.unsubscribe(this.onParticipantJoined);
    this.videoManager.participantLeftObserver.unsubscribe(this.onParticipantLeft);
    this.videoManager.sameAccountErrorObserver.unsubscribe(this.onSameAccountError);
    this.videoManager.devicesObserver.unsubscribe(this.onDevicesChange);
  };

  /**
   * @function suscribeToRealtimeEvents
   * @description subscribe to realtime events
   * @returns {void}
   */
  private suscribeToRealtimeEvents = (): void => {
    this.logger.log('video conference @ subscribe to realtime events');
    this.room.presence.on(PresenceEvents.UPDATE, this.onParticipantUpdateOnRealtime);
    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onParticipantJoinedOnRealtime);
    this.room.presence.on(PresenceEvents.LEAVE, this.onParticipantLeftOnRealtime);
  };

  /**
   * @function unsubscribeFromRealtimeEvents
   * @description subscribe to realtime events
   * @returns {void}
   */
  private unsubscribeFromRealtimeEvents = (): void => {
    this.logger.log('video conference @ unsubscribe from realtime events');
    this.room.presence.off(PresenceEvents.UPDATE);
    this.room.presence.off(PresenceEvents.LEAVE);
    this.room.presence.off(PresenceEvents.JOINED_ROOM);
    this.roomState?.kickParticipantObserver.unsubscribe(this.onKickLocalParticipant);
  };

  private subscribeToStoreUpdates = (): void => {
    const { localParticipant, group, participants } = this.useStore(StoreType.GLOBAL);
    participants.subscribe((data) => {
      const participants = Object.values(data);

      this.onRealtimeParticipantsDidChange(participants);
    });

    const { drawing, hostId, isGridModeEnabled, transcript, followParticipantId, gather } =
      this.useStore(StoreType.VIDEO);

    localParticipant.subscribe((participant) => {
      this.localParticipant = {
        ...this.localParticipant,
        ...participant,
        type: this.params.userType,
      };
    });

    drawing.subscribe(this.setDrawing);
    hostId.subscribe(this.setHost);
    isGridModeEnabled.subscribe(this.setGridMode);
    transcript.subscribe(this.setTranscript);
    followParticipantId.subscribe(this.setFollowParticipant);
    gather.subscribe(this.setGather);
    group.subscribe();
  };

  /**
   * @function createParticipantFromPresence
   * @description create a participant object from the data coming from the IO
   * @param {PresenceEvent<Participant>} participant - the presence event object
   * @returns {Participant} a participant
   * */
  private createParticipantFromPresence = (
    participant: PresenceEvent<Participant>,
  ): VideoParticipant => {
    return {
      participantId: participant.id,
      id: participant.id,
      color: participant.data.slot?.color || MEETING_COLORS.gray,
      avatar: participant.data.avatar,
      type: participant.data.type,
      name: participant.data.name,
      isHost: participant.data.isHost,
      timestamp: participant.timestamp,
      slot: participant.data.slot,
    };
  };

  /** Video Events */

  /**
   * @function onFrameSizeDidChange
   * @description handler for frame size change event
   * @param {Dimensions} dimensions - frame dimensions
   * @returns {void}
   * */
  private onFrameSizeDidChange = (dimensions: Dimensions): void => {
    this.publish(FrameEvent.FRAME_DIMENSIONS_UPDATE, dimensions);
  };

  /**
   * @function onWaitingForHost
   * @description handler for waiting for host event
   * @param {boolean} waiting - whether or not waiting for host
   * @returns {void}
   */
  private onWaitingForHost = (waiting: boolean): void => {
    this.publish(MeetingEvent.MEETING_WAITING_FOR_HOST, waiting);
  };

  /**
   * @function onCOnnectionStatusChange
   * @description handler for connection status change event
   * @param {MeetingConnectionStatus} newStatus - new connection status
   * @returns {void}
   */
  private onConnectionStatusChange = (newStatus: MeetingConnectionStatus): void => {
    this.logger.log('video conference @ on connection status change', newStatus);

    const connectionProblemStatus = [
      MeetingConnectionStatus.BAD,
      MeetingConnectionStatus.DISCONNECTED,
      MeetingConnectionStatus.POOR,
      MeetingConnectionStatus.LOST_CONNECTION,
    ];

    if (connectionProblemStatus.includes(newStatus)) {
      this.roomState.freezeSync(true);
    }

    if (
      connectionProblemStatus.includes(this.connectionService.oldConnectionStatus) &&
      !connectionProblemStatus.includes(newStatus)
    ) {
      this.roomState.freezeSync(false);
    }

    this.publish(MeetingEvent.MEETING_CONNECTION_STATUS_CHANGE, newStatus);
  };

  /**
   * @function onMeetingStateChange
   * @description handler for meeting state change event
   * @param {MeetingState} state - meeting state
   * @returns {void}
   */
  private onMeetingStateChange = (state: MeetingState): void => {
    this.logger.log('video conference @ on meeting state change', state);
    this.publish(MeetingEvent.MEETING_STATE_UPDATE, state);
  };

  /**
   * @function onSameAccountError
   * @description handler for same account error event
   * @param {string} error - error message
   * @returns {void}
   * */
  private onSameAccountError = (error: string): void => {
    this.publish(MeetingEvent.MEETING_SAME_PARTICIPANT_ERROR, error);
    this.detach();
  };

  /**
   * @function onDevicesChange
   * @description handler for devices change event
   * @param {DeviceEvent} state - device state
   * @returns {void}
   * */
  private onDevicesChange = (state: DeviceEvent): void => {
    this.publish(MeetingEvent.MEETING_DEVICES_CHANGE, state);
  };

  /**
   * @function onFrameStateChange
   * @description handler for frame state change event
   * @param {VideoFrameState} state - frame state
   * @returns
   */
  private onFrameStateChange = (state: VideoFrameState): void => {
    this.logger.log('video conference @ on frame state change', state);

    if (state !== VideoFrameState.INITIALIZED) return;

    this.roomState = new RoomStateService(this.room, this.drawingRoom, this.logger);
    this.roomState.kickParticipantObserver.subscribe(this.onKickLocalParticipant);
    this.roomState.start();

    if (this.params.userType !== ParticipantType.GUEST) {
      this.localParticipant = Object.assign(this.localParticipant, {
        type: this.params.userType,
      });

      this.roomState.updateMyProperties({
        ...this.localParticipant,
      });
    }

    this.videoManager.start({
      group: this.group,
      participant: this.localParticipant,
      roomId: config.get<string>('roomId'),
    });

    this.publish(MeetingEvent.MEETING_START);
  };

  /**
   * @function onRealtimeEventFromFrame
   * @description handler for realtime event
   * @param {RealtimeObserverPayload} payload - realtime event payload
   * @returns {void}
   * */
  private onRealtimeEventFromFrame = ({ event, data }: RealtimeObserverPayload): void => {
    this.logger.log('video conference @ on realtime event from frame', event, data);

    const _ = {
      [RealtimeEvent.REALTIME_HOST_CHANGE]: (data: string) => this.roomState.setHost(data),
      [RealtimeEvent.REALTIME_GATHER]: (data: boolean) => this.roomState.setGather(data),
      [RealtimeEvent.REALTIME_GRID_MODE_CHANGE]: (data: boolean) =>
        this.roomState.setGridMode(data),
      [RealtimeEvent.REALTIME_DRAWING_CHANGE]: (data: DrawingData) => {
        this.roomState.setDrawing(data);
      },
      [RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT]: (data: string) => {
        this.roomState.setFollowParticipant(data);
      },
      [MeetingEvent.MEETING_KICK_PARTICIPANT]: (data: string) => {
        this.roomState.setKickParticipant(data);
      },
      [RealtimeEvent.REALTIME_TRANSCRIPT_CHANGE]: (data: TranscriptState) => {
        this.roomState.setTranscript(data);
      },
      [RealtimeEvent.REALTIME_GO_TO_PARTICIPANT]: (data: string) => {
        this.eventBus.publish(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, data);
      },
    }[event](data);

    this.publish(event, data);
  };

  /**
   * @function onParticipantJoined
   * @description handler for participant joined event
   * @param {Participant} participant - participant
   * @returns {void}
   */
  private onParticipantJoined = (participant: VideoParticipant): void => {
    this.logger.log('video conference @ on participant joined', participant);

    this.publish(MeetingEvent.MEETING_PARTICIPANT_JOINED, participant);
    this.publish(MeetingEvent.MY_PARTICIPANT_JOINED, participant);
    this.kickParticipantsOnHostLeave = !this.params?.allowGuests;

    const { localParticipant, participants } = this.useStore(StoreType.GLOBAL);

    const newParticipantName = participant.name.trim();

    if (this.videoConfig.canUseDefaultAvatars) {
      this.roomState.updateMyProperties({
        avatar: participant.avatar,
        name: participant.name,
        type: participant.type,
        joinedMeeting: true,
      });

      coreBridge.updateLocalParticipant({
        ...localParticipant.value,
        avatar: participant.avatar,
        name: participant.name,
        type: this.params.userType,
      });

      coreBridge.updateParticipantsList({
        ...participants.value,
        [participant.id]: {
          ...participants.value[participant.id],
          avatar: participant.avatar,
          name: participant.name,
        },
      });

      return;
    }

    coreBridge.updateLocalParticipant({
      ...localParticipant.value,
      name: newParticipantName,
      type: this.params.userType,
    });

    coreBridge.updateParticipantsList({
      ...participants.value,
      [participant.id]: {
        ...participants.value[participant.id],
        name: newParticipantName,
        type: this.params.userType,
      },
    });

    this.roomState.updateMyProperties({
      name: participant.name,
      type: participant.type,
      joinedMeeting: true,
    });
  };

  /**
   * @function onParticipantLeft
   * @description handler for participant left event
   * @param {Participant} _ - participant
   * @returns {void}
   */
  private onParticipantLeft = (_: VideoParticipant): void => {
    this.logger.log('video conference @ on participant left', this.localParticipant);

    const { localParticipant, participants } = this.useStore(StoreType.GLOBAL);

    localParticipant.publish({
      ...localParticipant.value,
      activeComponents: localParticipant.value.activeComponents?.filter(
        (ac) => ac !== ComponentNames.VIDEO_CONFERENCE,
      ),
    });

    participants.publish({
      ...participants.value,
      [this.localParticipant.id]: {
        ...localParticipant.value,
        activeComponents: localParticipant.value.activeComponents?.filter(
          (ac) => ac !== ComponentNames.VIDEO_CONFERENCE,
        ),
      },
    });

    this.connectionService.removeListeners();
    this.publish(MeetingEvent.MY_PARTICIPANT_LEFT, this.localParticipant);

    this.unsubscribeFromVideoEvents();
    this.videoManager.leave();
    this.videoManager = undefined;
    this.connectionService = undefined;

    this.detach();
  };

  /**
   * @function onParticipantListUpdate
   * @description callback that is called everytime the global participants list updates
   * @param {Record<string, Participant>} participants - participants
   * @returns {void}
   */
  private onParticipantListUpdate = (participants: Record<string, VideoParticipant>): void => {
    this.logger.log('video conference @ on participant list update', participants);

    const list: VideoParticipant[] = Object.values(participants).map((participant) => {
      return {
        id: participant.id,
        slot: participant.slot,
        avatar: participant.avatar,
        name: participant.name,
        type: participant.type,
        isHost: participant.isHost ?? false,
        timestamp: participant.timestamp,
        color: participant.slot?.color || MEETING_COLORS.gray,
      };
    });

    this.publish(MeetingEvent.MEETING_PARTICIPANT_LIST_UPDATE, list);

    if (this.participantsOnMeeting.length !== list.length) {
      this.publish(MeetingEvent.MEETING_PARTICIPANT_AMOUNT_UPDATE, list.length);
    }

    this.participantsOnMeeting = list;

    this.validateIfInTheRoomHasHost();
  };

  /** Realtime Events */

  /**
   * @function onKickLocalParticipant
   * @description handler for kick local participant event
   * @param {string} participantId - participant id
   * @returns {void}
   */

  private onKickLocalParticipant = (): void => {
    this.logger.log('video conference @ on kick local participant');

    this.publish(MeetingEvent.MEETING_KICK_PARTICIPANT, this.localParticipant);
    this.detach();
  };

  /**
   * @function setDrawing
   * @description publish drawing data to frame
   * @param {DrawingData} drawing - drawing data
   * @returns {void}
   */
  private setDrawing = (drawing: DrawingData): void => {
    this.videoManager?.publishMessageToFrame(RealtimeEvent.REALTIME_DRAWING_CHANGE, drawing);
  };

  /**
   * @function setHost
   * @description publish host id to frame
   * @param {string} hostId - host id
   * @returns {void}
   */
  private setHost = (hostId: string): void => {
    this.videoManager?.publishMessageToFrame(RealtimeEvent.REALTIME_HOST_CHANGE, hostId);
    this.onHostParticipantDidChange(hostId);
  };

  /**
   * @function setGridMode
   * @description publish grid mode to frame
   * @param {boolean} isGridModeEnabled - grid mode enabled
   * @returns {void}
   */
  private setGridMode = (isGridModeEnabled: boolean): void => {
    this.videoManager?.publishMessageToFrame(
      RealtimeEvent.REALTIME_GRID_MODE_CHANGE,
      isGridModeEnabled,
    );
  };

  /**
   * @function setTranscript
   * @description publish transcript to frame
   * @param {TranscriptState} transcript - transcript
   * @returns {void}
   */
  private setTranscript = (transcript: TranscriptState): void => {
    this.videoManager?.publishMessageToFrame(RealtimeEvent.REALTIME_TRANSCRIPT_CHANGE, transcript);
  };

  /**
   * @function setFollowParticipant
   * @description publish follow participant to frame
   * @param {string} participantId - participant id
   * @returns {void}
   */
  private setFollowParticipant = (participantId: string): void => {
    this.videoManager?.publishMessageToFrame(
      RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT,
      participantId,
    );

    this.eventBus.publish(RealtimeEvent.REALTIME_FOLLOW_PARTICIPANT, participantId);
  };

  /**
   * @function setGather
   * @description publish gather to frame
   * @param {boolean} gather - gather
   * @returns {void}
   */
  private setGather = (shouldGather: boolean): void => {
    if (!this.videoManager || !shouldGather) return;

    const { hostId, gather } = this.useStore(StoreType.VIDEO);
    gather.publish(false);

    if (hostId.value !== this.localParticipant.id) {
      this.eventBus.publish(RealtimeEvent.REALTIME_GO_TO_PARTICIPANT, hostId.value);
      return;
    }

    this.videoManager.publishMessageToFrame(RealtimeEvent.REALTIME_GATHER, shouldGather);
  };

  /**
   * @function onRealtimeParticipantsDidChange
   * @description handler for participant list update event
   * @param {Participant[]} participants - participants
   * @returns {void}
   */
  private onRealtimeParticipantsDidChange = (participants: Participant[]): void => {
    this.logger.log('video conference @ on participants did change', participants);
    const participantList: ParticipantToFrame[] = participants.map((participant) => {
      return {
        id: participant.id,
        timestamp: participant.timestamp,
        participantId: participant.id,
        color: participant.slot?.color || MEETING_COLORS.gray,
        name: participant.name,
        isHost: participant.isHost ?? false,
        avatar: participant.avatar,
        type: participant.type,
        slot: participant.slot,
      };
    });

    this.videoManager?.publishMessageToFrame(
      RealtimeEvent.REALTIME_PARTICIPANT_LIST_UPDATE,
      participantList,
    );
  };

  /**
   * @function onHostParticipantDidChange
   * @description handler for host participant change event
   * @param {string} hostId - new host ud
   * @returns {void}
   * */
  private onHostParticipantDidChange = (hostId: string): void => {
    this.logger.log('video conference @ on host participant did change', hostId);

    this.videoManager?.publishMessageToFrame(RealtimeEvent.REALTIME_HOST_CHANGE, hostId);

    const { participants } = this.useStore(StoreType.GLOBAL);
    const participant = Object.values(participants.value).find((participant) => {
      return participant.id === hostId;
    });

    const newHost = participant
      ? {
          id: participant.id,
          color: participant.slot?.color || MEETING_COLORS.gray,
          avatar: participant.avatar,
          type: participant.type,
          name: participant.name,
          isHost: participant.id === hostId,
        }
      : null;

    if (KICK_PARTICIPANTS_TIMEOUT && !!newHost) {
      this.logger.log(
        'video conference @ on host participant did change - clear kick all participants timeout',
      );
      clearTimeout(KICK_PARTICIPANTS_TIMEOUT);
      KICK_PARTICIPANTS_TIMEOUT = null;
    }

    this.publish(MeetingEvent.MEETING_HOST_CHANGE, newHost);
  };

  /**
   * @function onHostAvailabilityChange
   * @description Callback function that is called when the availability of the host changes.
   * @param {boolean} isHostAvailable - A boolean indicating whether the host is available or not.
   * @returns {void}
   */
  private onHostAvailabilityChange = (isHostAvailable: boolean): void => {
    this.logger.log('launcher service @ onHostAvailabilityChange');

    if (isHostAvailable) {
      this.publish(MeetingEvent.MEETING_HOST_AVAILABLE);
      return;
    }

    this.publish(MeetingEvent.MEETING_NO_HOST_AVAILABLE);
  };

  /**
   * @function onParticipantJoinedOnRealtime
   * @description handler for participant joined event
   * @param {PresenceEvent<Participant>} participant - participant
   * @returns {void}
   */
  private onParticipantJoinedOnRealtime = (participant: PresenceEvent<Participant>): void => {
    this.logger.log('video conference @ on participant joined on realtime', participant);

    this.publish(
      MeetingEvent.MEETING_PARTICIPANT_JOINED,
      this.createParticipantFromPresence(participant),
    );

    if (participant.id !== this.localParticipant.id) return;

    this.room.presence.update(this.localParticipant);
  };

  /**
   * @function onParticipantLeftOnRealtime
   * @description handler for participant left event
   * @param {PresenceEvent<Participant>} participant
   * @returns {void}
   */
  private onParticipantLeftOnRealtime = (participant: PresenceEvent<Participant>): void => {
    this.logger.log('video conference @ on participant left on realtime', participant);

    this.publish(
      MeetingEvent.MEETING_PARTICIPANT_LEFT,
      this.createParticipantFromPresence(participant),
    );
  };

  private onParticipantUpdateOnRealtime = (participant: PresenceEvent<Participant>): void => {
    this.logger.log('video conference @ on participant update on realtime', participant);
    const { localParticipant, participants } = this.useStore(StoreType.GLOBAL);

    if (participant.data.id === this.localParticipant.id) {
      this.publish(
        MeetingEvent.MY_PARTICIPANT_UPDATED,
        this.createParticipantFromPresence(participant),
      );
    }

    participants.publish({
      ...participants.value,
      [participant.data.id]: {
        ...localParticipant.value,
        ...participant.data,
      },
    });
  };

  /**
   * @function validateIfInTheRoomHasHost
   * @description checks if the room has a host
   * @returns {void}
   */
  private validateIfInTheRoomHasHost = (): void => {
    if (!this.roomState) return;

    const { hostId } = this.useStore(StoreType.VIDEO);
    const { participants } = this.useStore(StoreType.GLOBAL);
    const participantsList = Object.values(participants.value);

    // list with all participants that have the type host and are in the meeting
    const participantsCanBeHost = participantsList.filter((participant) => {
      return (
        participant.type === ParticipantType.HOST &&
        this.participantsOnMeeting.some((p) => p.id === participant.id)
      );
    });

    if (
      !participantsCanBeHost.length &&
      this.kickParticipantsOnHostLeave &&
      this.localParticipant?.type !== ParticipantType.HOST &&
      !KICK_PARTICIPANTS_TIMEOUT
    ) {
      this.logger.log(
        'video conference @ validate if in the room has host - init kick all participants timeout',
      );

      KICK_PARTICIPANTS_TIMEOUT = setTimeout(() => {
        this.logger.log(
          'video conference @ validate if in the room has host - kick all participants',
        );
        this.onKickLocalParticipant();
      }, KICK_PARTICIPANTS_TIME);
    }

    if (participantsCanBeHost.length && KICK_PARTICIPANTS_TIMEOUT) {
      this.logger.log(
        'video conference @ validade if in the room has host - clear kick all participants timeout',
      );

      clearTimeout(KICK_PARTICIPANTS_TIMEOUT);
      KICK_PARTICIPANTS_TIMEOUT = null;
    }

    this.onHostAvailabilityChange(!!participantsCanBeHost.length);

    const hostAlreadyInRoom = participantsList.find(
      (participant) => participant?.id === hostId?.value,
    );

    if (!participantsCanBeHost.length || hostAlreadyInRoom) return;

    const host = participantsCanBeHost.reduce((previous, current) => {
      this.logger.log(
        'video conference @ validate if in the room has host - reducing participants',
        {
          previous,
          current,
        },
      );

      if (!previous || current?.id === hostId.value) {
        return current;
      }

      // set the first participant with host privileges as host
      if (current?.timestamp > previous.timestamp) {
        return previous;
      }

      return current;
    }, null) as VideoParticipant;

    this.room.presence.update<VideoParticipant>({
      ...this.localParticipant,
      isHost: host.id === this.localParticipant.id,
    });

    if (!host || host.id !== this.localParticipant?.id) return;

    this.logger.log('video conference @ validate if in the room has host - set host', host);

    hostId.publish(host.id);
    this.roomState.setHost(host.id);
  };
}
