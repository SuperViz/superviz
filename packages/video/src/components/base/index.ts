import type { AttachComponentOptions } from '@superviz/room/dist/common/types/component.types';
import type { Group } from '@superviz/room/dist/common/types/group.types';
import type { Configuration } from '@superviz/room/dist/services/config/types';
import type { EventBus } from '@superviz/room/dist/services/event-bus';
import type { IOC } from '@superviz/room/dist/services/io';
import type { useStore } from '@superviz/room/dist/stores/common/use-store';
import type { PresenceEvent, Room } from '@superviz/socket-client';
import { Subject, Subscription } from 'rxjs';

import { EventBusEvent, RealtimeEvent } from '../../common/types/events.types';
import { Participant, ParticipantType, VideoParticipant } from '../../common/types/participant.types';
import { Logger } from '../../common/utils/logger';
import { ConnectionService } from '../../services/connection-status';
import { RoomState } from '../../services/room-state';
import VideoManager from '../../services/video-manager';
import { RealtimeObserverPayload, VideoFrameState, VideoManagerOptions } from '../../services/video-manager/types';

import { Callback, EventOptions, EventPayload, GeneralEvent } from './types';

const KICK_PARTICIPANTS_TIME = 1000 * 60;
let KICK_PARTICIPANTS_TIMEOUT: ReturnType<typeof setTimeout> | null = null;
export abstract class BaseComponent {
  public name: 'videoConference' = 'videoConference';
  protected abstract logger: Logger;
  protected abstract videoManagerConfig: VideoManagerOptions
  protected connectionLimit: number | 'unlimited';
  protected group: Group;
  protected ioc: IOC;
  protected eventBus: EventBus;
  protected isAttached = false;
  protected useStore: typeof useStore;
  protected room: Room;
  protected drawingRoom: Room;
  protected unsubscribeFrom: Array<(id: unknown) => void> = [];

  protected globalConfig: Partial<Configuration>;

  protected kickParticipantsOnHostLeave: boolean = false;
  protected participantType: ParticipantType;

  protected localParticipant: Participant;
  protected participantsOnMeeting: VideoParticipant[] = [];
  protected participants: Participant[] = [];

  protected subscriptions: Map<Callback<GeneralEvent>, Subscription> = new Map();
  protected observers: Map<string, Subject<unknown>> = new Map();

  protected videoManager: VideoManager;
  protected connectionService: ConnectionService;
  protected roomState: RoomState;

  constructor() {
    this.connectionService = new ConnectionService();
    this.connectionService.addListeners();
  }

  public attach(params: AttachComponentOptions) {
    this.useStore = params.useStore.bind(this);

    if (Object.values(params).includes(null) || Object.values(params).includes(undefined)) {
      const message = `${this.name} @ attach - params are required`;

      this.logger.log(message);
      throw new Error(message);
    }

    const { config: globalConfig, eventBus, ioc } = params;
    const { hasJoinedRoom, localParticipant } = this.useStore('global-store');
    localParticipant.subscribe();

    this.globalConfig = globalConfig;
    this.eventBus = eventBus;
    this.isAttached = true;
    this.ioc = ioc;
    this.connectionLimit = params.connectionLimit ?? 50;

    this.room = ioc.createRoom(this.name, this.connectionLimit);
    this.drawingRoom = ioc.createRoom(this.name, this.connectionLimit);
    this.subscribeToRealtimeEvents();

    this.roomState = new RoomState(this.room);
    this.subscribeToStateEvents();

    if (!hasJoinedRoom.value) {
      this.logger.log(`${this.name} @ attach - not joined yet`);

      setTimeout(() => {
        this.logger.log(`${this.name} @ attach - retrying`);
        this.attach(params);
      }, 1000);

      return;
    }

    this.logger.log(`${this.name} @ attached`);

    this.start();
  }

  public detach = (): void => {
    if (!this.isAttached) {
      this.logger.log(`${this.name} @ detach - component is not attached`);
      return;
    }

    this.logger.log('detached');

    this.destroy();
    this.room.disconnect();
    this.room = undefined;
    this.videoManager?.leave();
    this.connectionService.removeListeners();
    this.roomState.stop();

    this.unsubscribeFrom.forEach((unsubscribe) => unsubscribe(this));
    this.isAttached = false;

    this.subscriptions.forEach((subscription) => {
      subscription?.unsubscribe();
    });

    this.observers.forEach((observer) => {
      observer.complete();
    });

    this.subscriptions.clear();
    this.observers.clear();

    this.unsubscribeFromVideoEvents();
    this.unsubscribeToRealtimeEvents();
  };

  /**
   * Emits an event to the observers.
   *
   * @template E - The type of the event.
   * @param event - The event options containing the event type.
   * @param data - The payload data associated with the event.
   * @returns void
   */
  protected emit<E extends GeneralEvent>(
    event: EventOptions<E>,
    data: EventPayload<E>,
  ): void {
    const subject = this.observers.get(event);

    if (!subject) return;

    subject.next(data);
  }

