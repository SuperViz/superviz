import Bowser from 'bowser';

import { BrowserStats } from './types';

export class BrowserService {
  private browser: Bowser.Parser.Parser;

  constructor() {
    this.browser = Bowser.getParser(navigator.userAgent);
  }

  public get clientStats(): BrowserStats {
    return this.browser.getResult();
  }

  public get isFirefox(): boolean {
    return this.browser.isBrowser(Bowser.BROWSER_MAP.firefox);
  }

  public get isSafari(): boolean {
    return this.browser.isBrowser(Bowser.BROWSER_MAP.safari);
  }

  public get isChrome(): boolean {
    return this.browser.isBrowser(Bowser.BROWSER_MAP.chrome);
  }

  public get isIE(): boolean {
    return this.browser.isBrowser(Bowser.BROWSER_MAP.ie);
  }

  public get isEdge(): boolean {
    return this.browser.isBrowser(Bowser.BROWSER_MAP.edge);
  }

  public get isMobileDevice(): boolean {
    const isMobile =
      this.browser.is(Bowser.PLATFORMS_MAP.mobile) || this.browser.is(Bowser.PLATFORMS_MAP.tablet);

    return isMobile && !navigator.userAgent.match(/iPad/i);
  }

  public get isTabletDevice(): boolean {
    return this.browser.is(Bowser.PLATFORMS_MAP.tablet);
  }

  public get isAndroid(): boolean {
    return this.isMobileDevice && !!navigator.userAgent.match(/Android/i);
  }

  public get isIpad(): boolean {
    return !!navigator.userAgent.match(/iPad/i);
  }

  public get isIphone(): boolean {
    return this.isMobileDevice && !!navigator.userAgent.match(/iPhone/i);
  }

  public get isAppleMobileDevice(): boolean {
    return this.isIpad || this.isIphone;
  }
}
