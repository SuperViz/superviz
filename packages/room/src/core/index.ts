import type { PresenceEvent, Room as SocketRoomType } from '@superviz/socket-client';
import { Subject, Subscription, timestamp } from 'rxjs';

import { Component, ComponentNames, PresenceMap } from '../common/types/component.types';
import { Group } from '../common/types/group.types';
import { InitialParticipant, Participant } from '../common/types/participant.types';
import { Logger } from '../common/utils/logger';
import config from '../services/config';
import { ComponentLimits, Limit } from '../services/config/types';
import { EventBus } from '../services/event-bus';
import { IOC } from '../services/io';
import { IOCState } from '../services/io/types';
import { SlotService } from '../services/slot';
import { StoreType } from '../stores/common/types';
import { useStore } from '../stores/common/use-store';

import { GeneralEvent, ParticipantEvent, RoomEventPayload, RoomParams, Callback, EventOptions, RoomEvent, RoomState } from './types';

export class Room {
  private participant: Participant;

  private io: IOC;
  private room: SocketRoomType;

  private slotService: SlotService;
  private eventBus: EventBus;
  private logger: Logger;

  private useStore = useStore.bind(this) as typeof useStore;

  private participants: Record<string, Participant>;
  private group: Group;
  private state: RoomState = RoomState.DISCONNECTED;
  private isDestroyed = false;

  private subscriptions: Map<Callback<GeneralEvent>, Subscription> = new Map();
  private observers: Map<string, Subject<unknown>> = new Map();

  private activeComponents: Set<ComponentNames | string> = new Set();
  private componentInstances: Map<ComponentNames | string, Component> = new Map();
  private componentsToAttachAfterJoin: Set<Component> = new Set();

  constructor(params: RoomParams) {
    this.io = new IOC(params.participant);
    this.participant = this.createParticipant(params.participant);
    this.logger = new Logger('@superviz/room/room');
    this.eventBus = new EventBus();

    this.logger.log('room created', this.participant);
    this.init();
  }

  /**
   * @description leave the room, destroy the socket connnection and all attached components
   */
  public leave() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.state = RoomState.DISCONNECTED;
    this.unsubscribeFromRoomEvents();

    this.emit(ParticipantEvent.PARTICIPANT_LEFT, this.participant);
    this.emit(ParticipantEvent.MY_PARTICIPANT_LEFT, this.participant);

    this.room.disconnect();
    this.io.destroy();

    this.subscriptions.forEach((subscription) => {
      subscription?.unsubscribe();
    });

    this.observers.forEach((observer) => {
      observer.complete();
    });

    this.subscriptions.clear();
    this.observers.clear();
    this.participants = {};

    const { destroy: destroyStore, hasJoinedRoom } = this.useStore(StoreType.GLOBAL);

    hasJoinedRoom.publish(false);
    destroyStore();

    this.eventBus?.destroy();

    if (typeof window !== 'undefined') {
      delete window.SUPERVIZ_ROOM;
    }
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
    this.logger.log('room @ subscribe', event);

    let subject = this.observers.get(event);

    if (!subject) {
      subject = new Subject<RoomEventPayload<E>>();
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
    this.logger.log('room @ unsubscribe', event);

    if (!callback) {
      this.observers.delete(event as string);
      return;
    }

    this.subscriptions.get(callback)?.unsubscribe();
    this.subscriptions.delete(callback);
  }

  /**
   * Retrieves the list of participants in the room.
   *
   * @returns {Promise<Participant[]>} A promise that resolves to an array of participants.
   *
   * @remarks
   * - If the room is not connected or the state is not `IOCState.CONNECTED`,
      an empty array is returned.
   */
  public async getParticipants(): Promise<Participant[]> {
    if (!this.room || this.state !== RoomState.CONNECTED) {
      return [];
    }

    const participants = await new Promise<Participant[]>((resolve) => {
      this.room.presence.get((presences) => {
        const mapped = presences.map((presence) => {
          return this.transfromSocketMesssageToParticipant(presence);
        });

        const { participants } = this.useStore(StoreType.GLOBAL);
        const newParticipants: Record<string, Participant> = {};

        mapped.forEach((participant) => {
          newParticipants[participant.id] = participant;
        });

        participants.publish(newParticipants);
        resolve(mapped);
      });
    });

    return participants;
  }

