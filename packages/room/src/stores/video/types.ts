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

export interface DrawingData {
  name: string;
  lineColor: string;
  textColor: string;
  pencil: string;
  clickX?: number[];
  clickY?: number[];
  clickDrag?: boolean[];
  drawingWidth: number;
  drawingHeight: number;
  externalClickX: number;
  externalClickY: number;
  fadeOut: boolean;
}

export enum TranscriptState {
  TRANSCRIPT_START = 'transcript.start',
  TRANSCRIPT_RUNNING = 'transcript.running',
  TRANSCRIPT_STOP = 'transcript.stop',
}
