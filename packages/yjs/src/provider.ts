import * as Y from 'yjs';
import { Params, ProviderState } from './types';
import { Awareness } from './services';
import { ObservableV2 } from 'lib0/observable';
import { ProviderStatusEvents } from './common/types/events.types';
import { Realtime, type Room, type SocketEvent } from '@superviz/socket-client';
import { config } from './services/config';
import { createRoom } from './common/utils/createRoom';
import { HostService } from './services/host';

type MessageToHost = {
  update: Uint8Array;
  originId: string;
};

type MessageToTarget = {
  update: Uint8Array;
  targetId: string;
};

type DocUpdate = {
  update: Uint8Array;
};

export class SuperVizYjsProvider extends ObservableV2<any> {
  public awareness: Awareness;
  public document: Y.Doc;

  private _synced: boolean = false;
  private state: ProviderState | `${ProviderState}` = ProviderState.DISCONNECTED;

  private realtime: Realtime | null = null;
  private room: Room | null = null;

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
    this.awareness?.destroy();
    this.realtime?.destroy();
    this.hostService?.destroy();
    this.doc.off('updateV2', this.onDocUpdate);

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

  private listenToRealtimeEvents(): void {
    this.room.on('update', this.onRemoteDocUpdate);
    this.room.presence.on('presence.joined-room', this.onLocalJoinRoom);
  }

  private startRealtime(): void {
    this.createRoom();
    this.hostService = new HostService(this.opts.participant.id, this.onHostChange);
    this.listenToRealtimeEvents();
  }

  private onRequestHostState = (event: SocketEvent<MessageToHost>): void => {
    if (!this.hostService.isHost) return;

    this._synced = false;

    const comingUpdate = new Uint8Array(event.data.update);
    this.updateDocument(comingUpdate);
    const update = Y.encodeStateAsUpdateV2(this.doc, comingUpdate);

    if (update.length > 0) {
      // if the content was new to host, it is new to all users
      this.broadcastUpdate(update);
      return;
    }

    this.room!.emit<MessageToTarget>('message-to-specific-user', {
      update,
      targetId: event.data.originId,
    });
  };

  private onMessageFromHost = (msg: SocketEvent<MessageToTarget>): void => {
    if (msg.data.targetId !== this.opts.participant.id) return;

    this.updateDocument(new Uint8Array(msg.data.update));
    this._synced = true;
  };

  private fetch = (): void => {
    this._synced = false;

    const update = Y.encodeStateAsUpdateV2(this.doc);

    this.room!.emit<MessageToHost>('send-local-sv-to-host', {
      update,
      originId: this.opts.participant.id,
    });
  };

  private onDocUpdate = (update: Uint8Array): void => {
    this.room!.emit<DocUpdate>('update', { update });
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
  private onLocalJoinRoom = (): void => {
    if (this.state === ProviderState.CONNECTED) return;

    this.awareness.connect(this.room!);
    this.changeState(ProviderState.CONNECTED);
    this.emit('status', [ProviderStatusEvents.CONNECTED]);

    this.room!.on('send-local-sv-to-host', this.onRequestHostState);
    this.room!.on('message-to-specific-user', this.onMessageFromHost);
    this.room!.on('broadcast', this.onBroadcast);

    this.fetch();
  };

  private onRemoteDocUpdate = (update: SocketEvent<DocUpdate>): void => {
    this.updateDocument(new Uint8Array(update.data.update));
  };

  private onBroadcast = (event: SocketEvent<DocUpdate>): void => {
    this.onRemoteDocUpdate(event);
    this._synced = true;
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

  private broadcastUpdate(update: Uint8Array): void {
    this.room!.emit<DocUpdate>('broadcast', { update });
  }
}
