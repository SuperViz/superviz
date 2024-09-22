export enum UpdateOrigin {
  PRESENCE = 'presence',
  LOCAL = 'local',
}

export interface UpdatePresence {
  clientId: number;
  __yjs: any;
}
