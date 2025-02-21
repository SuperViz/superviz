import { MeetingConnectionStatus } from '../../common/types/events.types';

import { ConnectionService } from './index';

describe('ConnectionService', () => {
  let connectionService: ConnectionService;

  beforeEach(() => {
    connectionService = new ConnectionService();
    connectionService.addListeners();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addListeners', () => {
    it('should add event listeners to the window object', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      connectionService.addListeners();

      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('removeListeners', () => {
    it('should remove event listeners from the window object', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      connectionService.removeListeners();

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('updateMeetingConnectionStatus', () => {
    it('should update the connection status and notify observers', () => {
      const publishSpy = jest.spyOn(connectionService.connectionStatusObserver, 'publish');
      const newStatus = MeetingConnectionStatus.GOOD;

      connectionService.updateMeetingConnectionStatus(newStatus);

      expect(connectionService.oldConnectionStatus).toBe(MeetingConnectionStatus.NOT_AVAILABLE);
      expect(connectionService.connectionStatus).toBe(newStatus);
      expect(publishSpy).toHaveBeenCalledWith(newStatus);
    });
  });

  describe('onUpdateBrowserOnlineStatus', () => {
    it('should update the connection status to GOOD when the browser is online', () => {
      const updateMeetingConnectionStatusSpy = jest.spyOn(
        connectionService,
        'updateMeetingConnectionStatus',
      );

      const event = new Event('online');
      window.dispatchEvent(event);

      expect(updateMeetingConnectionStatusSpy).toHaveBeenCalledWith(MeetingConnectionStatus.GOOD);
    });

    it('should update the connection status to DISCONNECTED when the browser is offline', () => {
      const updateMeetingConnectionStatusSpy = jest.spyOn(
        connectionService,
        'updateMeetingConnectionStatus',
      );

      const event = new Event('offline');
      window.dispatchEvent(event);

      expect(updateMeetingConnectionStatusSpy).toHaveBeenCalledWith(
        MeetingConnectionStatus.DISCONNECTED,
      );
    });
  });
});
