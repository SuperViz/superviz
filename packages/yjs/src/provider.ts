import * as Y from 'yjs';
import {
  DocUpdate,
  Emitter,
  Message,
  MessageToHost,
  MessageToTarget,
  MyEvents,
  Params,
  ProviderEvents,
  ProviderState,
  RealtimeRoom,
} from './types';
import { Awareness } from './services';
import { ObservableV2 } from 'lib0/observable';
import {
  ClientState,
  ConnectionState,
  PresenceEvent,
  PresenceEvents,
  Realtime,
  type SocketEvent,
} from '@superviz/socket-client';
import { config } from './services/config';
import { createRoom } from './common/utils/createRoom';
import { HostService } from './services/host';

export class SuperVizYjsProvider extends ObservableV2<MyEvents> {
  public awareness: Awareness;
  public document: Y.Doc;

  private _synced: boolean = false;
  private state: ProviderState | `${ProviderState}` = ProviderState.DISCONNECTED;

  private realtime: Realtime | null = null;
  private room: RealtimeRoom | null = null;

  private hostService: HostService | null = null;

  constructor(
    private doc: Y.Doc,
    private opts: Params,
  ) {
    super();
    this.setConfig();
    this.document = doc;
    this.awareness = new Awareness(this.doc, this.opts.participant.id);

    if (!this.opts.connect) return;

    this.connect();
  }

  // #region Public methods
  /**
   * @function connect
   * @description Connect to the room. With this, start to send and receive awareness and document updates. This method is called automatically when a SuperVizYjsProvider instance is created, unless opted-out by passing "connect: false" in the constructor options. Can't connect if it is already connected
   * @public
   * @emits state
   * @returns {void}
   */
  public connect = (): void => {
    if (this.state !== ProviderState.DISCONNECTED) return;
    this.changeState(ProviderState.CONNECTING);

    this.doc.on('updateV2', this.onDocUpdate);
    this.startRealtime();
  };

  /**
   * @public @function destroy
   * @description Disconnect from the room and reset the instance state.
   * @emits state @returns {void}
   */
  public destroy = (): void => {
    if (this.state === ProviderState.DISCONNECTED) return;
    this.emit('destroy', []);

    this.awareness?.destroy();
    this.realtime?.destroy();
    this.hostService?.destroy();
    this.doc.off('updateV2', this.onDocUpdate);

    this.removeRoomListeners();

    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    this.changeState(ProviderState.DISCONNECTED);
  };

  /**
   * @type {boolean}
   * @description Whether the user is connected to the room or not
   */
  public get synced(): boolean {
    return this._synced;
  }

  // #region Private methods
  private createRoom(): void {
    const { realtime, room } = createRoom(`yjs:${config.get('roomName')}`);
    this.realtime = realtime;
    this.room = room;
  }

  private addRoomListeners(): void {
    this.room.on(ProviderEvents.UPDATE, this.onRemoteDocUpdate);
    this.room.presence.on(PresenceEvents.JOINED_ROOM, this.onLocalJoinRoom);
    this.realtime.connection.on(this.onConnectionChange);
  }

  private removeRoomListeners(): void {
    if (this.room) {
      this.room.off(ProviderEvents.UPDATE, this.onRemoteDocUpdate);
      this.room.off(ProviderEvents.MESSAGE_TO_HOST, this.onMessageToHost);
      this.room.off(ProviderEvents.MESSAGE_TO_SPECIFIC_USER, this.onMessageToUser);
      this.room.off(ProviderEvents.BROADCAST, this.onBroadcast);
      this.room.presence.off(PresenceEvents.JOINED_ROOM);
    }

    this.realtime?.connection.off();
  }

  private startRealtime(): void {
    this.createRoom();
    this.hostService = new HostService(this.opts.participant.id, this.onHostChange);
    this.addRoomListeners();
  }

