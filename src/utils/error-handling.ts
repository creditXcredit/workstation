/**
 * Enhanced Error Handling for stackBrowserAgent
 * Provides graceful degradation, error categorization, and predictive detection
 */

import { logger } from './logger';
import { EventEmitter } from 'events';

// ========================
// TYPES
// ========================

export enum ErrorCategory {
  RECOVERABLE = 'recoverable',
  DEGRADED = 'degraded',
  FATAL = 'fatal',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface EnhancedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context: any;
  timestamp: Date;
  recoveryAttempts: number;
  recovered: boolean;
  relatedErrors: string[];
}

export interface ErrorPattern {
  pattern: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy?: string;
}

export interface RollbackPoint {
  id: string;
  timestamp: Date;
  state: any;
  description: string;
}

// ========================
// ERROR CLASSIFIER
// ========================

export class ErrorClassifier {
  private patterns: ErrorPattern[] = [
    // Recoverable errors
    {
      pattern: /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/,
      category: ErrorCategory.RECOVERABLE,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: 'retry',
    },
    {
      pattern: /Rate limit exceeded/i,
      category: ErrorCategory.RECOVERABLE,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: 'backoff',
    },
    {
      pattern: /Target closed|Session closed/,
      category: ErrorCategory.RECOVERABLE,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: 'restart',
    },

    // Degraded errors
    {
      pattern: /Extension.*failed/i,
      category: ErrorCategory.DEGRADED,
      severity: ErrorSeverity.MEDIUM,
    },
    {
      pattern: /Performance degradation/i,
      category: ErrorCategory.DEGRADED,
      severity: ErrorSeverity.LOW,
    },

    // Fatal errors
    {
      pattern: /Out of memory|Cannot allocate memory/i,
      category: ErrorCategory.FATAL,
      severity: ErrorSeverity.CRITICAL,
    },
    {
      pattern: /Authentication failed|Access denied/i,
      category: ErrorCategory.FATAL,
      severity: ErrorSeverity.CRITICAL,
    },
  ];

  /**
   * Classify error
   */
  classify(error: Error): { category: ErrorCategory; severity: ErrorSeverity } {
    const message = error.message;

    for (const pattern of this.patterns) {
      if (pattern.pattern.test(message)) {
        return {
          category: pattern.category,
          severity: pattern.severity,
        };
      }
    }

    // Default classification
    return {
      category: ErrorCategory.RECOVERABLE,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  /**
   * Register custom pattern
   */
  registerPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
  }
}

// ========================
// ERROR CORRELATION ENGINE
// ========================

export class ErrorCorrelationEngine {
  private errors: EnhancedError[] = [];
  private maxHistory = 1000;

  /**
   * Add error to history
   */
  addError(error: EnhancedError): void {
    this.errors.push(error);

    // Maintain size limit
    if (this.errors.length > this.maxHistory) {
      this.errors.shift();
    }

    // Find correlations
    this.correlateErrors(error);
  }

  /**
   * Find correlated errors
   */
  private correlateErrors(error: EnhancedError): void {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const now = error.timestamp.getTime();

    const related = this.errors.filter((e) => {
      if (e.id === error.id) return false;
      const timeDiff = now - e.timestamp.getTime();
      return timeDiff >= 0 && timeDiff <= timeWindow;
    });

    if (related.length > 0) {
      error.relatedErrors = related.map((e) => e.id);
      logger.info(`Error correlation found: ${error.id} related to ${related.length} errors`);
    }
  }

  /**
   * Analyze root cause
   */
  analyzeRootCause(errorId: string): {
    rootCause?: EnhancedError;
    chain: EnhancedError[];
  } {
    const error = this.errors.find((e) => e.id === errorId);
    if (!error) {
      return { chain: [] };
    }

    // Build error chain
    const chain: EnhancedError[] = [error];
    let current = error;

    while (current.relatedErrors.length > 0) {
      const related = this.errors.find((e) => e.id === current.relatedErrors[0]);
      if (!related || chain.includes(related)) break;

      chain.unshift(related);
      current = related;
    }

    return {
      rootCause: chain[0],
      chain,
    };
  }

  /**
   * Detect error patterns
   */
  detectPatterns(): Array<{ pattern: string; count: number; severity: ErrorSeverity }> {
    const patterns = new Map<string, { count: number; severity: ErrorSeverity }>();

    for (const error of this.errors) {
      // Extract pattern (first 50 chars of message)
      const pattern = error.message.substring(0, 50);

      if (patterns.has(pattern)) {
        const existing = patterns.get(pattern)!;
        existing.count++;
      } else {
        patterns.set(pattern, { count: 1, severity: error.severity });
      }
    }

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count);
  }
}

