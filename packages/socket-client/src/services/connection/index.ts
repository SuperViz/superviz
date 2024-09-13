import { Subject } from 'rxjs';
import type { Socket } from 'socket.io-client';

import { ErrorCallback } from '../../common/types/callbacks.types';
import { Logger } from '../../utils';

import { ClientState, ConnectionState, SocketErrorEvent, SocketEvent } from './types';

export class ClientConnection {
  private logger: Logger;
  private stateObserver: Subject<ConnectionState>;

  public state: ClientState;

  constructor(private socket: Socket) {
    this.logger = new Logger('@superviz/socket-client/connection');
    this.subscribeToManagerEvents();
    this.stateObserver = new Subject();
  }

  public on(next: (state: ConnectionState) => void, error?: ErrorCallback) {
    if (this.stateObserver.closed) {
      this.stateObserver = new Subject();
    }

    this.stateObserver.subscribe({
      next,
      error,
    });
  }

  public off() {
    if (this.stateObserver.closed) return;

    this.stateObserver.unsubscribe();
  }

  /**
   * @function subscribeToManagerEvents
   * @description Subscribe to the manager events
   * @returns {void}
   */
  private subscribeToManagerEvents(): void {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('connect_error', this.onConnectError);
    this.socket.io.on('error', this.onConnectionError);
    this.socket.io.on('reconnect', this.onReconnect);
    this.socket.io.on('reconnect_attempt', this.onReconnecAttempt);
    this.socket.io.on('reconnect_error', this.onReconnectError);
    this.socket.io.on('reconnect_failed', this.onReconnectFailed);

    // custom validations listener
    this.socket.on(SocketEvent.ERROR, this.onCustomError);
  }

  /**
   * @function changeState
   * @description Change the state of the connection
   * @returns {void}
   */
  private changeState(state: ClientState, reason?: string): void {
    this.state = state;

    if (this.stateObserver.closed) return;

    this.stateObserver.next({
      state,
      reason,
    });
  }

  /** Manager events handlers */

  private onConnect = () => {
    this.logger.log('connection @ on connect', 'Connected to the socket');
    this.changeState(ClientState.CONNECTED);
  };

  private onDisconnect = (reason: Socket.DisconnectReason) => {
    this.logger.log('connection @ on disconnect', 'Disconnected from the socket');
    this.changeState(ClientState.DISCONNECTED, reason);
  };

  private onConnectError = (error: Error) => {
    this.logger.log('connection @ on connect error', 'Connection error', error);
    this.changeState(ClientState.CONNECTION_ERROR, error.message);
  };

  private onConnectionError = (error: Error) => {
    this.logger.log('connection @ on connection error', 'Connection error', error);
    this.changeState(ClientState.CONNECTION_ERROR, error.message);
  };

  private onReconnect = () => {
    this.logger.log('connection @ on reconnect', 'Reconnected to the socket');
    this.changeState(ClientState.CONNECTED);
  };

  private onReconnectError = (error: Error) => {
    this.logger.log('connection @ on reconnect error', 'Reconnect error', error);
    this.changeState(ClientState.RECONNECT_ERROR, error.message);
  };

  private onReconnectFailed = () => {
    this.logger.log('connection @ on reconnect failed', 'Failed to reconnect to the socket');
    this.changeState(ClientState.RECONNECT_ERROR);
  };

  private onReconnecAttempt = (attempt: number) => {
    this.logger.log('connection @ on reconnect attempt', `Reconnect attempt #${attempt}`);
    this.changeState(ClientState.RECONNECTING, `Reconnect attempt #${attempt}`);
  };

  private onCustomError = (error: SocketErrorEvent) => {
    if (error.needsToDisconnect) {
      this.socket.disconnect();
      this.changeState(ClientState.DISCONNECTED, error.errorType);
    }

    const logMessage = `[SuperViz] 
    - Error: ${error.errorType}
    - Message: ${error.message}
    `;

    if (error.level === 'error') {
      console.error(logMessage);
      return;
    }

    console.warn(logMessage);
  };
}
