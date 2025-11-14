import puppeteer, { Browser, Page } from 'puppeteer';
import { BrowserConfig } from '../types';
import { logger } from '../utils/logger';
import { ExtensionLoader } from '../extensions/loader';
import { HealthMonitor, RetryManager, PerformanceTracker } from '../utils/health';
import { VersionManager } from '../utils/version';

export class BrowserManager {
  private browser: Browser | null = null;
  private config: BrowserConfig;
  private extensionLoader: ExtensionLoader;
  private healthMonitor: HealthMonitor;
  private performanceTracker: PerformanceTracker;
  private launchAttempts = 0;
  private maxLaunchAttempts = 3;

  constructor(config: BrowserConfig) {
    this.config = config;
    this.extensionLoader = new ExtensionLoader(config.extensionsPath);
    this.healthMonitor = new HealthMonitor();
    this.performanceTracker = new PerformanceTracker();

    // Register recovery strategies
    this.registerRecoveryStrategies();
  }

  /**
   * Register self-healing recovery strategies
   */
  private registerRecoveryStrategies(): void {
    // Strategy 1: Restart browser
    this.healthMonitor.registerRecoveryStrategy({
      name: 'restart-browser',
      maxRetries: 3,
      execute: async () => {
        try {
          logger.info('Recovery: Attempting to restart browser');
          await this.close();
          await this.launch();
          return this.browser !== null;
        } catch (error) {
          logger.error('Recovery: Browser restart failed:', error);
          return false;
        }
      },
    });

    // Strategy 2: Clear browser data and restart
    this.healthMonitor.registerRecoveryStrategy({
      name: 'clear-and-restart',
      maxRetries: 2,
      execute: async () => {
        try {
          logger.info('Recovery: Clearing browser data and restarting');
          await this.close();
          // Clear user data dir if configured
          if (this.config.userDataDir) {
            logger.info('Recovery: User data dir will be recreated on next launch');
          }
          await this.launch();
          return this.browser !== null;
        } catch (error) {
          logger.error('Recovery: Clear and restart failed:', error);
          return false;
        }
      },
    });

    // Strategy 3: Launch without extensions as fallback
    this.healthMonitor.registerRecoveryStrategy({
      name: 'launch-without-extensions',
      maxRetries: 1,
      execute: async () => {
        try {
          logger.info('Recovery: Attempting launch without extensions');
          await this.close();
          const originalExtPath = this.config.extensionsPath;
          this.config.extensionsPath = undefined; // Temporarily disable extensions
          await this.launch();
          this.config.extensionsPath = originalExtPath;
          return this.browser !== null;
        } catch (error) {
          logger.error('Recovery: Launch without extensions failed:', error);
          return false;
        }
      },
    });
  }

  /**
   * Launch the browser with extensions and self-healing capabilities
   */
  async launch(): Promise<Browser> {
    const startTime = Date.now();

    try {
      // Check version compatibility
      await VersionManager.checkForUpdates();

      // Use retry logic for launch
      this.browser = await RetryManager.withRetry(
        async () => {
          return await this.launchBrowser();
        },
        {
          maxRetries: this.maxLaunchAttempts,
          initialDelay: 2000,
          maxDelay: 10000,
          onRetry: (error, attempt) => {
            logger.warn(`Browser launch attempt ${attempt} failed:`, error.message);
            this.launchAttempts = attempt;
          },
        }
      );

      logger.info('Browser launched successfully');

      // Validate browser compatibility
      await VersionManager.validateBrowserCompatibility(this.browser);

      // Log browser version
      const version = await this.browser.version();
      logger.info(`Browser version: ${version}`);

      // Track performance
      const duration = Date.now() - startTime;
      this.performanceTracker.trackOperation('browser-launch', duration);

      // Analyze and log performance suggestions
      const suggestions = this.performanceTracker.analyzePerformance('browser-launch');
      if (suggestions.length > 0) {
        logger.info('Performance suggestions:', suggestions);
      }

      // Reset launch attempts counter
      this.launchAttempts = 0;

      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser after retries:', error);

      // Attempt self-healing
      const recovered = await this.healthMonitor.attemptSelfHealing();
      if (recovered && this.browser) {
        return this.browser;
      }

      throw error;
    }
  }

