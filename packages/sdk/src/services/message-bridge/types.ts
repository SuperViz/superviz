import {
  FrameEvent,
  DeviceEvent,
  MeetingEvent,
  RealtimeEvent,
} from '../../common/types/events.types';
import { Logger } from '../../common/utils/logger';

export interface MessageBridgeOptions {
  contentWindow: Window;
  logger: Logger;
  domains?: Array<string>;
  allowedOrigins?: string;
  sourceBlockList?: Array<string>;
}

export type Message = FrameEvent | DeviceEvent | MeetingEvent | RealtimeEvent | string;
