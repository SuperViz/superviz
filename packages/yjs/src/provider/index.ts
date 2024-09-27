import { Participant } from '@superviz/sdk';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { IOC } from '@superviz/sdk/dist/services/io';
import {
  ClientState,
  ConnectionState,
  PresenceEvent,
  PresenceEvents,
  type SocketEvent,
} from '@superviz/socket-client';
import { ObservableV2 } from 'lib0/observable';
import * as Y from 'yjs';

import { Awareness, HostService, Logger } from '../services';

import {
  DocUpdate,
  Emitter,
  Message,
  MessageToHost,
  Events,
  Params,
  ProviderEvents,
  ProviderState,
  RealtimeRoom,
  storeType,
  ComponentLifeCycleEvent,
} from './types';

export class SuperVizYjsProvider extends ObservableV2<Events> {
  public readonly name = 'presence';

  public awareness: Awareness;
  public document: Y.Doc;

  private _synced: boolean = false;
  private state: ProviderState | `${ProviderState}` = ProviderState.DISCONNECTED;
  private isAttached: boolean = false;
  private localParticipant: Participant | null = null;

  private room: RealtimeRoom | null = null;
  private logger: Logger;
  private ioc: IOC | null = null;

  private hostService: HostService | null = null;

  constructor(
    private doc: Y.Doc,
    private opts: Params,
  ) {
    super();
    this.document = doc;

    this.logger = new Logger('SuperVizYjsProvider', '[SuperViz | YjsProvider] - ');
    this.awareness = new Awareness(this.doc, this.logger);
  }

  // #region Public methods
  /**
   * @function attach
   */
  public attach(params: DefaultAttachComponentOptions): void {
    if (Object.values(params).includes(null) || Object.values(params).includes(undefined)) {
      const message = `${this.name} @ attach - params are required`;

      this.logger.log(message);
      throw new Error(message);
    }

    const { useStore, ioc } = params;
    const { isDomainWhitelisted, hasJoinedRoom, localParticipant } = useStore(storeType.GLOBAL);

    if (!isDomainWhitelisted.value) {
      const message = `Component ${this.name} can't be used because this website's domain is not whitelisted. Please add your domain in https://dashboard.superviz.com/developer`;
      this.logger.log(message);
      return;
    }

    if (!hasJoinedRoom.value) {
      this.logger.log(`${this.name} @ attach - not joined yet`);
      setTimeout(() => {
        this.logger.log(`${this.name} @ attach - retrying`);
        this.attach(params);
      }, 1000);
      return;
    }

    this.ioc = ioc;
    this.localParticipant = localParticipant.value;
    this.isAttached = true;
    this.connect();
  }

  public detach() {
    if (!this.isAttached) {
      this.logger.log(`${this.name} @ detach - component is not attached`);
      return;
    }

    this.emit(ComponentLifeCycleEvent.UNMOUNT, []);
    this.logger.log('detached');
    this.destroyProvider();
    super.destroy();
  }

  /**
   * @function connect
   * @description Connect to the room. With this, start to send and
   * receive awareness and document updates. This method is called
   * automatically when a SuperVizYjsProvider instance is created,
   * unless opted-out by passing "connect: false" in the constructor
   * options. Can't connect if it is already connected
   * @public
   * @emits state
   * @returns {void}
   */
  private connect(): void {
    if (this.state !== ProviderState.DISCONNECTED) return;

    this.logger.log('Connecting to the room');

    this.changeState(ProviderState.CONNECTING);

    this.doc.on('updateV2', this.onDocUpdate);
    this.startRealtime();
  }

  /**
   * @public @function destroy
   * @description Disconnect from the room and reset the instance state.
   * @emits state @returns {void}
   */
  private destroyProvider(): void {
    if (this.state === ProviderState.DISCONNECTED) {
      this.logger.log("Can't destroy. Provider disconnected");
      return;
    }

    this.logger.log('Destroying the provider');

    this.emit('destroy', []);

    this._synced = false;

    this.awareness?.destroy();
    this.hostService?.destroy();

    // we do not set awareness to null because in
    // case of a reconnect, it is only ever instantiated
    // in the constructor
    this.hostService = null;

    this.doc.off('updateV2', this.onDocUpdate);

    this.removeRoomListeners();

    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    this.changeState(ProviderState.DISCONNECTED);
  }