  /**
   * @description Listen to an event
   * @param event - The event to listen to
   * @param callback - The callback to execute when the event is emitted
   * @returns {void}
   */
  public subscribe<E extends GeneralEvent>(
    event: EventOptions<E>,
    callback: Callback<E>,
  ): void {
    this.logger.log('video @ subscribe', event);

    let subject = this.observers.get(event);

    if (!subject) {
      subject = new Subject<EventPayload<E>>();
      this.observers.set(event, subject);
    }

    this.subscriptions.set(callback, subject.subscribe(callback));
  }

  /**
   * @description Stop listening to an event
   * @param event - The event to stop listening to
   * @param callback - The callback to remove from the event
   * @returns {void}
   */
  public unsubscribe<E extends GeneralEvent>(
    event: EventOptions<E>,
    callback?: Callback<E>,
  ): void {
    this.logger.log('video @ unsubscribe', event);

    if (!callback) {
      this.observers.delete(event as string);
      return;
    }

    this.subscriptions.get(callback)?.unsubscribe();
    this.subscriptions.delete(callback);
  }

  protected abstract destroy(): void;
  protected abstract start(): void;

  protected startVideoManager() {
    this.videoManager = new VideoManager(this.videoManagerConfig);
    this.subscribeToVideoEvents();
  }

  protected updateParticipant(data: Participant) {
    const props = Object.assign(this.localParticipant, data);

    this.room.presence.update(props);
    this.localParticipant = props;
  }

  private createFrameParticipant(participant: Participant) {
    return {
      id: participant.id,
      participantId: participant.id,
      color: participant.slot?.color || '#878291',
      name: participant.name,
      isHost: false,
      avatar: participant.avatar,
      type: participant.type,
      slot: participant.slot,
    };
  }

  private subscribeToRealtimeEvents() {
    this.room.presence.on('presence.joined-room', this.onPresenceJoinedRoom);
    this.room.presence.on('presence.update', this.onPresenceUpdate);
    this.room.presence.on('presence.leave', this.onPresenceLeave);
  }

  private unsubscribeToRealtimeEvents() {
    this.room?.presence.off('presence.joined-room');
    this.room?.presence.off('presence.update');
    this.room?.presence.off('presence.leave');
  }

  private subscribeToStateEvents() {
    this.roomState?.hostObserver.subscribe((hostId) => {
      console.log('here', hostId);
      this.videoManager.publishMessageToFrame(RealtimeEvent.REALTIME_HOST_CHANGE, hostId);
    });
  }

  private validateIfInTheRoomHasHost = async (): Promise<void> => {
    const { hostId } = this.roomState.state;

    const participantsList = await new Promise<PresenceEvent<VideoParticipant>[]>(
      (resolve, reject) => {
        this.room.presence.get(
          (data: PresenceEvent<VideoParticipant>[]) => resolve(data),
          (error) => {
            const message = `[SuperViz] ${error.name} - ${error.message}`;
            this.logger.log(error);
            console.error(message);
            reject(error);
          },
        );
      },
    );

    // list with all participants that have the type host and are in the meeting
    const participantsCanBeHost = participantsList.filter(
      (participant: PresenceEvent<VideoParticipant>) => {
        return (
          participant.data.type === ParticipantType.HOST
            && this.participantsOnMeeting.some((p) => p.id === participant.id)
        );
      },
    );

    this.logger.log(
      'video conference @ validate if in the room has host - conditions to init kick all participants timeout',
      {
        participantsCanBeHost,
        participantListInTheStore: participantsList,
        participantsOnMeeting: this.participantsOnMeeting,
        kickParticipantsOnHostLeave: this.kickParticipantsOnHostLeave,
        localParticipantCanBeHost: this.localParticipant?.type === ParticipantType.HOST,
        kickParticipantsTimeout: KICK_PARTICIPANTS_TIMEOUT,
      },
    );

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

    const hostAlreadyInRoom = participantsList.find(
      (participant) => participant?.id === hostId,
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

      if (!previous || current?.id === hostId) {
        return current;
      }

      // set the first participant with host privileges as host
      if (current?.timestamp > previous.timestamp) {
        return previous;
      }

      return current;
    }, null) as unknown as VideoParticipant;

    this.room.presence.update<VideoParticipant>({
      ...this.localParticipant,
      isHost: host.id === this.localParticipant.id,
    });

    if (!host || host.id !== this.localParticipant?.id) return;

    this.logger.log('video conference @ validate if in the room has host - set host', host);

