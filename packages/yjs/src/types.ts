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
  apiKey: string;
  environment: EnvironmentTypes | `${EnvironmentTypes}`;
  participant: Participant;
  room?: string;
  connect?: boolean;
  debug?: boolean;
  // awareness?: boolean = true;
};

export enum ProviderState {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
}

export enum ProviderEvents {
  MESSAGE_TO_HOST = 'message-to-host',
  MESSAGE_TO_SPECIFIC_USER = 'message-to-specific-user',
  BROADCAST = 'broadcast',
  UPDATE = 'update',
}

export type MessageToHost = {
  update: Uint8Array;
  originId: string;
};

export type MessageToTarget = {
  update: Uint8Array;
  targetId: string;
};

export type DocUpdate = {
  update: Uint8Array;
};

// different values that the user can receive when event 'message'
// is emitted based on the event name
export type Message =
  | {
      name: ProviderEvents.MESSAGE_TO_HOST | `${ProviderEvents.MESSAGE_TO_HOST}`;
      data: { update: Uint8Array; originId: string };
    }
  | {
      name: ProviderEvents.MESSAGE_TO_SPECIFIC_USER | `${ProviderEvents.MESSAGE_TO_SPECIFIC_USER}`;
      data: { update: Uint8Array; targetId: string };
    }
  | { name: ProviderEvents.BROADCAST | `${ProviderEvents.BROADCAST}`; data: { update: Uint8Array } }
  | { name: ProviderEvents.UPDATE | `${ProviderEvents.UPDATE}`; data: { update: Uint8Array } };

export type MessageCallback = (message: Message) => void;

export type Emitter = <T extends Message['name']>(
  name: T,
  data: Extract<Message, { name: T }>['data'],
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
};

export type RealtimeRoom = Omit<Room, 'emit'> & { emit: Emitter };
