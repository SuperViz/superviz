import * as Y from 'yjs';
import { Params } from './types';
import { Awareness } from './services';
import { ObservableV2 } from 'lib0/observable';
import { ProviderStatusEvents } from './common/types/events.types';
import { Realtime, type Room, type SocketEvent } from '@superviz/socket-client';
import { config } from './services/config';
import { createRoom } from './common/utils/createRoom';
import { HostService } from './services/host';

export class SuperVizYjsProvider extends ObservableV2<any> {
  public awareness: Awareness;
  public document: Y.Doc;

  private _synced: boolean = false;
  private connected: boolean = false;

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
    this.doc.on('updateV2', this.onDocUpdate);

    this.hostService = new HostService(this.opts.participant.id);
    this.awareness = new Awareness(this.doc);

    this.connect();
  }

  // #region Public methods
  public connect() {
    if (this.connected) return;
    this.startRealtime();
  }

  public destroy() {
    this.awareness.destroy();
    this.realtime?.destroy();
    this.doc.off('updateV2', this.onDocUpdate);
    this.room?.disconnect();
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

  private updateStepOne = (msg: SocketEvent<any>) => {
    if (msg.presence?.id === this.opts.participant.id) return;

    this._synced = false;

    const update = Y.encodeStateAsUpdateV2(this.doc, new Uint8Array(msg.data.stateVector));

    this.room!.emit('update-step-2', {
      update,
      origin: this.doc.guid,
    });
  };

  private updateStepTwo = (msg: SocketEvent<any>) => {
    if (msg.presence?.id === this.opts.participant.id) return;
    this.updateDocument(new Uint8Array(msg.data.update));
    this._synced = false;
  };

  private syncClients = () => {
    const stateVector = Y.encodeStateVector(this.doc);

    this.room!.emit('update-step-1', {
      stateVector,
      origin: this.doc.guid,
    });
  };

  private onDocUpdate = (update: Uint8Array, origin: any) => {
    if (origin === this) return;
    this.room!.emit('update', { update });
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
    this.connected = true;
    this.emit('status', [ProviderStatusEvents.CONNECTED]);

    this.room!.on('update-step-1', this.updateStepOne);
    this.room!.on('update-step-2', this.updateStepTwo);

    this.syncClients();
  };

  private onRemoteDocUpdate = (update: SocketEvent<any>) => {
    this.updateDocument(new Uint8Array(update.data.update));
  };
}
