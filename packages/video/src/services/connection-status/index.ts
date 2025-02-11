import { MeetingConnectionStatus } from '../../common/types/events.types';
import { Logger } from '../../common/utils/logger';
import { Observer } from '../../common/utils/observer';

import { DefaultConnectionService, WindowConnectionStatus } from './types';

export class ConnectionService implements DefaultConnectionService {
  private readonly logger: Logger;

  public connectionStatus: MeetingConnectionStatus;
  public oldConnectionStatus: MeetingConnectionStatus;
  public connectionStatusObserver: Observer;

  constructor() {
    this.logger = new Logger('@superviz/video/connection-service');

    this.connectionStatus = MeetingConnectionStatus.NOT_AVAILABLE;
    this.connectionStatusObserver = new Observer({ logger: this.logger });
  }

  /**
   * @function addListeners
   * @description add browser listeners to connection status
   * @returns {void}
   */
  public addListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onUpdateBrowserOnlineStatus);
      window.addEventListener('offline', this.onUpdateBrowserOnlineStatus);
    }
  }

  /**
   * @function removeListeners
   * @description remove browser listeners to connection status
   * @returns {void}
   */
  public removeListeners(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onUpdateBrowserOnlineStatus);
      window.removeEventListener('offline', this.onUpdateBrowserOnlineStatus);
    }
  }

  /**
   * @function updateMeetingConnectionStatus
   * @description update connection status of audio/video services in ConnectionService
   * @param {MeetingConnectionStatus} newStatus - new connection status
   * @returns {void}
   */
  public updateMeetingConnectionStatus = (newStatus: MeetingConnectionStatus): void => {
    this.oldConnectionStatus = this.connectionStatus;
    this.connectionStatus = newStatus;
    this.connectionStatusObserver.publish(newStatus);

    this.logger.log('CONNECTION STATUS CHANGE', newStatus);
  };

  /**
   * @function onUpdateBrowserOnlineStatus
   * @description updates connection status based on browser connection status
   * @param {Event} event - DOM Event
   * @returns {void}
   */
  private onUpdateBrowserOnlineStatus = (event: Event): void => {
    const { type } = event;
    const status: WindowConnectionStatus = type as WindowConnectionStatus;

    if (status === 'online') {
      this.updateMeetingConnectionStatus(MeetingConnectionStatus.GOOD);
      return;
    }

    this.updateMeetingConnectionStatus(MeetingConnectionStatus.DISCONNECTED);
  };
}
