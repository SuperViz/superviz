export enum UpdateOrigin {
  PRESENCE = 'presence',
  LOCAL = 'local',
}

export interface UpdatePresence {
  clientID: number;
  __yjs: Record<string, any> | null;
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
