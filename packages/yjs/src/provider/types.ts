import type { StoreType } from '@superviz/sdk';
import type { Room } from '@superviz/socket-client';

export enum EnvironmentTypes {
  DEV = 'dev',
  PROD = 'prod',
}

export interface Participant {
  id: string;
  name: string;
}

export type Params = {
  // awareness?: boolean = true;
};

export enum ProviderState {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
}

export enum ProviderEvents {
  MESSAGE_TO_HOST = 'message-to-host',
  BROADCAST = 'broadcast',
  UPDATE = 'update',
}

export type MessageToHost = {
  update: Uint8Array;
  originId: string;
};

export type DocUpdate = {
  update: Uint8Array;
};

// different values that the user can receive when event 'message'
// is emitted based on the event name
export type Message = { name: `${ProviderEvents}` | ProviderEvents; data: { update: Uint8Array } };

export type MessageCallback = (message: Message) => void;

export type Emitter = (
  name: `${ProviderEvents}` | ProviderEvents,
  data: { update: Uint8Array },
) => void;

export type Events = {
  connect: () => void;
  disconnect: () => void;
  synced: () => void;
  sync: () => void;
  destroy: () => void;

  message: MessageCallback;
  outgoingMessage: MessageCallback;
  state: (state: ProviderState | `${ProviderState}`) => void;
  mount: () => void;
  unmount: () => void;
};

export type RealtimeRoom = Omit<Room, 'emit'> & { emit: Emitter };

export const storeType = {
  GLOBAL: 'global-store' as StoreType.GLOBAL,
};

export enum ComponentLifeCycleEvent {
  MOUNT = 'mount',
  UNMOUNT = 'unmount',
}
