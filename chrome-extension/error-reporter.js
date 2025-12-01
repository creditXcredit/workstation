/**
 * Error Reporting System for Chrome Extension
 * Phase 3 - Block 3
 * 
 * Features:
 * - Error capture with Sentry integration
 * - Stack trace collection
 * - User context tracking
 * - Performance monitoring
 * - Custom error metadata
 */

// Note: In production, Sentry should be loaded from CDN in manifest.json
// For now, we'll create a wrapper that can work with or without Sentry

class ErrorReporter {
  constructor() {
    this.sentryInitialized = false;
    this.sentryDSN = null;
    this.errorQueue = [];
    this.maxQueueSize = 100;
    this.userContext = null;
    this.enabled = true;
    this.captureConsoleErrors = false; // Opt-in for console error capture
    this.environment = 'production';
    this.release = chrome.runtime.getManifest().version;
    this.errorStats = {
      totalErrors: 0,
      reportedErrors: 0,
      queuedErrors: 0,
      lastError: null
    };
  }

  /**
   * Initialize error reporter
   */
  async initialize(config = {}) {
    try {
      this.sentryDSN = config.sentryDSN || null;
      this.environment = config.environment || 'production';
      this.enabled = config.enabled !== false;
      this.captureConsoleErrors = config.captureConsoleErrors || false;

      // Load user context
      await this.loadUserContext();

      // Initialize Sentry if DSN provided
      if (this.sentryDSN && typeof Sentry !== 'undefined') {
        const initResult = this.initializeSentry();
        if (!initResult.success) {
          console.warn('[ErrorReporter] Sentry initialization failed, continuing in local mode');
        }
      } else {
        console.log('[ErrorReporter] Running without Sentry integration (local mode)');
      }

      // Setup global error handlers
      this.setupGlobalHandlers();

      // Load error queue
      await this.loadErrorQueue();

      console.log('[ErrorReporter] Initialized successfully');
      console.log(`[ErrorReporter] Environment: ${this.environment}, Release: ${this.release}`);
      
      return { success: true, sentryEnabled: this.sentryInitialized };
    } catch (error) {
      console.error('[ErrorReporter] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize Sentry SDK
   */
  initializeSentry() {
    try {
      if (typeof Sentry === 'undefined') {
        console.warn('[ErrorReporter] Sentry SDK not loaded');
        return { success: false, reason: 'SDK not loaded' };
      }

      // Validate DSN format (must be https://...@sentry.io/...)
      if (!this.sentryDSN || !this.isValidDSN(this.sentryDSN)) {
        const errMsg = '[ErrorReporter] Invalid or missing Sentry DSN - error reporting will use local queue only';
        console.error(errMsg);
        return { success: false, reason: 'Invalid DSN' };
      }

      Sentry.init({
        dsn: this.sentryDSN,
        environment: this.environment,
        release: `workstation-extension@${this.release}`,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true
          })
        ],
        tracesSampleRate: 0.1, // 10% of transactions
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0, // 100% when errors occur
        beforeSend: (event, hint) => {
          // Custom processing before sending to Sentry
          return this.beforeSendHook(event, hint);
        }
      });

      // Set user context if available
      if (this.userContext) {
        Sentry.setUser(this.userContext);
      }

      this.sentryInitialized = true;
      console.log('[ErrorReporter] Sentry initialized');
      return { success: true };
    } catch (error) {
      console.error('[ErrorReporter] Sentry initialization failed:', error);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'unhandled',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_rejection',
        promise: event.promise
      });
    });

    // Capture console errors (opt-in)
    if (this.captureConsoleErrors) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        this.captureError(new Error(args.join(' ')), {
          type: 'console_error',
          args: args
        });
        originalConsoleError.apply(console, args);
      };
      console.log('[ErrorReporter] Console error capture enabled');
    }

    console.log('[ErrorReporter] Global error handlers installed');
  }

  /**
   * Capture and report an error
   */
  captureError(error, context = {}) {
    if (!this.enabled) {
      return;
    }

    try {
      this.errorStats.totalErrors++;
      this.errorStats.lastError = {
        message: error?.message || String(error),
        timestamp: Date.now()
      };

      // Build error object
      const errorObject = {
        message: error?.message || String(error),
        stack: error?.stack || this.generateStackTrace(),
        timestamp: Date.now(),
        context: {
          ...context,
          userAgent: navigator.userAgent,
          url: window.location.href,
          extensionVersion: this.release,
          environment: this.environment
        },
        user: this.userContext,
        level: context.level || 'error'
      };

      // Add to queue
      this.addToQueue(errorObject);

      // Report to Sentry if available
      if (this.sentryInitialized) {
        this.reportToSentry(error, context);
        this.errorStats.reportedErrors++;
      } else {
        // Store locally
        this.saveErrorQueue();
      }

      console.error('[ErrorReporter] Error captured:', errorObject);
      return { success: true, errorId: errorObject.timestamp };
    } catch (captureError) {
      console.error('[ErrorReporter] Failed to capture error:', captureError);
      return { success: false, error: captureError.message };
    }
  }

  /**
   * Report error to Sentry
   */
  reportToSentry(error, context = {}) {
    if (!this.sentryInitialized || typeof Sentry === 'undefined') {
      return;
    }

    try {
      // Set context
      if (context) {
        Sentry.setContext('error_context', context);
      }

      // Set tags
      Sentry.setTags({
        error_type: context.type || 'unknown',
        environment: this.environment
      });

      // Capture exception
      const eventId = Sentry.captureException(error);
      
      console.log(`[ErrorReporter] Error reported to Sentry: ${eventId}`);
      return eventId;
    } catch (reportError) {
      console.error('[ErrorReporter] Failed to report to Sentry:', reportError);
    }
  }

  /**
   * Add error to local queue
   */
  addToQueue(errorObject) {
    this.errorQueue.unshift(errorObject);

    // Keep only recent errors
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize);
    }

    this.errorStats.queuedErrors = this.errorQueue.length;
  }

  /**
   * Generate stack trace
   */
  generateStackTrace() {
    try {
      throw new Error('Stack trace');
    } catch (e) {
      return e.stack;
    }
  }

  /**
   * Set user context
   */
  async setUserContext(user) {
    this.userContext = {
      id: user.id || 'anonymous',
      email: user.email || null,
      username: user.username || null,
      ...user
    };

    // Update Sentry if initialized
    if (this.sentryInitialized && typeof Sentry !== 'undefined') {
      Sentry.setUser(this.userContext);
    }

    // Save to storage
    await chrome.storage.local.set({
      errorReporterUserContext: this.userContext
    });

    console.log('[ErrorReporter] User context updated:', this.userContext);
    return { success: true };
  }

  /**
   * Load user context from storage
   */
  async loadUserContext() {
    try {
      const result = await chrome.storage.local.get('errorReporterUserContext');
      if (result.errorReporterUserContext) {
        this.userContext = result.errorReporterUserContext;
        console.log('[ErrorReporter] User context loaded');
      }
    } catch (error) {
      console.error('[ErrorReporter] Failed to load user context:', error);
    }
  }

  /**
   * Add breadcrumb (for debugging trail)
   */
  addBreadcrumb(message, category = 'default', level = 'info', data = {}) {
    const breadcrumb = {
      message,
      category,
      level,
      data,
      timestamp: Date.now()
    };

    if (this.sentryInitialized && typeof Sentry !== 'undefined') {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data
      });
    }

    // Also store locally
    this.addToQueue({
      type: 'breadcrumb',
      ...breadcrumb
    });

    return { success: true };
  }

  /**
   * Capture message (non-error event)
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.enabled) {
      return;
    }

    try {
      const messageObject = {
        message,
        level,
        timestamp: Date.now(),
        context,
        user: this.userContext
      };

      this.addToQueue(messageObject);

      if (this.sentryInitialized && typeof Sentry !== 'undefined') {
        Sentry.captureMessage(message, level);
      }

      console.log(`[ErrorReporter] Message captured: ${message}`);
      return { success: true };
    } catch (error) {
      console.error('[ErrorReporter] Failed to capture message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Before send hook for Sentry
   */
  beforeSendHook(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value || '';
      
      // Don't report certain errors
      const ignoredErrors = [
        'Extension context invalidated',
        'Could not establish connection',
        'ResizeObserver loop limit exceeded'
      ];

      for (const ignored of ignoredErrors) {
        if (errorMessage.includes(ignored)) {
          return null; // Don't send to Sentry
        }
      }
    }

    // Add custom context
    event.contexts = event.contexts || {};
    event.contexts.chrome_extension = {
      version: this.release,
      environment: this.environment,
      timestamp: Date.now()
    };

    return event;
  }

  /**
   * Load error queue from storage
   */
  async loadErrorQueue() {
    try {
      const result = await chrome.storage.local.get('errorQueue');
      if (result.errorQueue) {
        this.errorQueue = result.errorQueue;
        this.errorStats.queuedErrors = this.errorQueue.length;
        console.log(`[ErrorReporter] Loaded ${this.errorQueue.length} queued errors`);
      }
    } catch (error) {
      console.error('[ErrorReporter] Failed to load error queue:', error);
    }
  }

  /**
   * Save error queue to storage
   */
  async saveErrorQueue() {
    try {
      const queueToSave = this.errorQueue.slice(0, this.maxQueueSize);
      await chrome.storage.local.set({
        errorQueue: queueToSave
      });
    } catch (error) {
      console.error('[ErrorReporter] Failed to save error queue:', error);
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      sentryInitialized: this.sentryInitialized,
      environment: this.environment,
      release: this.release,
      totalErrors: this.errorStats.totalErrors,
      reportedErrors: this.errorStats.reportedErrors,
      queuedErrors: this.errorStats.queuedErrors,
      lastError: this.errorStats.lastError,
      userContext: this.userContext ? {
        id: this.userContext.id,
        hasEmail: !!this.userContext.email
      } : null
    };
  }

  /**
   * Validate Sentry DSN format
   */
  isValidDSN(dsn) {
    try {
      // DSN format: https://<key>@<host>/<project>
      const dsnPattern = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\/[0-9]+$/i;
      return dsnPattern.test(dsn);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errorQueue.slice(0, limit);
  }

  /**
   * Clear error queue
   */
  async clearErrors() {
    this.errorQueue = [];
    this.errorStats.queuedErrors = 0;
    await chrome.storage.local.remove('errorQueue');
    console.log('[ErrorReporter] Error queue cleared');
    return { success: true };
  }

  /**
   * Enable/disable error reporting
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[ErrorReporter] Error reporting ${enabled ? 'enabled' : 'disabled'}`);
    return { success: true, enabled: this.enabled };
  }

  /**
   * Test error reporting
   */
  testErrorReporting() {
    try {
      throw new Error('Test error from ErrorReporter');
    } catch (error) {
      this.captureError(error, {
        type: 'test',
        message: 'This is a test error to verify error reporting is working'
      });
      return { success: true, message: 'Test error sent' };
    }
  }
}

// Create singleton instance
const errorReporter = new ErrorReporter();

// Auto-initialize (can be reconfigured later)
errorReporter.initialize({
  enabled: true,
  environment: 'production'
}).catch(console.error);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorReporter, errorReporter };
}