// ========================
// PREDICTIVE ERROR DETECTION
// ========================

export class PredictiveErrorDetector extends EventEmitter {
  private metrics: Map<string, number[]> = new Map();
  private thresholds: Map<string, { warning: number; critical: number }> = new Map();

  /**
   * Track metric
   */
  trackMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep last 100 values
    if (values.length > 100) {
      values.shift();
    }

    // Check for anomalies
    this.checkAnomalies(name, value);
  }

  /**
   * Set threshold for metric
   */
  setThreshold(name: string, warning: number, critical: number): void {
    this.thresholds.set(name, { warning, critical });
  }

  /**
   * Check for anomalies
   */
  private checkAnomalies(name: string, value: number): void {
    const threshold = this.thresholds.get(name);
    if (!threshold) return;

    if (value >= threshold.critical) {
      this.emit('anomaly:critical', { metric: name, value, threshold: threshold.critical });
      logger.error(`Critical anomaly detected: ${name} = ${value}`);
    } else if (value >= threshold.warning) {
      this.emit('anomaly:warning', { metric: name, value, threshold: threshold.warning });
      logger.warn(`Warning anomaly detected: ${name} = ${value}`);
    }
  }

  /**
   * Predict potential errors
   */
  predictErrors(): Array<{ metric: string; prediction: string; confidence: number }> {
    const predictions: Array<{ metric: string; prediction: string; confidence: number }> = [];

    for (const [name, values] of this.metrics.entries()) {
      if (values.length < 10) continue;

      // Simple trend analysis
      const recent = values.slice(-10);
      const older = values.slice(-20, -10);

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      const trend = (recentAvg - olderAvg) / olderAvg;

      if (trend > 0.5) {
        // Increasing trend
        predictions.push({
          metric: name,
          prediction: 'Potential resource exhaustion',
          confidence: Math.min(trend * 100, 95),
        });
      }
    }

    return predictions;
  }
}

// ========================
// ROLLBACK MANAGER
// ========================

export class RollbackManager {
  private checkpoints: RollbackPoint[] = [];
  private maxCheckpoints = 10;

  /**
   * Create rollback checkpoint
   */
  createCheckpoint(description: string, state: any): string {
    const checkpoint: RollbackPoint = {
      id: `checkpoint_${Date.now()}`,
      timestamp: new Date(),
      state: JSON.parse(JSON.stringify(state)), // Deep copy
      description,
    };

    this.checkpoints.push(checkpoint);

    // Maintain size limit
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints.shift();
    }

    logger.info(`Checkpoint created: ${description}`);
    return checkpoint.id;
  }

  /**
   * Rollback to checkpoint
   */
  rollback(checkpointId: string): any | null {
    const checkpoint = this.checkpoints.find((c) => c.id === checkpointId);
    if (!checkpoint) {
      logger.error(`Checkpoint not found: ${checkpointId}`);
      return null;
    }

    logger.info(`Rolling back to: ${checkpoint.description}`);
    return JSON.parse(JSON.stringify(checkpoint.state)); // Deep copy
  }

  /**
   * Get latest checkpoint
   */
  getLatest(): RollbackPoint | null {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }

  /**
   * List checkpoints
   */
  listCheckpoints(): RollbackPoint[] {
    return [...this.checkpoints];
  }
}

// ========================
// GRACEFUL DEGRADATION MANAGER
// ========================

export class DegradationManager {
  private degradedFeatures: Set<string> = new Set();
  private fallbackHandlers: Map<string, () => Promise<any>> = new Map();

  /**
   * Register fallback handler
   */
  registerFallback(feature: string, handler: () => Promise<any>): void {
    this.fallbackHandlers.set(feature, handler);
  }

  /**
   * Mark feature as degraded
   */
  degradeFeature(feature: string): void {
    this.degradedFeatures.add(feature);
    logger.warn(`Feature degraded: ${feature}`);
  }

  /**
   * Restore feature
   */
  restoreFeature(feature: string): void {
    this.degradedFeatures.delete(feature);
    logger.info(`Feature restored: ${feature}`);
  }

