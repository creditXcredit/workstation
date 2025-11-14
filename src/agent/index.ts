import { AgentConfig, AgentCommand, AgentResponse } from '../types';
import { BrowserManager } from './browser';
import { SessionManager } from './session';
import { NavigateCommand, ScreenshotCommand } from './commands';
import { logger, createLogger } from '../utils/logger';

export class BrowserAgent {
  private browserManager: BrowserManager;
  private sessionManager: SessionManager | null = null;
  private commands: Map<string, any> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private performanceLogInterval: NodeJS.Timeout | null = null;

  constructor(config: AgentConfig) {
    // Initialize logger
    if (config.logging) {
      Object.assign(logger, createLogger(config.logging.level, config.logging.file));
    }

    // Initialize browser manager
    this.browserManager = new BrowserManager(config.browser);

    // Register commands
    this.registerCommand('navigate', new NavigateCommand(this.browserManager));
    this.registerCommand('screenshot', new ScreenshotCommand(this.browserManager));
  }

  /**
   * Start the agent with health monitoring
   */
  async start(): Promise<void> {
    try {
      logger.info('Starting Browser Agent...');

      // Launch browser
      await this.browserManager.launch();

      // Create session
      this.sessionManager = new SessionManager(this.browserManager);

      const sessionInfo = await this.sessionManager.getSessionInfo();
      logger.info('Browser Agent started successfully', sessionInfo);

      logger.info(`Session ID: ${sessionInfo.id}`);
      logger.info(`Browser: ${sessionInfo.browser.version}`);
      logger.info(`Extensions loaded: ${sessionInfo.extensions.length}`);
      sessionInfo.extensions.forEach((ext) => logger.info(`  - ${ext}`));

      // Start health monitoring
      this.startHealthMonitoring();

      // Start performance logging
      this.startPerformanceLogging();
    } catch (error) {
      logger.error('Failed to start Browser Agent:', error);
      throw error;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthMonitoring(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthy = await this.browserManager.performHealthCheck();
        if (!healthy) {
          logger.warn('Health check failed, system may need attention');
          const status = this.browserManager.getHealthStatus();
          logger.warn('Health status:', status);
        }
      } catch (error) {
        logger.error('Health check error:', error);
      }
    }, 30000);
  }

  /**
   * Start periodic performance logging
   */
  private startPerformanceLogging(): void {
    // Log performance metrics every 5 minutes
    this.performanceLogInterval = setInterval(() => {
      try {
        const metrics = this.browserManager.getPerformanceMetrics();
        const improvements = this.browserManager.getImprovementSuggestions();

        logger.info('Performance Metrics:', metrics);

        if (Object.keys(improvements).length > 0) {
          logger.info('Performance Improvement Suggestions:', improvements);
        }
      } catch (error) {
        logger.error('Performance logging error:', error);
      }
    }, 300000);
  }

  /**
   * Execute a command with error handling
   */
  async executeCommand(command: AgentCommand): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      const handler = this.commands.get(command.type);

      if (!handler) {
        return {
          success: false,
          error: `Unknown command: ${command.type}`,
          commandId: command.id,
        };
      }

      const result = await handler.execute(command);

      // Track command execution time
      const duration = Date.now() - startTime;
      logger.debug(`Command ${command.type} executed in ${duration}ms`);

      return result;
    } catch (error: any) {
      logger.error(`Command execution failed: ${command.type}`, error);
      return {
        success: false,
        error: error.message,
        commandId: command.id,
      };
    }
  }

  /**
   * Register a command handler
   */
  registerCommand(type: string, handler: any): void {
    this.commands.set(type, handler);
    logger.debug(`Registered command: ${type}`);
  }

  /**
   * Get session information
   */
  async getSessionInfo() {
    if (!this.sessionManager) {
      throw new Error('Session not started');
    }
    return await this.sessionManager.getSessionInfo();
  }

  /**
   * Get system health status
   */
  getSystemHealth() {
    return {
      browser: this.browserManager.getHealthStatus(),
      performance: this.browserManager.getPerformanceMetrics(),
      improvements: this.browserManager.getImprovementSuggestions(),
    };
  }

  /**
   * Stop the agent and cleanup
   */
  async stop(): Promise<void> {
    logger.info('Stopping Browser Agent...');

    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Stop performance logging
    if (this.performanceLogInterval) {
      clearInterval(this.performanceLogInterval);
      this.performanceLogInterval = null;
    }

    // End session
    if (this.sessionManager) {
      await this.sessionManager.endSession();
    }

    // Log final performance metrics
    const metrics = this.browserManager.getPerformanceMetrics();
    logger.info('Final Performance Metrics:', metrics);

    logger.info('Browser Agent stopped');
  }

  /**
   * Check if agent is running
   */
  isRunning(): boolean {
    return this.browserManager.isRunning();
  }
}
