import { PresenceEvent, PresenceEvents, Room, SocketEvent } from '@superviz/socket-client';

import { TranscriptState } from '../../common/types/events.types';
import { ParticipantType, VideoParticipant } from '../../common/types/participant.types';
import { RealtimeStateTypes } from '../../common/types/realtime.types';
import { StoreType } from '../../common/types/stores.types';
import { Logger, Observer } from '../../common/utils';
import { useStore } from '../../common/utils/use-store';
import { DrawingData } from '../video-conference-manager/types';

import { RoomPropertiesEvents, VideoRoomProperties } from './type';

export class RoomStateService {
  private room: Room;
  private logger: Logger;
  private myParticipant: Partial<VideoParticipant> = {};
  private localRoomProperties: VideoRoomProperties = null;
  private drawingData: DrawingData = null;
  private enableSync: boolean;
  private left: boolean;
  private isSyncFrozen: boolean;
  private state: RealtimeStateTypes = RealtimeStateTypes.DISCONNECTED;
  private readonly MESSAGE_SIZE_LIMIT = 60000;
  private useStore: typeof useStore = useStore.bind(this);
  public kickParticipantObserver: Observer;
  private started: boolean;
  private drawingRoom: Room;

  constructor(room: Room, drawingRoom: Room, logger: Logger) {
    this.room = room;
    this.drawingRoom = drawingRoom;

    this.logger = logger;
    this.kickParticipantObserver = new Observer({ logger: this.logger });

    const { localParticipant, participants } = this.useStore(StoreType.GLOBAL);

    localParticipant.subscribe((participant) => {
      this.enableSync = participant.type !== ParticipantType.AUDIENCE;
      this.myParticipant = {
        ...this.myParticipant,
        ...participant,
      };
    });

    participants.subscribe();

    this.join();
  }

  /**
   * @function join
   * @description subscribes to room events
   * @returns {void}
   */
  private join = (): void => {
    this.room.presence.on(PresenceEvents.LEAVE, this.onParticipantLeave);
    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onPresenceEnter);

