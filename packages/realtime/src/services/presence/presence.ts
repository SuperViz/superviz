import { Logger } from '../../utils';
import * as Socket from '@superviz/socket-client';

export class RealtimePresence {
  private logger: Logger;

  constructor(private room: Socket.Room) {
    this.logger = new Logger('@superviz/realtime-presence');
  }

  public update<T = any>(data: T) {
    this.logger.log('Realtime Presence @ update presence', data);
    this.room.presence.update(data);
  }

  public subscribe<T = unknown>(
    event: Socket.PresenceEventsArg,
    callback: Socket.PresenceCallback<T>,
  ) {
    this.logger.log('Realtime Presence @ subscribe', event);
    this.room.presence.on(event, callback);
  }

  public unsubscribe(event: Socket.PresenceEventsArg) {
    this.logger.log('Realtime Presence @ unsubscribe', event);
    this.room.presence.off(event);
  }

  public async getAll() {
    this.logger.log('Realtime Presence @ get all');
    return new Promise<Socket.PresenceEvent[]>((resolve, reject) => {
      this.room.presence.get(
        (data) => resolve(data),
        (error) => {
          const message = `[SuperViz] ${error.name} - ${error.message}`;
          this.logger.log(error);
          console.error(message);
          reject(error);
        },
      );
    });
  }
}
