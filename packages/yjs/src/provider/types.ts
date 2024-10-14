import type { StoreType } from '@superviz/sdk';
import type { Room } from '@superviz/socket-client';

export type Params = {
  awareness?: boolean;
};

export enum ProviderState {
  CONNECTED = 'provider.connected',
  CONNECTING = 'provider.connecting',
  DISCONNECTED = 'provider.disconnected',
}

export enum ProviderEvents {
  UPDATE = 'provider.update',
}

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