  /**
   * Internal browser launch logic
   */
  private async launchBrowser(): Promise<Browser> {
    const extensionPaths = await this.extensionLoader.getExtensionPaths();

    const launchOptions: any = {
      headless: this.config.headless,
      devtools: this.config.devtools,
      args: [
        ...(this.config.args || []),
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Overcome limited resource problems
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu', // Applicable for headless mode
      ],
    };

    // Add extensions if any are found
    if (extensionPaths.length > 0) {
      launchOptions.args.push(
        `--disable-extensions-except=${extensionPaths.join(',')}`,
        `--load-extension=${extensionPaths.join(',')}`
      );
      launchOptions.headless = false; // Extensions require headed mode
      logger.info(`Loading ${extensionPaths.length} extension(s)`);
    }

    if (this.config.userDataDir) {
      launchOptions.userDataDir = this.config.userDataDir;
    }

    return await puppeteer.launch(launchOptions);
  }

  /**
   * Create a new page with retry logic
   */
  async newPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not launched');
    }

    const startTime = Date.now();

    try {
      const page = await RetryManager.withRetry(
        async () => {
          if (!this.browser) {
            throw new Error('Browser not available');
          }
          return await this.browser.newPage();
        },
        {
          maxRetries: 2,
          initialDelay: 1000,
        }
      );

      if (this.config.viewport) {
        await page.setViewport(this.config.viewport);
      }

      // Track performance
      const duration = Date.now() - startTime;
      this.performanceTracker.trackOperation('page-creation', duration);

      return page;
    } catch (error) {
      logger.error('Failed to create new page:', error);

      // Check if error is due to browser being closed
      if (RetryManager.isRetryableError(error as Error)) {
        logger.warn('Browser may be unhealthy, attempting recovery...');
        const recovered = await this.healthMonitor.attemptSelfHealing();
        if (recovered && this.browser) {
          return await this.browser.newPage();
        }
      }

      throw error;
    }
  }

  /**
   * Get all pages with health check
   */
  async getPages(): Promise<Page[]> {
    if (!this.browser) {
      throw new Error('Browser not launched');
    }

    try {
      return await this.browser.pages();
    } catch (error) {
      logger.error('Failed to get pages:', error);

      // Attempt recovery if browser is unresponsive
      if (RetryManager.isRetryableError(error as Error)) {
        const recovered = await this.healthMonitor.attemptSelfHealing();
        if (recovered && this.browser) {
          return await this.browser.pages();
        }
      }

      throw error;
    }
  }

  /**
   * Get launch attempt count for monitoring
   */
  getLaunchAttempts(): number {
    return this.launchAttempts;
  }

  /**
   * Close the browser gracefully
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        logger.info('Browser closed successfully');
      } catch (error) {
        logger.error('Error closing browser:', error);
        // Force null even if close fails
        this.browser = null;
      }
    }
  }

  /**
   * Get browser instance
   */
  getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Check if browser is running and healthy
   */
  isRunning(): boolean {
    try {
      return this.browser !== null && this.browser.process() !== null;
    } catch (error) {
      logger.error('Error checking browser status:', error);
      return false;
    }
  }

  /**
   * Perform health check on browser
   */
  async performHealthCheck(): Promise<boolean> {
    const healthStatus = await this.healthMonitor.checkHealth([
      async () => {
        return this.isRunning();
      },
      async () => {
        if (!this.browser) return false;
        try {
          const pages = await this.browser.pages();
          return pages !== null;
        } catch {
          return false;
        }
      },
    ]);

    if (!healthStatus.healthy) {
      logger.warn('Browser health check failed', healthStatus);
      return false;
    }

    return true;
  }

  /**
   * Get loaded extensions
   */
  getLoadedExtensions() {
    return this.extensionLoader.getLoadedExtensions();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceTracker.getAllMetrics();
  }

  /**
   * Get performance improvement suggestions
   */
  getImprovementSuggestions() {
    return this.performanceTracker.getImprovements();
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return this.healthMonitor.getHealthStatus();
  }
}