  /**
   * @type {boolean}
   * @description Whether the user is connected to the room or not
   */
  public get synced(): boolean {
    return this._synced;
  }

  // #region Private methods
  /**
   * @function createRoom
   * @description Create a new room and set the realtime and room instances
   * @returns {void}
   */
  private createRoom(): void {
    this.logger.log('Creating room');

    this.room = this.ioc.createRoom('yjs-provider');
  }

  /**
   * @function addRoomListeners
   * @description Add listeners to the room instance
   * @returns {void}
   */
  private addRoomListeners(): void {
    this.logger.log('Adding room listeners');

    this.room.on(ProviderEvents.UPDATE, this.onRemoteDocUpdate);
    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onLocalJoinRoom);
    this.ioc.client.connection.on(this.onConnectionChange);
  }

  /**
   * @function removeRoomListeners
   * @description Remove listeners from the room instance
   * @returns {void}
   */
  private removeRoomListeners(): void {
    this.logger.log('Removing room listeners');

    if (this.room) {
      this.room.off(ProviderEvents.UPDATE, this.onRemoteDocUpdate);
      this.room.off(ProviderEvents.MESSAGE_TO_HOST, this.onMessageToHost);
      this.room.off(ProviderEvents.BROADCAST, this.onBroadcast);
      this.room.presence.off(PresenceEvents.JOINED_ROOM);
    }

    this.ioc?.client.connection.off();
  }

  /**
   * @function startRealtime
   * @description Start the real-time connection with the room
   * @returns {void}
   */
  private startRealtime(): void {
    this.createRoom();
    this.hostService = new HostService(this.ioc, this.localParticipant.id, this.onHostChange);
    this.addRoomListeners();
  }

  /**
   * @function fetch
   * @description Request the host to send the current state of the document
   * @returns {void}
   */
  private fetch = (): void => {
    this.logger.log('Fetching the document');

    this._synced = false;

    const update = Y.encodeStateAsUpdateV2(this.doc);
    this.beforeSendRealtimeMessage(ProviderEvents.MESSAGE_TO_HOST, {
      update,
    });

    this.room!.emit(ProviderEvents.MESSAGE_TO_HOST, {
      update,
    });
  };

  /**
   * @function updateDocument
   * @description Apply an update to the local document
   * @param {Uint8Array} update The update to apply
   * @returns {void}
   */
  private updateDocument = (update: Uint8Array): void => {
    this.logger.log('Applying remote update', update);

    Y.applyUpdateV2(this.doc, update, this);
  };

  /**
   * @function changeState
   * @description Change the state of the provider
   * @param {ProviderState | `${ProviderState}`} state The new state
   * @returns {void}
   */
  private changeState(state: ProviderState | `${ProviderState}`): void {
    this.logger.log('Changing state', state);

    this.emit('state', [state]);
    this.state = state;
  }

  // #region events callbacks
  /**
   * @function onMessageToHost
   * @description Receive a message directed to the host. Apply the
   * changes to the document and broadcast the changes to all participants
   * if there is a new update, or send a new update only to the target participant
   * @param {SocketEvent<MessageToHost>} event The message containing the state
   * from the participant who requested the host state
   * @returns {void}
   */
  private onMessageToHost = (event: SocketEvent<MessageToHost>): void => {
    if (!this.hostService.isHost) return;

    this.logger.log('Received message to host', event);

    this._synced = false;

    const comingUpdate = new Uint8Array(event.data.update);
    this.onReceiveRealtimeMessage(ProviderEvents.MESSAGE_TO_HOST, {
      update: comingUpdate,
    });

    this.updateDocument(comingUpdate);

    const update = Y.encodeStateAsUpdateV2(this.doc, comingUpdate);

    this.beforeSendRealtimeMessage(ProviderEvents.BROADCAST, { update });
    this.room!.emit(ProviderEvents.BROADCAST, { update });
  };

  /**
   * @function onDocUpdate
   * @description Broadcast the local document update to all participants
   * @param {Uint8Array} update The update to broadcast
   * @returns {void}
   */
  private onDocUpdate = (update: Uint8Array): void => {
    this.logger.log('Local document update', update);

    this.beforeSendRealtimeMessage(ProviderEvents.UPDATE, { update });
    this.room!.emit(ProviderEvents.UPDATE, { update });
  };

  /**
   * @function onLocalJoinRoom
   * @description Start the awareness service, subscribe to real-time events and fetch the document
   * @param {PresenceEvent} event
   * @returns {void}
   */
  private onLocalJoinRoom = (event: PresenceEvent): void => {
    if (this.state === ProviderState.CONNECTED || event.id !== this.localParticipant.id) return;

    this.logger.log('Joined the room', event);

    this.awareness.connect(this.localParticipant.id, this.room!);
    this.changeState(ProviderState.CONNECTED);
    this.emit('connect', []);

    this.room!.on(ProviderEvents.MESSAGE_TO_HOST, this.onMessageToHost);
    this.room!.on(ProviderEvents.BROADCAST, this.onBroadcast);

    this.fetch();
  };

  /**
   * @function onConnectionChange
   * @description Handle disconnection from the room
   * @param {ConnectionState} msg The connection state
   * @returns {void}
   */
  private onConnectionChange = (msg: ConnectionState): void => {
    if (msg.state === ClientState.DISCONNECTED) {
      this.logger.log('Disconnected from the room');
      this.emit('disconnect', []);
    }
  };

  /**
   * @function onRemoteDocUpdate
   * @description Apply changes to a remote document to the local document
   * @param {SocketEvent<DocUpdate>} event The event containing the update
   * @returns {void}
   */
  private onRemoteDocUpdate = (event: SocketEvent<DocUpdate>): void => {
    if (event.presence?.id === this.localParticipant.id) return;
    this.logger.log('Received remote document update', event);

    const update = new Uint8Array(event.data.update);
    this.onReceiveRealtimeMessage(ProviderEvents.UPDATE, { update });

    this.updateDocument(update);
  };

  /**
   * @function onBroadcast
   * @description Apply changes to the host's document to the local
   * document. Set the provider as synced
   * @param {SocketEvent<DocUpdate>} event The event containing the update
   * @returns {void}
   */
  private onBroadcast = (event: SocketEvent<DocUpdate>): void => {
    if (this.hostService?.isHost) return;
    this.logger.log('Received broadcast', event);

    const update = new Uint8Array(event.data.update);
    this.onReceiveRealtimeMessage(ProviderEvents.BROADCAST, { update });

    this.updateDocument(update);
    this._synced = true;

    this.emit('synced', []);
    this.emit('sync', []);
  };

  /**
   * @function onHostChange
   * @description Handle the host change event. If the host is the current
   * participant, set the provider as synced. Otherwise, fetch the document from the host
   * @param {string} hostId The new host id
   * @returns {void}
   */
  private onHostChange = (hostId: string): void => {
    this.logger.log('Host changed', hostId);

    if (hostId === this.localParticipant.id) {
      this._synced = true;
      return;
    }

    this.fetch();
  };

  // #region Emitting messages
  /**
   * @function onReceiveRealtimeMessage
   * @description Emit a message received from the room
   * @param {string} name The message name
   * @param {any} data The message data
   * @returns {void}
   */
  private onReceiveRealtimeMessage: Emitter = (name, data): void => {
    this.logger.log('Received message from room', { name, data });
    this.emit('message', [{ name, data } as Message]);
  };

  /**
   * @function beforeSendRealtimeMessage
   * @description Emit a message sent to the room
   * @param {string} name The message name
   * @param {any} data The message data
   * @returns {void}
   */
  private beforeSendRealtimeMessage: Emitter = (name, data): void => {
    this.logger.log('Sending message to room', { name, data });
    this.emit('outgoingMessage', [{ name, data } as Message]);
  };
}
