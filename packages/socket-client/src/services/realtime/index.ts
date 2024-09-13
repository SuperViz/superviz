import { type Socket, Manager } from 'socket.io-client';

import { Presence } from '../../common/types/presence.types';
import { config } from '../../config';
import { ClientConnection } from '../connection';
import { ClientState } from '../connection/types';
import { Room } from '../room';

export class Realtime {
  private socket: Socket;
  private manager: Manager;
  public connection: ClientConnection;

  constructor(
    private apiKey: string,
    private environment: 'dev' | 'prod',
    private presence: Presence,
    private secret?: string,
    private clientId?: string,
  ) {
    this.manager = new Manager(config.serverUrl, {
      addTrailingSlash: false,
      secure: true,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      extraHeaders: {
        'sv-api-key': this.apiKey,
      },
    });

    let origin;
    if (typeof window !== 'undefined') {
      origin = window.location.origin;
    }

    this.socket = this.manager.socket(`/${environment}`, {
      auth: {
        apiKey: this.apiKey,
        origin,
        envirioment: this.environment,
        secret: this.secret,
        clientId: this.clientId,
      },
    });

    this.connection = new ClientConnection(this.socket);
  }

  public get state(): ClientState {
    return this.connection.state;
  }

  /**
   * @function connect
   * @param room - The room name
   * @param maxConnections - The maximum number of connections allowed in the room
   * @returns {Room} - The room instance
   */
  public connect(room: string, maxConnections?: number | 'unlimited'): Room {
    return Room.register(this.socket, this.presence, room, this.apiKey, maxConnections);
  }

  public destroy() {
    this.socket.disconnect();
    this.connection.off();
  }
}
