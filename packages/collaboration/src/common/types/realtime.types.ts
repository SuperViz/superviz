export enum RealtimeStateTypes {
  DISCONNECTED = 0,
  INITIALIZING = 1,
  READY_TO_JOIN = 2,
  CONNECTING = 3,
  CONNECTED = 4,
  JOINED = 5,
  FAILED = -1,
  RETRYING = -2,
}
