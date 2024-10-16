import type { PresenceEvent } from '@superviz/socket-client';
import { ObservableV2 } from 'lib0/observable';
import * as Y from 'yjs';

import { RealtimeRoom } from '../../provider/types';
import { Logger } from '../logger';

import { Events, UpdateOrigin, UpdatePresence } from './types';

export class Awareness extends ObservableV2<Events> {
  public clientID: number = 0;
  public states: Map<number, any> = new Map();

  // Not used, but added because some bindings expect these fields
  public _checkInterval: ReturnType<typeof setInterval> | null = null;
  public meta: Map<number, { clock: number; lastUpdated: number }> = new Map();

  private participantIdToClientId: Map<string, number> = new Map();
  private room: RealtimeRoom | null = null;

  private visibilityTimeout: ReturnType<typeof setTimeout> | undefined;

  private readonly TIMEOUT_TIMER_MS = 30000;
  private readonly YJS_STATE = '__yjs';

  private previousState: any | null = null;
  private participantId: string = '';

  constructor(
    public doc: Y.Doc,
    private logger: Logger,
  ) {
    super();
    this.clientID = this.doc.clientID;
  }

  /**
   * @function connect
   * @description Start the awareness service
   * @param {RealtimeRoom} room Main room in which it will propagate presence
   * @returns {void}
   */
  public connect(participantId: string, room: RealtimeRoom): void {
    this.logger.log('[SuperViz | Awareness] - Connect awareness to room');
    this.participantId = participantId;

    this.room = room;
    this.addRoomListeners();
    this.addDocumentListeners();
    this.initializePresences();
  }

  // #region public methods
  /**
   * @function destroy
   * @description Destroy the awareness service and clean up all the listeners, states, etc
   * @returns {void}
   */
  public destroy(): void {
    this.logger.log('[SuperViz | Awareness] - Destroy awareness');

    this.setLocalState(null);
    this.removeAwarenessStates(Array.from(this.states.keys()), UpdateOrigin.LOCAL);

    clearTimeout(this.visibilityTimeout);
    this.visibilityTimeout = undefined;

    this.removeDocumentListeners();
    this.removeRoomListeners();

    this.room = null;
    this.states.clear();
    this.participantIdToClientId.clear();

    this.onLeave({ id: this.participantId } as unknown as PresenceEvent);
  }

  /**
   * @function getLocalState
   * @description Get the local state of the current participant, stores in the field yjs_state
   * @returns
   */
  public getLocalState(): Record<string, any> | null {
    this.logger.log(
      '[SuperViz | Awareness] - Get local state',
      this.states.get(this.clientID)?.[this.YJS_STATE],
    );

    const state = this.states.get(this.clientID);
    if (!state || !state[this.YJS_STATE]) return null;

    return state[this.YJS_STATE];
  }

  public getStates(): Map<number, Record<string, any>> {
    const states = new Map<number, Record<string, any>>();
    this.states.forEach((state, clientID) => {
      states.set(clientID, state[this.YJS_STATE]);
    });

    this.logger.log('[SuperViz | Awareness] - Get states', states);
    return states;
  }

  public setLocalState = (state: Record<string, any> | null): void => {
    this.logger.log('[SuperViz | Awareness] - Set local state', state);

    if (state === null) {
      if (!this.states.has(this.clientID)) return;
      this.states.delete(this.clientID);
      this.room?.presence.update<UpdatePresence>({
        ...this.states.get(this.clientID),
        [this.YJS_STATE]: null,
        origin: 'set local state null',
      });

      const update = { added: [], updated: [], removed: [this.clientID] };
      this.emit('change', [update, UpdateOrigin.LOCAL]);
      return;
    }

    const update = { added: [], updated: [], removed: [] };
    let oldState = this.states.get(this.clientID);
    if (oldState) {
      update.updated.push(this.clientID);
    } else {
      oldState = { [this.YJS_STATE]: {}, clientID: this.clientID };
      update.added.push(this.clientID);
    }

    const newState = { ...oldState, [this.YJS_STATE]: state, origin: 'set local state' };
    this.states.set(this.clientID, newState);
    this.room?.presence.update<UpdatePresence>(newState);

    this.emit('change', [update, UpdateOrigin.LOCAL]);
  };

  public setLocalStateField(field: string, value: any): void {
    this.logger.log('[SuperViz | Awareness] - Set local state field', { field, value });

    const state = this.getLocalState();
    this.setLocalState({
      ...(state || {}),
      [field]: value,
    });
  }

  // #region events listeners
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

  // #region events callbacks
  private onLeave = (event: PresenceEvent): void => {
    const clientID = this.participantIdToClientId.get(event.id);
    this.logger.log('[SuperViz | Awareness] - Participant left', { participant: event, clientID });

    if (!clientID) return;

    if (clientID === this.clientID) {
      const ids = Array.from(this.states.keys());
      this.removeAwarenessStates(ids, UpdateOrigin.PRESENCE);
      return;
    }

    const update = { added: [], updated: [], removed: [clientID] };
    this.participantIdToClientId.delete(event.id);
    this.states.delete(clientID);

    this.emit('update', [update, UpdateOrigin.PRESENCE]);
    this.emit('change', [update, UpdateOrigin.PRESENCE]);
  };

  private onUpdate = (event: PresenceEvent<UpdatePresence>): void => {
    if (event.id === this.participantId) return;

    this.logger.log('[SuperViz | Awareness] - Participant updated', event);

    if (event.data[this.YJS_STATE] === null) {
      this.removeAwarenessStates([event.data.clientID], UpdateOrigin.PRESENCE);
      return;
    }

    const added: number[] = [];
    const updated: number[] = [];
    let clientID = this.participantIdToClientId.get(event.id);

    if (clientID) {
      updated.push(event.data.clientID);
    } else {
      this.participantIdToClientId.set(event.id, event.data.clientID);
      clientID = event.data.clientID;
      added.push(event.data.clientID);
    }

    this.states.set(clientID, {
      ...(this.states.get(clientID) || {}),
      ...event.data,
    });

    this.emit('update', [{ added, updated, removed: [] }, UpdateOrigin.PRESENCE]);
    this.emit('change', [{ added, updated, removed: [] }, UpdateOrigin.PRESENCE]);
  };

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

  // #region private methods
  private initializePresences() {
    this.room.presence.get((presences: PresenceEvent<UpdatePresence>[]) => {
      const added: number[] = [];

      presences.forEach((presence) => {
        const { clientID } = presence.data;
        if (!clientID) return;
        added.push(clientID);
        this.participantIdToClientId.set(presence.id, clientID);
        this.states.set(clientID, {
          ...presence.data,
        });
      });

      const { clientID } = this.doc;
      this.room.presence.update<UpdatePresence>({
        clientID,
        [this.YJS_STATE]: {},
        ...(this.states.get(clientID) || {}),
        origin: 'on connect',
      });

      const update = { added, updated: [], removed: [] };

      this.emit('change', [update, UpdateOrigin.PRESENCE]);
    });
  }

  private removeAwarenessStates(removed: number[], origin: UpdateOrigin): void {
    this.logger.log('[SuperViz | Awareness] - Remove awareness states', { removed, origin });

    const update = { added: [], updated: [], removed: [] };
    removed.forEach((clientID) => {
      if (!this.states.get(clientID)) return;

      this.states.delete(clientID);
      update.removed.push(clientID);
    });

    this.emit('change', [update, origin]);
  }
}
