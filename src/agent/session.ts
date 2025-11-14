import { randomUUID } from 'crypto';
import { SessionInfo } from '../types';
import { BrowserManager } from './browser';
import { logger } from '../utils/logger';

export class SessionManager {
  private sessionId: string;
  private startTime: Date;
  private browserManager: BrowserManager;

  constructor(browserManager: BrowserManager) {
    this.sessionId = randomUUID();
    this.startTime = new Date();
    this.browserManager = browserManager;
  }

  /**
   * Get session information
   */
  async getSessionInfo(): Promise<SessionInfo> {
    const browser = this.browserManager.getBrowser();

    if (!browser) {
      throw new Error('Browser not launched');
    }

    const version = await browser.version();
    const pages = await browser.pages();
    let userAgent = 'Unknown';
    if (pages.length > 0) {
      userAgent = await pages[0].evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - navigator is available in browser context
        return navigator.userAgent;
      });
    }

    const extensions = this.browserManager.getLoadedExtensions();

    return {
      id: this.sessionId,
      startTime: this.startTime,
      browser: {
        version,
        userAgent,
      },
      extensions: extensions.map((ext) => `${ext.name} v${ext.version}`),
    };
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get session uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * End the session
   */
  async endSession(): Promise<void> {
    logger.info(`Ending session ${this.sessionId} (uptime: ${this.getUptime()}s)`);
    await this.browserManager.close();
  }
}