  /**
   * Adds a component to the room. If the component can be added and the user has joined the room,
   * the component will be attached and initialized with the necessary dependencies. If the user
   * has not joined the room yet, the component will be queued to be attached after joining.
   *
   * @param component - A partial component object to be added to the room.
   * @returns A promise that resolves when the component has been added or queued.
   */
  public async addComponent(component: Partial<Component>) {
    if (!this.canAddComponent(component)) return;

    const { hasJoinedRoom } = this.useStore(StoreType.GLOBAL);

    this.logger.log('room @ addComponent', component.name);

    if (!hasJoinedRoom.value) {
      this.logger.log('room @ addComponent - not joined yet');
      this.componentsToAttachAfterJoin.add(component as Component);
      return;
    }

    const componentLimit = this.checkComponentLimit(component.name);

    component.attach({
      ioc: this.io,
      config: config.configuration,
      eventBus: this.eventBus,
      useStore,
      connectionLimit: componentLimit.maxParticipants,
    });

    this.activeComponents.add(component.name);
    this.componentInstances.set(component.name, component as Component);
    this.updateParticipant({ activeComponents: Array.from(this.activeComponents) });
  }

  /**
   * Removes a component from the active components list
    and updates the participant's active components.
   *
   * @param component - A partial component object that
    contains at least the name of the component to be removed.
   *
   * @remarks
   * If the component is not initialized
    (i.e., not present in the active components list),
    a log message will be generated and the removal process will be aborted.
   *
   * @returns A promise that resolves when the component has been successfully removed.
   */
  public async removeComponent(component: Partial<Component>) {
    if (!this.activeComponents.has(component.name)) {
      const message = `[SuperViz] Component ${component.name} is not initialized yet.`;
      this.logger.log(message);
      console.error(message);
      return;
    }

    component?.detach();

    this.activeComponents.delete(component.name);
    this.componentInstances.delete(component.name);

    this.updateParticipant({ activeComponents: Array.from(this.activeComponents) });
  }

  /**
   * @description Initializes the room features
   */
  private init() {
    const { participants, group, localParticipant } = this.useStore(StoreType.GLOBAL);

    group.publish(config.get('group'));
    participants.subscribe();
    group.subscribe();

    this.io.stateSubject.subscribe(this.onConnectionStateChange);
    this.room = this.io.createRoom('room', 'unlimited');
    this.slotService = new SlotService(this.room, this.participant);

    this.subscribeToRoomEvents();
  }

  private canAddComponent(component: Partial<Component>): boolean {
    const isProvidedFeature = config.get<boolean>(`features.${component.name}`);
    const componentLimit = this.checkComponentLimit(component.name);

    const isComponentActive = this.activeComponents.has(component.name);

    const verifications = [
      {
        isValid: isProvidedFeature,
        message: `[SuperViz] The component "${component.name}" is not enabled in the room.`,
      },
      {
        isValid: !this.isDestroyed,
        message:
        '[SuperViz] The component cannot be added because the room is not connected. Please initialize a new room to add and use components.',
      },
      {
        isValid: !isComponentActive,
        message: `[SuperViz] The component "${component.name}" is already active. Please remove it first.`,
      },
      {
        isValid: componentLimit.canUse,
        message: `[SuperViz] You have reached the usage limit for the component "${component.name}".`,
      },
    ];

    const verification = verifications.find((v) => !v.isValid);

    if (verification) {
      this.logger.log(verification.message);
      console.error(verification.message);
      return false;
    }

    return true;
  }

  private checkComponentLimit(name: ComponentNames | string): Limit {
    const limits = config.get<ComponentLimits>('limits');
    const componentName = PresenceMap[name] ?? name;

    const componentLimit = limits?.[componentName] ?? { canUse: false, maxParticipants: 50 };

    return componentLimit;
  }

  /**
   * Updates the participant information with the provided data.
   *
   * @param data - Partial data to update the participant with.
   *               Only the fields provided in the data will be updated.
   */
  private updateParticipant(data: Partial<Participant>): void {
    const participant = { ...this.participant, ...data };

    this.logger.log('room @ updateParticipant', participant);

    this.room.presence.update(participant);
  }

  /**
   * Transforms a socket message into a Participant object.
   *
   * @param message - The presence event containing the participant data.
   * @returns The transformed Participant object.
   */
  private transfromSocketMesssageToParticipant(
    message: PresenceEvent<Participant | {}>,
  ): Participant {
    const participant = message.data as Participant;

    return {
      id: message.id,
      name: participant?.name ? participant.name : message.name,
      activeComponents: participant?.activeComponents ?? [],
      email: participant?.email ?? null,
      slot: participant?.slot ?? SlotService.getDefaultSlot(),
    };
  }