    this.roomState.update({ hostId: host.id });
    this.videoManager.publishMessageToFrame(RealtimeEvent.REALTIME_HOST_CHANGE, host.id);
  };

  private onKickLocalParticipant = (): void => {
    this.logger.log('video conference @ on kick local participant');

    this.detach();
  };

  private onPresenceJoinedRoom = (presence: PresenceEvent<Participant>): void => {
    if (presence.id !== this.localParticipant.id) return;

    this.room.presence.get((data: PresenceEvent<Participant>[]) => {
      this.participants = data.map((presence) => {
        if (this.localParticipant.id === presence.id) {
          return this.localParticipant;
        }

        return presence.data;
      });
    });

    this.room.presence.update(this.localParticipant);
    this.roomState.start();
  };

  private onPresenceUpdate = (presence: PresenceEvent<Participant>) => {
    if (!this.participants.some((p) => p.id === presence.id)) {
      this.participants.push(presence.data);
    } else {
      this.participants = this.participants.map((participant) => {
        if (participant.id === presence.id) {
          return presence.data;
        }

        return participant;
      });
    }

    const event = this.participants.map(this.createFrameParticipant);

    this.videoManager?.publishMessageToFrame(
      RealtimeEvent.REALTIME_PARTICIPANT_LIST_UPDATE,
      event,
    );
  };

  private onPresenceLeave = (presence: PresenceEvent<Participant>): void => {
    this.participants = this.participants.filter((p) => p.id !== presence.id);
  };

  private subscribeToVideoEvents() {
    this.videoManager.meetingConnectionObserver.subscribe(
      this.connectionService.updateMeetingConnectionStatus,
    );
    this.videoManager.participantListObserver.subscribe(this.onParticipantListUpdate);
    this.videoManager.frameStateObserver.subscribe(this.onFrameStateChange);
    this.videoManager.participantJoinedObserver.subscribe(this.onParticipantJoined);
    this.videoManager.participantLeftObserver.subscribe(this.onParticipantLeft);
    this.videoManager.realtimeEventsObserver.subscribe(this.onRealtimeEventFromFrame);
  }

  private unsubscribeFromVideoEvents = (): void => {
    if (!this.videoManager) return;

    this.logger.log('video conference @ unsubscribe from video events');

    this.videoManager.meetingConnectionObserver.unsubscribe(
      this.connectionService.updateMeetingConnectionStatus,
    );
    this.videoManager.participantListObserver.unsubscribe(this.onParticipantListUpdate);
    this.videoManager.frameStateObserver.unsubscribe(this.onFrameStateChange);
    this.videoManager.participantJoinedObserver.unsubscribe(this.onParticipantJoined);
    this.videoManager.participantLeftObserver.unsubscribe(this.onParticipantLeft);
    this.videoManager.realtimeEventsObserver.unsubscribe(this.onRealtimeEventFromFrame);
  };

  private onRealtimeEventFromFrame = ({ event, data }: RealtimeObserverPayload): void => {
    this.logger.log('video conference @ on realtime event from frame', event, data);

    const _ = {
      [RealtimeEvent.REALTIME_HOST_CHANGE]: (hostId: string) => this.roomState.update({
        hostId,
      }),
    }[event](data);
  };

  private onParticipantListUpdate = (participants: Record<string, VideoParticipant>) => {
    const list: VideoParticipant[] = Object.values(participants).map((participant) => ({
      id: participant.id,
      slot: participant.slot,
      avatar: participant.avatar,
      name: participant.name,
      type: participant.type,
      isHost: participant.isHost ?? false,
      color: participant.slot?.color || '#878291',
      activeComponents: participant.activeComponents,
      participantId: participant.id,
      email: participant.email,
    }));

    this.participantsOnMeeting = list;
    this.validateIfInTheRoomHasHost();
  };

  private onFrameStateChange = (state: VideoFrameState): void => {
    this.logger.log('video conference @ on frame state change', state);

    if (state !== VideoFrameState.INITIALIZED) return;

    if (this.participantType !== ParticipantType.GUEST) {
      this.updateParticipant(Object.assign(this.localParticipant, {
        type: this.participantType,
      }));
    }

    this.videoManager.start({
      participant: this.localParticipant,
    });
  };

  private onParticipantJoined = (participant: VideoParticipant) => {
    const { localParticipant, participants } = this.useStore('global-store');

    const updated: Participant = Object.assign({}, localParticipant.value, {
      name: participant.name,
      type: participant.type,
    });

    if (this.videoManagerConfig.canUseDefaultAvatars) {
      updated.avatar = participant.avatar;
    }

    this.eventBus.publish(EventBusEvent.UPDATE_PARTICIPANT, updated);
    this.eventBus.publish(EventBusEvent.UPDATE_PARTICIPANT_LIST, {
      ...participants.value,
      [participant.id]: updated,
    });

    this.updateParticipant(updated);
  };

  private onParticipantLeft = (participant: VideoParticipant) => {
    const { localParticipant, participants } = this.useStore('global-store');

    const updated = Object.assign({}, localParticipant.value, {
      activeComponents: localParticipant.value.activeComponents?.filter(
        (ac) => ac !== 'videoConference',
      ) ?? [],
    }) as Participant;

    this.eventBus.publish(EventBusEvent.UPDATE_PARTICIPANT, updated);
    this.eventBus.publish(EventBusEvent.UPDATE_PARTICIPANT_LIST, {
      ...participants.value,
      [participant.id]: updated,
    });

    this.detach();
  };
}
