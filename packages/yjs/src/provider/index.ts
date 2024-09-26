import {
  ClientState,
  ConnectionState,
  PresenceEvent,
  PresenceEvents,
  Realtime,
  type SocketEvent,
} from '@superviz/socket-client';
import debug from 'debug';
import { ObservableV2 } from 'lib0/observable';
import * as Y from 'yjs';

import { createRoom } from '../common/utils/createRoom';
import { Awareness, HostService, Logger, config } from '../services';

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
} from './types';

export class SuperVizYjsProvider extends ObservableV2<Events> {
  public awareness: Awareness;
  public document: Y.Doc;

  private _synced: boolean = false;
  private state: ProviderState | `${ProviderState}` = ProviderState.DISCONNECTED;

  private realtime: Realtime | null = null;
  private room: RealtimeRoom | null = null;
  private logger: Logger;

  private hostService: HostService | null = null;

  constructor(
    private doc: Y.Doc,
    private opts: Params,
  ) {
    super();
    this.setConfig();
    this.document = doc;

    this.logger = new Logger('SuperVizYjsProvider');
    this.awareness = new Awareness(this.doc, this.opts.participant.id, this.logger);

    if (!this.opts.debug) debug.disable();

    if (!this.opts.connect) return;

    this.connect();
  }

  // #region Public methods
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
  public connect(): void {
    if (this.state !== ProviderState.DISCONNECTED) return;

    this.logger.log('[SuperViz | YjsProvider] - Connecting to the room');

    this.changeState(ProviderState.CONNECTING);

    this.doc.on('updateV2', this.onDocUpdate);
    this.startRealtime();
  }

  /**
   * @public @function destroy
   * @description Disconnect from the room and reset the instance state.
   * @emits state @returns {void}
   */
  public destroy(): void {
    if (this.state === ProviderState.DISCONNECTED) return;
    this.logger.log('[SuperViz | YjsProvider] - Destroying the provider');

    this.emit('destroy', []);

    this._synced = false;

    this.awareness?.destroy();
    this.realtime?.destroy();
    this.hostService?.destroy();

    // we do not set awareness to null because in
    // case of a reconnect, it is only ever instantiated
    // in the constructor
    this.hostService = null;
    this.realtime = null;

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
    this.logger.log('[SuperViz | YjsProvider] - Creating room');

    const { realtime, room } = createRoom(`yjs:${config.get('roomName')}`);
    this.realtime = realtime;
    this.room = room;
  }

  /**
   * @function addRoomListeners
   * @description Add listeners to the room instance
   * @returns {void}
   */
  private addRoomListeners(): void {
    this.logger.log('[SuperViz | YjsProvider] - Adding room listeners');

    this.room.on(ProviderEvents.UPDATE, this.onRemoteDocUpdate);
    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onLocalJoinRoom);
    this.realtime.connection.on(this.onConnectionChange);
  }

  /**
   * @function removeRoomListeners
   * @description Remove listeners from the room instance
   * @returns {void}
   */
  private removeRoomListeners(): void {
    this.logger.log('[SuperViz | YjsProvider] - Removing room listeners');

    if (this.room) {
      this.room.off(ProviderEvents.UPDATE, this.onRemoteDocUpdate);
      this.room.off(ProviderEvents.MESSAGE_TO_HOST, this.onMessageToHost);
      this.room.off(ProviderEvents.BROADCAST, this.onBroadcast);
      this.room.presence.off(PresenceEvents.JOINED_ROOM);
    }

    this.realtime?.connection.off();
  }

  /**
   * @function startRealtime
   * @description Start the real-time connection with the room
   * @returns {void}
   */
  private startRealtime(): void {
    this.createRoom();
    this.hostService = new HostService(this.opts.participant.id, this.onHostChange);
    this.addRoomListeners();
  }

  /**
   * @function fetch
   * @description Request the host to send the current state of the document
   * @returns {void}
   */
  private fetch = (): void => {
    this.logger.log('[SuperViz | YjsProvider] - Fetching the document');

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
    this.logger.log('[SuperViz | YjsProvider] - Applying remote update', update);

    Y.applyUpdateV2(this.doc, update, this);
  };

  /**
   * @function setConfig
   * @description Set the configuration for the provider
   * @returns {void}
   */
  private setConfig(): void {
    config.set('apiKey', this.opts.apiKey);
    config.set('environment', this.opts.environment);
    config.set('participant', this.opts.participant);
    config.set('roomName', this.opts.room || 'sv-provider');
  }

  /**
   * @function changeState
   * @description Change the state of the provider
   * @param {ProviderState | `${ProviderState}`} state The new state
   * @returns {void}
   */
  private changeState(state: ProviderState | `${ProviderState}`): void {
    this.logger.log('[SuperViz | YjsProvider] - Changing state', state);

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

    this.logger.log('[SuperViz | YjsProvider] - Received message to host', event);

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
    this.logger.log('[SuperViz | YjsProvider] - Local document update', update);

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
    if (this.state === ProviderState.CONNECTED || event.id !== this.opts.participant.id) return;

    this.logger.log('[SuperViz | YjsProvider] - Joined the room', event);

    this.awareness.connect(this.room!);
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
      this.logger.log('[SuperViz | YjsProvider] - Disconnected from the room');
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
    if (event.presence?.id === this.opts.participant.id) return;
    this.logger.log('[SuperViz | YjsProvider] - Received remote document update', event);

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
    this.logger.log('[SuperViz | YjsProvider] - Received broadcast', event);

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
    this.logger.log('[SuperViz | YjsProvider] - Host changed', hostId);

    if (hostId === this.opts.participant.id) {
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
    this.logger.log('[SuperViz | YjsProvider] - Received message from room', { name, data });
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
    this.logger.log('[SuperViz | YjsProvider] - Sending message to room', { name, data });
    this.emit('outgoingMessage', [{ name, data } as Message]);
  };
}
