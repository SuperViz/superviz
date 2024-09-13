/**
 * @enum ClientState
 * @description the state of the client
 * @property CONNECTED - the client is connected
 * @property CONNECTING - the client is connecting
 * @property DISCONNECTED - the client is disconnected
 * @property CONNECTION_ERROR - the client has a connection error
 * @property RECONNECTING - the client is reconnecting
 * @property RECONNECT_ERROR - the client has a reconnect error
 */
export enum ClientState {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  RECONNECTING = 'RECONNECTING',
  RECONNECT_ERROR = 'RECONNECT_ERROR',
}

/**
 * @interface ConnectionState
 * @description the state of the connection
 * @property state - the state of the connection
 * @property reason - the reason for the state change
 */
export interface ConnectionState {
  state: ClientState;
  reason?: string;
}

export type SocketErrorEvent = {
  errorType:
    | 'message-size-limit'
    | 'rate-limit'
    | 'room-connections-limit'
    | 'user-already-in-room';
  message: string;
  connectionId: string;
  needsToDisconnect: boolean;
  level: 'error' | 'warn';
};

export enum SocketEvent {
  ERROR = 'socket-event.error',
}
