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
  private state: ProviderState = ProviderState.DISCONNECTED;

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

    if (!this.opts.connect) return;

    this.connect();
  }

  // #region Public methods
  public connect = () => {
    if (this.state !== ProviderState.DISCONNECTED) return;
    this.changeState(ProviderState.CONNECTING);

    this.doc.on('updateV2', this.onDocUpdate);
    this.hostService = new HostService(this.opts.participant.id, this.onHostChange);
    this.awareness = new Awareness(this.doc);
    this.startRealtime();
  };

  public destroy() {
    if (this.state === ProviderState.DISCONNECTED) return;
    this.awareness?.destroy();
    this.realtime?.destroy();
    this.doc.off('updateV2', this.onDocUpdate);
    this.room?.disconnect();

    this.changeState(ProviderState.DISCONNECTED);
  }

  public disconnect() {}

  public get synced() {
    return this._synced;
  }

  // #region Private methods
  private createRoom() {
    const { realtime, room } = createRoom(`yjs:${config.get('roomName')}`);
    this.realtime = realtime;
    this.room = room;
  }

  private listenToRealtimeEvents() {
    this.room.on('update', this.onRemoteDocUpdate);
    this.room.presence.on('presence.joined-room', this.onLocalJoinRoom);
  }

  private startRealtime() {
    this.createRoom();
    this.listenToRealtimeEvents();
  }

  private onRequestHostState = (event: SocketEvent<MessageToHost>) => {
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

  private onMessageFromHost = (msg: SocketEvent<MessageToTarget>) => {
    if (msg.data.targetId !== this.opts.participant.id) return;

    this.updateDocument(new Uint8Array(msg.data.update));
    this._synced = true;
  };

  private fetch = () => {
    this._synced = false;

    const update = Y.encodeStateAsUpdateV2(this.doc);

    this.room!.emit<MessageToHost>('send-local-sv-to-host', {
      update,
      originId: this.opts.participant.id,
    });
  };

  private onDocUpdate = (update: Uint8Array, origin: any) => {
    if (origin === this) return;
    this.room!.emit<DocUpdate>('update', { update });
  };

  private updateDocument = (update: Uint8Array) => {
    Y.applyUpdateV2(this.doc, update, this);
  };

  private setConfig() {
    config.set('apiKey', this.opts.apiKey);
    config.set('environment', this.opts.environment);
    config.set('participant', this.opts.participant);
    config.set('roomName', this.opts.room || 'sv-provider');
  }

  // #region events callbacks
  private onLocalJoinRoom = () => {
    this.changeState(ProviderState.CONNECTED);

    this.emit('status', [ProviderStatusEvents.CONNECTED]);

    this.room!.on('send-local-sv-to-host', this.onRequestHostState);
    this.room!.on('message-to-specific-user', this.onMessageFromHost);
    this.room!.on('broadcast', this.onBroadcast);

    this.fetch();
  };

  private onRemoteDocUpdate = (update: SocketEvent<DocUpdate>) => {
    this.updateDocument(new Uint8Array(update.data.update));
  };

  private onBroadcast = (event: SocketEvent<DocUpdate>) => {
    this.onRemoteDocUpdate(event);
    this._synced = true;
  };

  private onHostChange = (hostId: string) => {
    if (hostId === this.opts.participant.id) {
      this._synced = true;
      return;
    }

    this.fetch();
  };

  private changeState(state: ProviderState) {
    this.emit('state', [state]);
    this.state = state;
  }

  private broadcastUpdate(update: Uint8Array) {
    this.room!.emit<DocUpdate>('broadcast', { update });
  }
}