  /**
   * Check if feature is available
   */
  isAvailable(feature: string): boolean {
    return !this.degradedFeatures.has(feature);
  }

  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    feature: string,
    primary: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.isAvailable(feature)) {
      try {
        return await primary();
      } catch (error) {
        logger.error(`Primary execution failed for ${feature}:`, error);
        this.degradeFeature(feature);
      }
    }

    // Use fallback
    const fallbackHandler = fallback || this.fallbackHandlers.get(feature);
    if (fallbackHandler) {
      logger.info(`Using fallback for: ${feature}`);
      return await fallbackHandler();
    }

    throw new Error(`No fallback available for degraded feature: ${feature}`);
  }

  /**
   * Get degradation status
   */
  getStatus() {
    return {
      degradedFeatures: Array.from(this.degradedFeatures),
      availableFeatures: Array.from(this.fallbackHandlers.keys()).filter(
        (f) => !this.degradedFeatures.has(f)
      ),
    };
  }
}

// ========================
// ENHANCED ERROR MANAGER (Main Interface)
// ========================

export class EnhancedErrorManager extends EventEmitter {
  public classifier: ErrorClassifier;
  public correlationEngine: ErrorCorrelationEngine;
  public predictor: PredictiveErrorDetector;
  public rollbackManager: RollbackManager;
  public degradationManager: DegradationManager;

  private errorCount = 0;

  constructor() {
    super();
    this.classifier = new ErrorClassifier();
    this.correlationEngine = new ErrorCorrelationEngine();
    this.predictor = new PredictiveErrorDetector();
    this.rollbackManager = new RollbackManager();
    this.degradationManager = new DegradationManager();

    this.setupPredictiveAlerts();
  }

  /**
   * Handle error with enhanced processing
   */
  async handleError(
    error: Error,
    context: any = {}
  ): Promise<{ recovered: boolean; action: string }> {
    this.errorCount++;

    // Classify error
    const { category, severity } = this.classifier.classify(error);

    // Create enhanced error
    const enhancedError: EnhancedError = {
      id: `error_${Date.now()}_${this.errorCount}`,
      category,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      recoveryAttempts: 0,
      recovered: false,
      relatedErrors: [],
    };

    // Add to correlation engine
    this.correlationEngine.addError(enhancedError);

    // Emit event
    this.emit('error', enhancedError);

    // Handle based on category
    switch (category) {
      case ErrorCategory.RECOVERABLE:
        return await this.handleRecoverableError(enhancedError);

      case ErrorCategory.DEGRADED:
        return await this.handleDegradedError(enhancedError);

      case ErrorCategory.FATAL:
        return await this.handleFatalError(enhancedError);
    }
  }

  /**
   * Handle recoverable error
   */
  private async handleRecoverableError(
    error: EnhancedError
  ): Promise<{ recovered: boolean; action: string }> {
    logger.info(`Attempting recovery for: ${error.message}`);

    // Simple recovery - would integrate with existing retry logic
    error.recoveryAttempts++;
    error.recovered = true;

    return { recovered: true, action: 'retry' };
  }

  /**
   * Handle degraded error
   */
  private async handleDegradedError(
    error: EnhancedError
  ): Promise<{ recovered: boolean; action: string }> {
    logger.warn(`Degradation detected: ${error.message}`);

    // Extract feature from context
    const feature = error.context.feature || 'unknown';
    this.degradationManager.degradeFeature(feature);

    return { recovered: true, action: 'degrade' };
  }

  /**
   * Handle fatal error
   */
  private async handleFatalError(
    error: EnhancedError
  ): Promise<{ recovered: boolean; action: string }> {
    logger.error(`Fatal error: ${error.message}`);

    // Attempt rollback
    const checkpoint = this.rollbackManager.getLatest();
    if (checkpoint) {
      logger.info('Attempting rollback to last checkpoint');
      return { recovered: false, action: 'rollback' };
    }

    return { recovered: false, action: 'shutdown' };
  }

  /**
   * Setup predictive alerts
   */
  private setupPredictiveAlerts(): void {
    this.predictor.on('anomaly:critical', (data) => {
      logger.error('Critical anomaly - potential error incoming:', data);
      this.emit('predictive:critical', data);
    });

    this.predictor.on('anomaly:warning', (data) => {
      logger.warn('Warning anomaly detected:', data);
      this.emit('predictive:warning', data);
    });

    // Check predictions periodically
    setInterval(
      () => {
        const predictions = this.predictor.predictErrors();
        if (predictions.length > 0) {
          logger.info('Error predictions:', predictions);
          this.emit('predictions', predictions);
        }
      },
      5 * 60 * 1000
    ); // Every 5 minutes
  }

  /**
   * Get error statistics
   */
  getStatistics() {
    return {
      totalErrors: this.errorCount,
      patterns: this.correlationEngine.detectPatterns(),
      predictions: this.predictor.predictErrors(),
      degradation: this.degradationManager.getStatus(),
      checkpoints: this.rollbackManager.listCheckpoints().length,
    };
  }
}
