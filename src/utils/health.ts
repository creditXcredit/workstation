/**
 * Health monitoring and self-healing utilities for the browser agent
 */

import { logger } from './logger';

export interface HealthStatus {
  healthy: boolean;
  issues: string[];
  lastCheck: Date;
  recoveryAttempts: number;
}

export interface RecoveryStrategy {
  name: string;
  execute: () => Promise<boolean>;
  maxRetries: number;
}

export class HealthMonitor {
  private healthStatus: HealthStatus = {
    healthy: true,
    issues: [],
    lastCheck: new Date(),
    recoveryAttempts: 0,
  };

  private recoveryStrategies: RecoveryStrategy[] = [];
  private maxRecoveryAttempts = 3;

  /**
   * Register a recovery strategy
   */
  registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    logger.debug(`Registered recovery strategy: ${strategy.name}`);
  }

  /**
   * Check health status
   */
  async checkHealth(healthChecks: Array<() => Promise<boolean>>): Promise<HealthStatus> {
    this.healthStatus.lastCheck = new Date();
    this.healthStatus.issues = [];

    for (const check of healthChecks) {
      try {
        const result = await check();
        if (!result) {
          this.healthStatus.healthy = false;
          this.healthStatus.issues.push('Health check failed');
        }
      } catch (error: any) {
        this.healthStatus.healthy = false;
        this.healthStatus.issues.push(`Health check error: ${error.message}`);
      }
    }

    if (!this.healthStatus.healthy) {
      logger.warn('Health issues detected', {
        issues: this.healthStatus.issues,
        recoveryAttempts: this.healthStatus.recoveryAttempts,
      });
    }

    return this.healthStatus;
  }

  /**
   * Attempt self-healing using registered strategies
   */
  async attemptSelfHealing(): Promise<boolean> {
    if (this.healthStatus.recoveryAttempts >= this.maxRecoveryAttempts) {
      logger.error('Max recovery attempts reached, manual intervention required');
      return false;
    }

    this.healthStatus.recoveryAttempts++;
    logger.info(`Attempting self-healing (attempt ${this.healthStatus.recoveryAttempts})`);

    for (const strategy of this.recoveryStrategies) {
      try {
        logger.info(`Executing recovery strategy: ${strategy.name}`);
        const success = await strategy.execute();

        if (success) {
          logger.info(`Recovery successful with strategy: ${strategy.name}`);
          this.healthStatus.healthy = true;
          this.healthStatus.issues = [];
          this.healthStatus.recoveryAttempts = 0;
          return true;
        }
      } catch (error: any) {
        logger.error(`Recovery strategy ${strategy.name} failed:`, error.message);
      }
    }

    logger.error('All recovery strategies failed');
    return false;
  }

  /**
   * Reset health status
   */
  resetHealth(): void {
    this.healthStatus = {
      healthy: true,
      issues: [],
      lastCheck: new Date(),
      recoveryAttempts: 0,
    };
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }
}

export class RetryManager {
  /**
   * Execute a function with exponential backoff retry
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffMultiplier?: number;
      onRetry?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      onRetry,
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (attempt < maxRetries) {
          logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);

          if (onRetry) {
            onRetry(error, attempt + 1);
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /ERR_NETWORK/,
      /ERR_CONNECTION/,
      /Protocol error/,
      /Target closed/,
      /Session closed/,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }
}

/**
 * Performance metrics tracking for micro-improvements
 */
export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();
  private improvements: Map<string, string[]> = new Map();

  /**
   * Track operation duration
   */
  trackOperation(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(name)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
  }

  /**
   * Analyze performance and suggest improvements
   */
  analyzePerformance(name: string): string[] {
    const avg = this.getAverageDuration(name);
    const measurements = this.metrics.get(name) || [];
    const suggestions: string[] = [];

    if (measurements.length < 10) {
      return suggestions;
    }

    // Check for degradation
    const recent = measurements.slice(-10);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;

    if (recentAvg > avg * 1.5) {
      suggestions.push('Performance degradation detected - consider resource cleanup');
    }

    // Check for high variance
    const variance =
      measurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / measurements.length;
    if (variance > avg * avg) {
      suggestions.push('High variance detected - inconsistent performance');
    }

    // Store improvements
    if (suggestions.length > 0) {
      this.improvements.set(name, suggestions);
    }

    return suggestions;
  }

  /**
   * Get all tracked metrics
   */
  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    for (const [name, measurements] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageDuration(name),
        count: measurements.length,
      };
    }

    return result;
  }

  /**
   * Get improvement suggestions
   */
  getImprovements(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [name, suggestions] of this.improvements.entries()) {
      result[name] = [...suggestions];
    }
    return result;
  }
}
