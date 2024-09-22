import { ObservableV2 } from 'lib0/observable';
import { PresenceEvent, Room } from '@superviz/socket-client';
import * as Y from 'yjs';
import { UpdateOrigin, UpdatePresence } from './types';

export class Awareness extends ObservableV2<any> {
  public clientId: number = 0;
  public meta: Map<number, { clock: number; lastUpdated: number }> = new Map();
  public states: Map<number, any> = new Map();

  private participantIdToClientId: Map<string, number> = new Map();
  private room: Room | null = null;

  private visibilityTimeout: number | undefined;

  private readonly TIMEOUT_TIMER_MS = 30000;
  private readonly Y_PRESENCE_KEY = '__yjs';

  private previousState: any | null = null;

  constructor(
    public doc: Y.Doc,
    private participantId: string,
  ) {
    super();
    this.clientId = this.doc.clientID;
  }

  public connect(room: Room): void {
    this.room = room;
    this.addRoomListeners();
    this.addDocumentListeners();

    this.room.presence.get((presences: PresenceEvent<UpdatePresence>[]) => {
      const added: number[] = [];

      presences.forEach((presence) => {
        const clientId = presence.data.clientId;
        if (!clientId) return;
        added.push(clientId);
        this.participantIdToClientId.set(presence.id, clientId);
        this.states.set(clientId, {
          ...presence.data,
        });
      });

      const clientId = this.doc.clientID;
      this.room.presence.update<UpdatePresence>({
        clientId,
        [this.Y_PRESENCE_KEY]: {},
        ...(this.states.get(clientId) || {}),
      });

      const update = { added, updated: [], removed: [] };

      this.emit('change', [update, UpdateOrigin.PRESENCE]);
      this.emit('update', [update, UpdateOrigin.PRESENCE]);
    });
  }

  //#region public
  public destroy(): void {
    clearInterval(this.visibilityTimeout);
    this.visibilityTimeout = undefined;

    this.removeDocumentListeners();
    this.removeRoomListeners();

    this.onLeave({ id: this.participantId } as unknown as PresenceEvent);
  }

  public getLocalState(): Record<string, any> | null {
    const state = this.states.get(this.clientId);
    if (!state || !state[this.Y_PRESENCE_KEY]) return null;

    return state[this.Y_PRESENCE_KEY];
  }

  public getStates(): Map<number, Record<string, any>> {
    const states = new Map<number, Record<string, any>>();
    this.states.forEach((state, clientId) => {
      states.set(clientId, state[this.Y_PRESENCE_KEY]);
    });

    return states;
  }

  public setLocalState = (state: Record<string, any> | null): void => {
    if (state === null) {
      if (!this.states.has(this.clientId)) return;
      this.states.delete(this.clientId);
      this.room?.presence.update<UpdatePresence>({
        ...this.states.get(this.clientId),
        [this.Y_PRESENCE_KEY]: null,
      });

      const update = { added: [], updated: [], removed: [this.clientId] };
      this.emit('change', [update, UpdateOrigin.LOCAL]);
      this.emit('update', [update, UpdateOrigin.LOCAL]);
      return;
    }

    if (this.previousState && document.visibilityState === 'hidden') return;

    const update = { added: [], updated: [], removed: [] };
    let oldState = this.states.get(this.clientId);
    if (oldState) {
      update.updated.push(this.clientId);
    } else {
      oldState = { [this.Y_PRESENCE_KEY]: {}, clientId: this.clientId };
      update.added.push(this.clientId);
    }

    const newState = { ...oldState, [this.Y_PRESENCE_KEY]: state };
    this.states.set(this.clientId, newState);
    this.room?.presence.update<UpdatePresence>(newState);

    this.emit('change', [update, UpdateOrigin.LOCAL]);
    return;
  };

  public setLocalStateField(field: string, value: any): void {
    const state = this.getLocalState();
    this.setLocalState({
      ...(state || {}),
      [field]: value,
    });
  }

  //#region private
  private addRoomListeners(): void {
    this.room.presence.on<UpdatePresence>('presence.update', this.onUpdate);
    this.room.presence.on<UpdatePresence>('presence.leave', this.onLeave);
  }

  private removeRoomListeners(): void {
    this.room.presence.off('presence.update');
    this.room.presence.off('presence.leave');
  }

  private addDocumentListeners(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private removeDocumentListeners(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onLeave = (event: PresenceEvent): void => {
    const clientId = this.participantIdToClientId.get(event.id);
    if (!clientId) return;

    if (clientId === this.clientId) {
      const ids = Array.from(this.states.keys());
      this.removeAwarenessStates(ids, UpdateOrigin.PRESENCE);
      return;
    }

    const update = { added: [], updated: [], removed: [clientId] };
    this.participantIdToClientId.delete(event.id);
    this.states.delete(clientId);

    this.emit('change', [update, UpdateOrigin.PRESENCE]);
    this.emit('update', [update, UpdateOrigin.PRESENCE]);
  };

  private onUpdate = (event: PresenceEvent<UpdatePresence>): void => {
    if (event.data[this.Y_PRESENCE_KEY] === null) {
      this.removeAwarenessStates([event.data.clientId], UpdateOrigin.PRESENCE);
      return;
    }

    const added: number[] = [];
    const updated: number[] = [];
    let clientId = this.participantIdToClientId.get(event.id);

    if (clientId) {
      updated.push(event.data.clientId);
    } else {
      this.participantIdToClientId.set(event.id, event.data.clientId);
      clientId = event.data.clientId;
      added.push(event.data.clientId);
    }

    this.states.set(clientId, {
      ...(this.states.get(clientId) || {}),
      ...event.data,
    });

    this.emit('change', [{ added, updated, removed: [] }, UpdateOrigin.PRESENCE]);
    this.emit('update', [{ added, updated, removed: [] }, UpdateOrigin.PRESENCE]);
  };

  private removeAwarenessStates(removed: number[], origin: string): void {
    const update = { added: [], updated: [], removed: [] };
    removed.forEach((clientId) => {
      if (!this.states.get(clientId)) return;

      this.states.delete(clientId);
      update.removed.push(clientId);
    });

    this.emit('change', [update, origin]);
    this.emit('update', [update, origin]);
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      clearTimeout(this.visibilityTimeout);

      if (this.previousState) {
        this.setLocalState(this.previousState);
        this.previousState = null;
      }

      return;
    }

    this.visibilityTimeout = setTimeout(() => {
      this.previousState = this.getLocalState();
      this.setLocalState(null);
    }, this.TIMEOUT_TIMER_MS);
  };
}
