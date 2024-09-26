export enum UpdateOrigin {
  PRESENCE = 'presence',
  LOCAL = 'local',
}

export interface UpdatePresence {
  clientId: number;
  yjs_state: any;
}

type AwarenessUpdate = {
  (
    update: { added: number[]; updated: number[]; removed: number[] },
    origin: UpdateOrigin | `${UpdateOrigin}`,
  ): void;
};

export type Events = {
  change: AwarenessUpdate;
  update: AwarenessUpdate;
};