  private onMessageToHost = (event: SocketEvent<MessageToHost>): void => {
    if (!this.hostService.isHost) return;

    this._synced = false;

    const comingUpdate = new Uint8Array(event.data.update);
    this.onReceiveRealtimeMessage('message-to-host', {
      update: comingUpdate,
      originId: event.data.originId,
    });

    this.updateDocument(comingUpdate);
    const update = Y.encodeStateAsUpdateV2(this.doc, comingUpdate);

    if (update.length > 0) {
      this.beforeSendRealtimeMessage('broadcast', { update });
      this.room!.emit('broadcast', { update });
      return;
    }

    this.beforeSendRealtimeMessage('message-to-specific-user', {
      update,
      targetId: event.data.originId,
    });
    this.room!.emit('message-to-specific-user', {
      update,
      targetId: event.data.originId,
    });
  };

  private onMessageToUser = (msg: SocketEvent<MessageToTarget>): void => {
    if (msg.data.targetId !== this.opts.participant.id) return;

    const update = new Uint8Array(msg.data.update);
    this.onReceiveRealtimeMessage('message-to-specific-user', {
      update,
      targetId: msg.data.targetId,
    });

    this.updateDocument(update);
    this._synced = true;

    this.emit('synced', []);
    this.emit('sync', []);
  };

  private fetch = (): void => {
    this._synced = false;

    const update = Y.encodeStateAsUpdateV2(this.doc);
    this.beforeSendRealtimeMessage('message-to-host', {
      update,
      originId: this.opts.participant.id,
    });

    this.room!.emit('message-to-host', {
      update,
      originId: this.opts.participant.id,
    });
  };

  private onDocUpdate = (update: Uint8Array): void => {
    this.beforeSendRealtimeMessage('update', { update });
    this.room!.emit('update', { update });
  };

  private updateDocument = (update: Uint8Array): void => {
    Y.applyUpdateV2(this.doc, update, this);
  };

  private setConfig(): void {
    config.set('apiKey', this.opts.apiKey);
    config.set('environment', this.opts.environment);
    config.set('participant', this.opts.participant);
    config.set('roomName', this.opts.room || 'sv-provider');
  }

  // #region events callbacks
  private onLocalJoinRoom = (event: PresenceEvent): void => {
    if (this.state === ProviderState.CONNECTED || event.id !== this.opts.participant.id) return;

    this.awareness.connect(this.room!);
    this.changeState(ProviderState.CONNECTED);
    this.emit('connect', []);

    this.room!.on(ProviderEvents.MESSAGE_TO_HOST, this.onMessageToHost);
    this.room!.on(ProviderEvents.MESSAGE_TO_SPECIFIC_USER, this.onMessageToUser);
    this.room!.on(ProviderEvents.BROADCAST, this.onBroadcast);

    this.fetch();
  };

  private onConnectionChange = (msg: ConnectionState): void => {
    if (msg.state === ClientState.DISCONNECTED) {
      this.emit('disconnect', []);
    }
  };

  private onRemoteDocUpdate = (event: SocketEvent<DocUpdate>): void => {
    if (event.presence?.id === this.opts.participant.id) return;

    const update = new Uint8Array(event.data.update);
    this.onReceiveRealtimeMessage('update', { update });

    this.updateDocument(update);
  };

  private onBroadcast = (event: SocketEvent<DocUpdate>): void => {
    if (this.hostService?.isHost) return;

    const update = new Uint8Array(event.data.update);
    this.onReceiveRealtimeMessage('broadcast', { update });

    this.updateDocument(update);
    this._synced = true;

    this.emit('synced', []);
    this.emit('sync', []);
  };

  private onHostChange = (hostId: string): void => {
    if (hostId === this.opts.participant.id) {
      this._synced = true;
      return;
    }

    this.fetch();
  };

  private changeState(state: ProviderState): void {
    this.emit('state', [state]);
    this.state = state;
  }

  private onReceiveRealtimeMessage: Emitter = (name, data): void => {
    this.emit('message', [{ name, data } as Message]);
  };

  private beforeSendRealtimeMessage: Emitter = (name, data): void => {
    this.emit('outgoingMessage', [{ name, data } as Message]);
  };
}
