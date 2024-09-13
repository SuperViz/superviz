export type PresenceEvent<T = unknown> = {
  id: string;
  name: string;
  connectionId: string;
  data: T;
  timestamp: number;
};

export interface PresenceEventFromServer extends PresenceEvent {
  roomKey: string;
  roomId: string;
}

export type PresenceCallback<T = unknown> = (event: PresenceEvent<T>) => void;
