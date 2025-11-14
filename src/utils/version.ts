/**
 * Version management and update checking for Chromium/Puppeteer
 */

import * as semver from 'semver';
import { logger } from './logger';

export interface VersionInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
  isSupported: boolean;
  recommendation?: string;
}

export class VersionManager {
  private static readonly MIN_SUPPORTED_VERSION = '24.15.0';
  private static readonly PUPPETEER_PACKAGE = 'puppeteer';

  /**
   * Check current Puppeteer version
   */
  static async getCurrentVersion(): Promise<string> {
    try {
      // Get version from package.json
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const packageJson = require('../../package.json');
      return packageJson.dependencies.puppeteer.replace('^', '').replace('~', '');
    } catch (error) {
      logger.error('Failed to get current version:', error);
      return '0.0.0';
    }
  }

  /**
   * Check if current version is supported
   */
  static async isVersionSupported(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    return semver.gte(currentVersion, this.MIN_SUPPORTED_VERSION);
  }

  /**
   * Get version information with recommendations
   */
  static async getVersionInfo(): Promise<VersionInfo> {
    const current = await this.getCurrentVersion();
    const isSupported = await this.isVersionSupported();

    const versionInfo: VersionInfo = {
      current,
      latest: 'Unknown', // In real scenario, would fetch from npm registry
      updateAvailable: false,
      isSupported,
    };

    if (!isSupported) {
      versionInfo.recommendation = `Update Puppeteer to v${this.MIN_SUPPORTED_VERSION} or higher`;
      logger.warn(`Puppeteer version ${current} is not supported. ${versionInfo.recommendation}`);
    }

    return versionInfo;
  }

  /**
   * Check for Chromium updates and log recommendations
   */
  static async checkForUpdates(): Promise<void> {
    const versionInfo = await this.getVersionInfo();

    logger.info('Puppeteer Version Check:', {
      current: versionInfo.current,
      supported: versionInfo.isSupported,
    });

    if (!versionInfo.isSupported) {
      logger.warn('IMPORTANT: Please update Puppeteer to maintain compatibility');
      logger.warn(`Run: npm install ${this.PUPPETEER_PACKAGE}@latest`);
    }
  }

  /**
   * Get Chromium version from browser
   */
  static async getBrowserVersion(browser: any): Promise<string> {
    try {
      return await browser.version();
    } catch (error) {
      logger.error('Failed to get browser version:', error);
      return 'Unknown';
    }
  }

  /**
   * Validate browser compatibility
   */
  static async validateBrowserCompatibility(browser: any): Promise<boolean> {
    try {
      const version = await this.getBrowserVersion(browser);
      logger.info(`Browser version: ${version}`);

      // Extract version number from Chrome/xxx.x.x.x format
      const match = version.match(/(\d+)\./);
      if (match) {
        const majorVersion = parseInt(match[1], 10);
        // Chrome 121+ is recommended
        if (majorVersion >= 121) {
          logger.info('Browser version is compatible');
          return true;
        } else {
          logger.warn(`Browser version ${majorVersion} may be outdated. Chrome 121+ recommended.`);
          return true; // Still return true for now, just warn
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate browser compatibility:', error);
      return false;
    }
  }
}
