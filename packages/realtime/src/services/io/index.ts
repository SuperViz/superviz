import * as Socket from '@superviz/socket-client';
import { Subject } from 'rxjs';

import { Participant } from '../../types/participant.types';
import config from '../config/index';

import { IOCState } from './types';

export class IOC {
  public state: Socket.ConnectionState;
  public client: Socket.Realtime;

  public stateSubject: Subject<IOCState> = new Subject();

  constructor(private participant: Participant) {
    this.createClient();
  }

  /**
   * @function destroy
   * @description Destroys the socket connection
   * @returns {void}
   */
  public destroy(): void {
    this.stateSubject.complete();
    this.client.destroy();
  }

  /**
   * @function subscribeToDefaultEvents
   * @description subscribe to the default socket events
   * @returns {void}
   */
  private subscribeToDefaultEvents(): void {
    this.client.connection.on(this.handleConnectionState);
  }

  private handleConnectionState = (state: Socket.ConnectionState): void => {
    if (state.reason === 'Unauthorized connection') {
      console.error(
        '[Superviz] Unauthorized connection. Please check your API key and if your domain is white listed.',
      );

      this.state = {
        state: Socket.ClientState.DISCONNECTED,
        reason: 'Unauthorized connection',
      };

      this.stateSubject.next(IOCState.AUTH_ERROR);

      return;
    }

    if (state.reason === 'user-already-in-room') {
      this.state = state;
      this.stateSubject.next(IOCState.SAME_ACCOUNT_ERROR);
      return;
    }

    this.state = state;
    this.stateSubject.next(state.state as unknown as IOCState);
  };

  /**
   * @function createClient
   * @description create a new socket client
   * @returns {void}
   */
  public createClient(): void {
    let environment = config.get<string>('environment') as 'dev' | 'prod';
    environment = ['dev', 'prod'].includes(environment) ? environment : 'dev';

    this.client = new Socket.Realtime(
      config.get<string>('apiKey'),
      environment,
      {
        id: this.participant.id,
        name: this.participant.name,
      },
      config.get<string>('secret'),
      config.get<string>('clientId'),
    );

    this.subscribeToDefaultEvents();
  }

  /**
   * @function createRoom
   * @description create and join realtime room
   * @param {string} roomName - name of the room that will be created
   * @param {number | 'unlimited'} connectionLimit -
   *  connection limit for the room, the default is 200 because it's the maximum number of slots
   * @returns {Room}
   */
  public createRoom(roomName: string, connectionLimit: number | 'unlimited' = 200): Socket.Room {
    return this.client.connect(`realtime-component:${roomName}`, connectionLimit);
  }
}