    if (!this.enableSync) return;
    this.room.on(RoomPropertiesEvents.UPDATE, this.updateLocalRoomState);
    this.drawingRoom.presence.on(PresenceEvents.UPDATE, this.updateDrawing);
  };

  /**
   * @function updateMyProperties
   * @param {Partial<VideoParticipant>} newProperties
   * @description updates local participant properties
   * @returns {void}
   */
  public updateMyProperties = (newProperties?: Partial<VideoParticipant>): void => {
    const properties = newProperties ?? ({} as VideoParticipant);

    if (this.isMessageTooBig(properties) || this.left || !this.enableSync || this.isSyncFrozen) {
      return;
    }

    if (properties.avatar === undefined) {
      delete properties.avatar;
    }

    this.myParticipant = {
      ...this.myParticipant,
      ...properties,
    };

    this.room.presence.update(this.myParticipant);
    this.logger.log('REALTIME', 'updating my properties', this.myParticipant);
  };

  /**
   * @function isMessageTooBig
   * @description calculates the size of a sync message and checks if it's bigger than limit
   * @param {unknown} msg
   * @param {number} limit
   * @returns {boolean}
   */
  private isMessageTooBig = (msg: unknown, limit: number = this.MESSAGE_SIZE_LIMIT): boolean => {
    const messageString = JSON.stringify(msg);
    const size = new TextEncoder().encode(messageString).length;

    if (size > limit) {
      this.logger.log('Message too long, the message limit size is 60kb.');
      return true;
    }
    return false;
  };

  /**
   * @function updateRoomProperties
   * @param {VideoRoomProperties} properties
   * @description updates room properties
   * @returns {void}
   */
  public updateRoomProperties = (properties: VideoRoomProperties): void => {
    if (this.isMessageTooBig(properties) || this.isSyncFrozen || this.left) return;

    const newProperties = {
      ...this.localRoomProperties,
      ...properties,
    };

    this.localRoomProperties = newProperties;

    this.room.emit(RoomPropertiesEvents.UPDATE, newProperties);
  };

  /**
   * @function updateDrawingProperties
   * @param {DrawingData} data
   * @description updates drawing properties
   * @returns {void}
   */
  private updateDrawingProperties = (data: DrawingData): void => {
    if (this.isMessageTooBig(data) || this.isSyncFrozen || this.left) return;

    this.drawingData = {
      ...this.drawingData,
      ...data,
    };

    this.drawingRoom.presence.update(this.drawingData);
  };

  /**
   * @function setHost
   * @param {string} participantId
   * @description set a new host to the room
   * @returns {void}
   */
  public setHost = (participantId: string): void => {
    this.updateRoomProperties({ hostClientId: participantId });
  };

  /**
   * @function setKickParticipant
   * @param {string} kickParticipantId
   * @description set a participant to be kicked from the room
   * @returns {void}
   */
  public setKickParticipant = (kickParticipantId: string): Promise<void> => {
    if (!kickParticipantId) return;
    const { participants } = useStore(StoreType.GLOBAL);

    const participant = participants.value[kickParticipantId];
    this.updateRoomProperties({
      // @ts-ignore
      kickParticipant: participant,
    });
  };

  /**
   * @function setGridMode
   * @param {boolean} isGridModeEnabled
   * @description synchronizes the grid mode of the cameras in the room
   * @returns {void}
   */
  public setGridMode(isGridModeEnabled: boolean): void {
    this.updateRoomProperties({ isGridModeEnabled });
  }

  /**
   * @function setDrawing
   * @param drawing {DrawingData}  -  drawing payload*
   * @description synchronizes the drawing in the room
   * @returns {void}
   */
  public setDrawing(drawing: DrawingData): void {
    this.updateDrawingProperties(drawing);
  }

  /**
   * @function setTranscript
   * @param state {TranscriptState}
   * @description synchronizes the transcript state in the room
   * @returns {void}
   */
  public setTranscript(state: TranscriptState): void {
    this.updateRoomProperties({ transcript: state });
  }

  /**
   * @function initializeRoomProperties
   * @description
        Initializes the room properties,
        including setting the host client ID and updating the participant list.
   * @returns {Promise<void>}
   */
  private initializeRoomProperties = (): void => {
    const roomProperties: VideoRoomProperties = {
      isGridModeEnabled: false,
      hostClientId: null,
      followParticipantId: null,
      gather: false,
      transcript: TranscriptState.TRANSCRIPT_STOP,
      kickParticipant: null,
    };

    this.localRoomProperties = roomProperties;

    this.updateRoomProperties(roomProperties);
  };

  /**
   * @function onParticipantLeave
   * @returns {void}
   * @param presence
   */
  private onParticipantLeave = (presence: PresenceEvent): void => {
    if (presence.id === this.myParticipant.id) {
      this.left = true;
    }

    const followedLeft = presence.id === this.localRoomProperties?.followParticipantId;

    if (followedLeft) {
      this.setFollowParticipant();
    }
  };

  /**
   * @function fetchRoomProperties
   * @returns {VideoRoomProperties | null}
   */
  private async fetchRoomProperties(): Promise<unknown | null> {
    const presences: number = await new Promise<number>((resolve) => {
      this.room.presence.get((presences) => {
        if (!presences) resolve(0);

        resolve(presences.length);
      });
    });

    if (presences <= 1) return null;

    const lastMessage: SocketEvent<unknown> = await new Promise((resolve, reject) => {
      this.room.history((data) => {
        if (!data) reject(data);
        if (!data.events.length) resolve(null);

        const lastMessage = data.events.pop();

        resolve(lastMessage);
      });
    });

    const oneHour = 1000 * 60 * 60;
    const messageIsTooOld = lastMessage?.timestamp < Date.now() - oneHour;

    if (!lastMessage?.data || messageIsTooOld) return null;

    return lastMessage.data;
  }

  /**
   * @function start
   * @returns {Promise<void>}
   */
  public start = async (): Promise<void> => {
    if (this.started) return;
    this.started = true;

    if (!this.room['isJoined']) {
      this.logger.log('room state service - not joined room yet');
      setTimeout(() => {
        this.logger.log('room state service - retrying');
        this.start();
      }, 2000);
    }

    this.localRoomProperties = await this.fetchRoomProperties();

    if (!this.localRoomProperties) {
      this.initializeRoomProperties();
    } else {
      this.updateLocalRoomState({ data: this.localRoomProperties });
    }

    this.publishStateUpdate(RealtimeStateTypes.CONNECTED);
    this.logger.log('REALTIME', 'Joined realtime room');
  };

  /**
   * @function publishStateUpdate
   * @description saves the room locally and publishes it to the sdk
   * @param {RealtimeStateTypes} state
   * @returns
   */
  private publishStateUpdate(state: RealtimeStateTypes): void {
    if (this.state === state) return;

    this.state = state;

    this.logger.log(
      'REALTIME',
      `Realtime state did change. New state: ${RealtimeStateTypes[this.state]}`,
    );

    const { meetingState } = this.useStore(StoreType.VIDEO);
    meetingState.publish(this.state);
  }

  /**
   * @function onAblyPresenceEnter
   * @description callback that receives the event that a participant has entered the room
   * @returns {void}
   */
  private onPresenceEnter = (): void => {
    this.updateMyProperties();
  };

  /**
   * @function setFollowParticipant
   * @param {string} participantId
   * @description add/change and sync a property in the room
   * @returns {void}
   */
  public setFollowParticipant(participantId?: string): void {
    this.updateRoomProperties({ followParticipantId: participantId });
  }

  /**
   * @function setGather
   * @param {boolean} active
   * @description sync to all participants to go to the host position
   * @returns {void}
   */
  public setGather(active: boolean): void {
    this.updateRoomProperties({ gather: active });
  }

  /**
   * @function updateLocalRoomState
   * @description update room data
   * @param {VideoRoomProperties} data
   * @returns {void}
   */
  private updateLocalRoomState = async ({ data }: { data: VideoRoomProperties }): Promise<void> => {
    this.logger.log('REALTIME', 'Room update received', data);
    this.localRoomProperties = Object.assign({}, this.localRoomProperties, data);

    const { followParticipantId, gather, hostId, isGridModeEnabled, transcript } = this.useStore(
      StoreType.VIDEO,
    );

    followParticipantId.publish(data.followParticipantId);
    gather.publish(data.gather);
    hostId.publish(data.hostClientId);
    isGridModeEnabled.publish(data.isGridModeEnabled);
    transcript.publish(data.transcript);

    if (data.kickParticipant && data.kickParticipant.id === this.myParticipant.id) {
      this.updateRoomProperties({ kickParticipant: null });

      this.kickParticipantObserver.publish(this.myParticipant.id);
    }
  };

  private updateDrawing = (event: PresenceEvent<DrawingData>): void => {
    if (event.id === this.myParticipant.id) return;

    const { drawing } = this.useStore(StoreType.VIDEO);
    drawing.publish(event.data);
  };

  /**
   * @function freezeSync
   * @param {boolean} isFrozen
   * @description Detaches and unsubscribes from channels to freeze synchronization with the room.
   * @returns {void}
   */
  public freezeSync = (isFrozen: boolean): void => {
    this.isSyncFrozen = isFrozen;

    if (isFrozen) {
      this.destroy();
      return;
    }

    this.join();
  };

  /**
   * @function destroy
   * @description stopsthe service
   */
  public destroy() {
    this.room.presence.off(PresenceEvents.LEAVE);
    this.room.presence.off(PresenceEvents.JOINED_ROOM);
    this.drawingRoom.presence.off(PresenceEvents.UPDATE);

    this.room.off(RoomPropertiesEvents.UPDATE, this.updateLocalRoomState);
  }
}
