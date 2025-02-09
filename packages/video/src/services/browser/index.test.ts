import { BrowserService } from './index';

const createBrowserServiceInstance = (userAgent: string): BrowserService => {
  jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  return new BrowserService();
};

const IPAD_USER_AGENT =
  'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1';
const IPHONE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36';
const ANDROID_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.131 Mobile Safari/537.36';
const EDGE_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.50';
const FIREFOX_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0';
const SAFARI_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15';
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36';
const IE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';

describe('BrowserService', () => {
  describe('clientStats', () => {
    test('should return the result of the Bowser parser', () => {
      const browserService = createBrowserServiceInstance(DESKTOP_USER_AGENT);
      const expectedResult = {
        browser: { name: 'Chrome', version: '113.0.0.0' },
        engine: { name: 'Blink' },
        os: { name: 'Windows', version: 'NT 10.0', versionName: '10' },
        platform: { type: 'desktop' },
      };

      expect(browserService.clientStats).toEqual(expectedResult);
    });
  });

  describe('isFirefox', () => {
    test('should return true if the browser is Firefox', () => {
      const browserService = createBrowserServiceInstance(FIREFOX_USER_AGENT);
      expect(browserService.isFirefox).toBe(true);
    });

    test('should return false if the browser is not Firefox', () => {
      const browserService = createBrowserServiceInstance(CHROME_USER_AGENT);
      expect(browserService.isFirefox).toBe(false);
    });
  });

  describe('isSafari', () => {
    test('should return true if the browser is Safari', () => {
      const browserService = createBrowserServiceInstance(SAFARI_USER_AGENT);
      expect(browserService.isSafari).toBe(true);
    });

    test('should return false if the browser is not Safari', () => {
      const browserService = createBrowserServiceInstance(CHROME_USER_AGENT);
      expect(browserService.isSafari).toBe(false);
    });
  });

  describe('isChrome', () => {
    test('should return true if the browser is Chrome', () => {
      const browserService = createBrowserServiceInstance(CHROME_USER_AGENT);
      expect(browserService.isChrome).toBe(true);
    });

    test('should return false if the browser is not Chrome', () => {
      const browserService = createBrowserServiceInstance(SAFARI_USER_AGENT);
      expect(browserService.isChrome).toBe(false);
    });
  });

  describe('isIE', () => {
    test('should return true if the browser is IE', () => {
      const browserService = createBrowserServiceInstance(IE_USER_AGENT);
      expect(browserService.isIE).toBe(true);
    });

    test('should return false if the browser is not IE', () => {
      const browserService = createBrowserServiceInstance(CHROME_USER_AGENT);
      expect(browserService.isIE).toBe(false);
    });
  });

  describe('isEdge', () => {
    test('should return true if the browser is Edge', () => {
      const browserService = createBrowserServiceInstance(EDGE_USER_AGENT);
      expect(browserService.isEdge).toBe(true);
    });

    test('should return false if the browser is not Edge', () => {
      const browserService = createBrowserServiceInstance(CHROME_USER_AGENT);
      expect(browserService.isEdge).toBe(false);
    });
  });

  describe('isMobileDevice', () => {
    test('should return true if the device is a mobile device', () => {
      const browserService = createBrowserServiceInstance(IPHONE_USER_AGENT);
      expect(browserService.isMobileDevice).toBe(true);
    });

    test('should return false if the device is not a mobile device', () => {
      const browserService = createBrowserServiceInstance(DESKTOP_USER_AGENT);
      expect(browserService.isMobileDevice).toBe(false);
    });

    test('should return false if the device is an iPad', () => {
      const browserService = createBrowserServiceInstance(IPAD_USER_AGENT);
      expect(browserService.isMobileDevice).toBe(false);
    });
  });

  describe('isTabletDevice', () => {
    test('should return true if the device is a tablet device', () => {
      const browserService = createBrowserServiceInstance(IPAD_USER_AGENT);
      expect(browserService.isTabletDevice).toBe(true);
    });

    test('should return false if the device is not a tablet device', () => {
      const browserService = createBrowserServiceInstance(DESKTOP_USER_AGENT);
      expect(browserService.isTabletDevice).toBe(false);
    });
  });

  describe('isAndroid', () => {
    test('should return true if the device is an Android device', () => {
      const browserService = createBrowserServiceInstance(ANDROID_USER_AGENT);
      expect(browserService.isAndroid).toBe(true);
    });

    test('should return false if the device is not an Android device', () => {
      const browserService = createBrowserServiceInstance(DESKTOP_USER_AGENT);
      expect(browserService.isAndroid).toBe(false);
    });
  });

  describe('isIpad', () => {
    test('should return true if the device is an iPad', () => {
      const browserService = createBrowserServiceInstance(IPAD_USER_AGENT);
      expect(browserService.isIpad).toBe(true);
    });

    test('should return false if the device is not an iPad', () => {
      const browserService = createBrowserServiceInstance(DESKTOP_USER_AGENT);
      expect(browserService.isIpad).toBe(false);
    });
  });

  describe('isIphone', () => {
    test('should return true if the device is an iPhone', () => {
      const browserService = createBrowserServiceInstance(IPHONE_USER_AGENT);
      expect(browserService.isIphone).toBe(true);
    });

    test('should return false if the device is not an iPhone', () => {
      const browserService = createBrowserServiceInstance(IPAD_USER_AGENT);
      expect(browserService.isIphone).toBe(false);
    });
  });

  describe('isAppleMobileDevice', () => {
    test('should return true if the device is an iPad', () => {
      const browserService = createBrowserServiceInstance(IPAD_USER_AGENT);
      expect(browserService.isAppleMobileDevice).toBe(true);
    });

    test('should return true if the device is an iPhone', () => {
      const browserService = createBrowserServiceInstance(IPHONE_USER_AGENT);
      expect(browserService.isAppleMobileDevice).toBe(true);
    });

    test('should return false if the device is not an Apple mobile device', () => {
      const browserService = createBrowserServiceInstance(DESKTOP_USER_AGENT);
      expect(browserService.isAppleMobileDevice).toBe(false);
    });
  });
});
