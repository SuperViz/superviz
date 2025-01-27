import type { AttachComponentOptions } from '@superviz/room/dist/common/types/component.types';
import type { Group } from '@superviz/room/dist/common/types/group.types';
import type { Configuration } from '@superviz/room/dist/services/config/types';
import type { EventBus } from '@superviz/room/dist/services/event-bus';
import type { IOC } from '@superviz/room/dist/services/io';
import type { useStore } from '@superviz/room/dist/stores/common/use-store';
import type { Room } from '@superviz/socket-client';
import { Subject, Subscription } from 'rxjs';

import { Participant, ParticipantType } from '../../common/types/participant.types';
import { Logger } from '../../common/utils/logger';
import VideoManager from '../../services/video-manager';
import { VideoFrameState, VideoManagerOptions } from '../../services/video-manager/types';

import { Callback, EventOptions, EventPayload, GeneralEvent } from './types';

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
  protected unsubscribeFrom: Array<(id: unknown) => void> = [];
  protected globalConfig: Partial<Configuration>;
  protected localParticipant: Participant;

  protected subscriptions: Map<Callback<GeneralEvent>, Subscription> = new Map();
  protected observers: Map<string, Subject<unknown>> = new Map();

  protected videoManager: VideoManager;

  attach(params: AttachComponentOptions) {
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