  /**
   * Creates a new participant with the given initial data and assigns default slot properties.
   *
   * @param initialData - The initial data for the participant.
   * @returns A new participant object with the provided initial data and default slot properties.
   */
  private createParticipant(initialData: InitialParticipant): Participant {
    const participant = {
      id: initialData.id,
      name: initialData.name,
      email: initialData.email ?? null,
      activeComponents: [],
      slot: SlotService.getDefaultSlot(),
    };

    const { localParticipant } = this.useStore(StoreType.GLOBAL);
    localParticipant.publish(participant);

    return participant;
  }

  /**
   * Subscribes to room events such as participant joining, leaving, and updating.
   *
   * This method sets up listeners for the following events:
   * - `presence.joined-room`: Triggered when a participant joins the room.
   * - `presence.leave`: Triggered when a participant leaves the room.
   * - `presence.update`: Triggered when a participant updates their presence.
   *
   * The corresponding event handlers are:
   * - `onParticipantJoinedRoom`
   * - `onParticipantLeavesRoom`
   * - `onParticipantUpdates`
   */
  private subscribeToRoomEvents() {
    this.room.presence.on('presence.joined-room', this.onParticipantJoinedRoom);
    this.room.presence.on('presence.leave', this.onParticipantLeavesRoom);
    this.room.presence.on('presence.update', this.onParticipantUpdates);
  }

  /**
   * Unsubscribes from room presence events.
   *
   * This method removes the event listeners for the following room presence events:
   * - 'presence.joined-room': Triggered when a user joins the room.
   * - 'presence.leave': Triggered when a user leaves the room.
   * - 'presence.update': Triggered when a user's presence is updated.
   */
  private unsubscribeFromRoomEvents() {
    this.room.presence.off('presence.joined-room');
    this.room.presence.off('presence.leave');
    this.room.presence.off('presence.update');
  }

  /**
   * Emits an event to the observers.
   *
   * @template E - The type of the event.
   * @param event - The event options containing the event type.
   * @param data - The payload data associated with the event.
   * @returns void
   */
  private emit<E extends GeneralEvent>(
    event: EventOptions<E>,
    data: RoomEventPayload<E>,
  ): void {
    const subject = this.observers.get(event);

    if (!subject) return;

    subject.next(data);
  }

  /**
   *
   * Callbacks
   *
   */

  /**
   * Handles the event when a participant joins the room.
   *
   * @param data - The event data containing information about the participant.
   * @fires ParticipantEvent.PARTICIPANT_JOINED - Emitted when a participant joins the room.
   */
  private onParticipantJoinedRoom = (data: PresenceEvent<{}>) => {
    if (this.participant.id === data.id) {
      this.onLocalParticipantJoinedRoom(data);
    } else {
      const { participants } = this.useStore(StoreType.GLOBAL);
      const newParticipants = { ...this.participants };
      newParticipants[data.id] = this.transfromSocketMesssageToParticipant(data);
      participants.publish(newParticipants);
      this.logger.log('participant joined room @ update participants', this.participants);
    }

    this.emit(ParticipantEvent.PARTICIPANT_JOINED, this.transfromSocketMesssageToParticipant(data));
  };

  /**
   * Handles the event when a local participant joins the room.
   *
   * @param data - The presence event data associated with the participant joining.
   * @fires ParticipantEvent.MY_PARTICIPANT_JOINED - Emitted when the local participant joins
   * the room.
   */
  private onLocalParticipantJoinedRoom = async (data: PresenceEvent<{}>) => {
    this.updateParticipant(this.participant);

    await this.getParticipants();

    const { hasJoinedRoom } = this.useStore(StoreType.GLOBAL);

    hasJoinedRoom.publish(true);
    this.emit(
      ParticipantEvent.MY_PARTICIPANT_JOINED,
      this.transfromSocketMesssageToParticipant(data),
    );

    this.componentsToAttachAfterJoin.forEach((component) => {
      this.logger.log('room @ attachComponentAfterJoin', component.name);
      this.addComponent(component);
    });

    this.logger.log('local participant joined room @ update participants', this.participants);
  };

