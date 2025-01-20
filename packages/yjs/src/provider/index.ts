import type { Participant } from '@superviz/sdk';
import type { DefaultAttachComponentOptions } from '@superviz/sdk/dist/components/base/types';
import type { IOC } from '@superviz/sdk/dist/services/io';
import type { ConnectionState, PresenceEvent, SocketEvent } from '@superviz/socket-client';
import { ObservableV2 } from 'lib0/observable';
import * as Y from 'yjs';

import { Awareness, Logger } from '../services';
import { getUpdatesHistory } from '../utils/getUpdatesHistory';

import {
  DocUpdate,
  Emitter,
  Message,
  Events,
  Params,
  ProviderEvents,
  ProviderState,
  RealtimeRoom,
  storeType,
  ComponentLifeCycleEvent,
} from './types';

export class SuperVizYjsProvider extends ObservableV2<Events> {
  public readonly name = 'yjsProvider';

  public awareness: Awareness;
  public document: Y.Doc;

  private _synced: boolean = false;
  private state: ProviderState | `${ProviderState}` = ProviderState.DISCONNECTED;
  private isAttached: boolean = false;
  private localParticipant: Participant | null = null;

  private room: RealtimeRoom | null = null;
  private logger: Logger;
  private ioc: IOC | null = null;
  private roomId: string;

  constructor(
    public doc: Y.Doc,
    opts?: Params,
  ) {
    super();
    this.document = doc;

    this.logger = new Logger('SuperVizYjsProvider', '[SuperViz | YjsProvider] - ');

    if (opts?.awareness === false) return;
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

    const { useStore, ioc, config } = params;
    const { hasJoinedRoom, localParticipant } = useStore(storeType.GLOBAL);

    if (!hasJoinedRoom.value) {
      hasJoinedRoom.subscribe(() => this.attach(params));
      return;
    }

    this.roomId = config.roomId;
    this.ioc = ioc;
    this.localParticipant = localParticipant.value;
    this.isAttached = true;
    this.connect();
    this.emit('mount', []);
  }

  public detach() {
    if (!this.isAttached) {
      this.logger.log(`${this.name} @ detach - component is not attached`);
      return;
    }

    this.logger.log('detached');
    this.destroyProvider();
    super.destroy();
    this.emit(ComponentLifeCycleEvent.UNMOUNT, []);
  }

  /**
   * @function connect
   * @description Connect to the room. With this, start to send and
   * receive awareness and document updates. This method is called
   * automatically when a SuperVizYjsProvider instance is created,
   * unless opted-out by passing "connect: false" in the constructor
   * options. Can't connect if it is already connected
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
   * @function destroy
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
    this.room.presence.on('presence.joined-room', this.onLocalJoinRoom);
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
      this.room.presence.off('presence.joined-room');
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
    this.addRoomListeners();
  }

  /**
   * @function fetch
   * @description Request and apply all document updates from server
   * @returns {void}
   */
  private fetch = async (): Promise<void> => {
    this.logger.log('Fetching the document');
    this._synced = false;

    const updates = await getUpdatesHistory(this.roomId, this.ioc!['client']['apiKey']);

    this._synced = true;
    if (!updates.length) return;

    Y.applyUpdateV2(this.doc, Y.mergeUpdatesV2(updates));
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

    this.awareness?.connect(this.localParticipant.id, this.room!);
    this.changeState(ProviderState.CONNECTED);
    this.emit('connect', []);

    const update = Y.encodeStateAsUpdateV2(this.doc);
    this.beforeSendRealtimeMessage(ProviderEvents.UPDATE, { update });
    this.room!.emit('provider.update', { update });

    this.fetch();
  };

  /**
   * @function onConnectionChange
   * @description Handle disconnection from the room
   * @param {ConnectionState} msg The connection state
   * @returns {void}
   */
  private onConnectionChange = (msg: ConnectionState): void => {
    if (msg.state === 'DISCONNECTED') {
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