  /**
   * Handles the event when a participant leaves the room.
   *
   * @param data - The presence event data containing the participant information.
   * @fires ParticipantEvent.PARTICIPANT_LEFT - Emitted when a participant leaves the room.
   */
  private onParticipantLeavesRoom = (data: PresenceEvent<Participant>) => {
    const { participants } = this.useStore(StoreType.GLOBAL);

    const newParticipants = { ...this.participants };
    delete newParticipants[data.id];
    participants.publish(newParticipants);

    this.emit(ParticipantEvent.PARTICIPANT_LEFT, this.transfromSocketMesssageToParticipant(data));
    this.logger.log('participant leaves room @ update participants', this.participants);
  };

  /**
   * Handles participant updates received from a presence event.
   *
   * @param data - The presence event containing participant data.
   * @fires ParticipantEvent.PARTICIPANT_UPDATED - Emitted when a participant's data is updated.
   */
  private onParticipantUpdates = (data: PresenceEvent<Participant>) => {
    if (this.participant.id === data.data.id) {
      this.onLocalParticipantUpdates(data);
    }

    const { participants } = this.useStore(StoreType.GLOBAL);
    const newParticipants = { ...this.participants };
    newParticipants[data.data.id] = data.data;
    participants.publish(newParticipants);

    this.logger.log('participant updates @ update participants', this.participants);

    this.emit(ParticipantEvent.PARTICIPANT_UPDATED, data.data);
  };

  /**
   * Handles updates to the local participant's presence.
   *
   * @param data - The presence event containing the updated participant data.
   * @fires ParticipantEvent.MY_PARTICIPANT_UPDATED - Emitted when the local participant's data
   * is updated.
   */
  private onLocalParticipantUpdates = (data: PresenceEvent<Participant>) => {
    const { localParticipant } = this.useStore(StoreType.GLOBAL);

    localParticipant.publish(data.data);
    this.participant = data.data;
    this.emit(ParticipantEvent.MY_PARTICIPANT_UPDATED, data.data);
  };

  /**
   * Handles authentication errors during room initialization.
   *
   * This method logs an error message indicating that the website's domain is not whitelisted.
   * It emits an `ERROR` event with the error code 'auth_error' and the error message.
   * Finally, it calls the `leave` method to exit the room.
   *
   * @fires RoomEvent.ERROR - Emitted when an authentication error occurs.
   */
  private onAuthError = () => {
    const message = "[SuperViz] Room initialization failed: this website's domain is not whitelisted. If you are the developer, please add your domain in https://dashboard.superviz.com/developer";

    this.logger.log(message);
    console.error(message);

    this.emit(RoomEvent.ERROR, { code: 'auth_error', message });
    this.leave();
  };

  /**
   * Handles the error when a user tries to connect to a room with the same account that is already
   * connected.
   * Logs the error message, emits an error event, and leaves the room.
   *
   * @fires RoomEvent.ERROR - Emitted when a user tries to connect to a room with the same account.
   */
  private onSameAccountError = () => {
    const message = '[SuperViz] Room initialization failed: the user is already connected to the room. Please verify if the user is connected with the same account and try again.';

    this.logger.log(message);
    console.error(message);

    this.emit(RoomEvent.ERROR, { code: 'same_account_error', message });
    this.leave();
  };

  /**
   * @description Handles changes in the connection state.
   *
   * @param {IOCState} state - The current state of the connection.
   */
  private onConnectionStateChange = (state: IOCState): void => {
    this.logger.log('connection state changed', state);

    const common = (state: RoomState) => {
      this.emit(RoomEvent.UPDATE, { status: state });
      this.state = state;
    };

    const map = {
      [IOCState.CONNECTING]: () => common(RoomState.CONNECTING),
      [IOCState.CONNECTION_ERROR]: () => common(RoomState.CONNECTION_ERROR),
      [IOCState.CONNECTED]: () => common(RoomState.CONNECTED),
      [IOCState.DISCONNECTED]: () => common(RoomState.DISCONNECTED),
      [IOCState.RECONNECTING]: () => common(RoomState.RECONNECTING),
      [IOCState.RECONNECT_ERROR]: () => common(RoomState.RECONNECT_ERROR),

      // error
      [IOCState.AUTH_ERROR]: () => this.onAuthError(),
      [IOCState.SAME_ACCOUNT_ERROR]: () => this.onSameAccountError(),
    };

    map[state]?.();
  };
}
