/**
 * Security layer for stackBrowserAgent
 * Provides authentication, authorization, input validation, and secure credential management
 */

import * as crypto from 'crypto';
import { logger } from './logger';

// ========================
// INPUT VALIDATION
// ========================

export class InputValidator {
  /**
   * Sanitize string input to prevent injection attacks
   */
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Trim and limit length
    let sanitized = input.trim().substring(0, maxLength);

    // Remove control characters except newline and tab
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  /**
   * Validate URL format and allowed protocols
   */
  static validateUrl(url: string, allowedProtocols: string[] = ['http:', 'https:']): boolean {
    try {
      const parsed = new URL(url);
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate file path to prevent directory traversal
   */
  static validatePath(path: string): boolean {
    // Prevent directory traversal attempts
    if (path.includes('..') || path.includes('~')) {
      return false;
    }

    // Prevent access to system directories
    const dangerousPaths = ['/etc', '/sys', '/proc', '/root', '/var'];
    for (const dangerous of dangerousPaths) {
      if (path.startsWith(dangerous)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate command payload structure
   */
  static validateCommandPayload(payload: any, requiredFields: string[]): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    for (const field of requiredFields) {
      if (!(field in payload)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize object for logging (remove sensitive data)
   */
  static sanitizeForLogging(obj: any): any {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential', 'apiKey'];
    const sanitized = JSON.parse(JSON.stringify(obj));

    const redact = (o: any) => {
      for (const key in o) {
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
          o[key] = '***REDACTED***';
        } else if (typeof o[key] === 'object' && o[key] !== null) {
          redact(o[key]);
        }
      }
    };

    redact(sanitized);
    return sanitized;
  }
}

// ========================
// AUTHENTICATION & AUTHORIZATION
// ========================

export interface AgentIdentity {
  id: string;
  name: string;
  role: 'admin' | 'agent' | 'readonly';
  capabilities: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export class AuthManager {
  private agents: Map<string, AgentIdentity> = new Map();
  private tokens: Map<string, string> = new Map(); // token -> agentId
  private readonly tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Register a new agent
   */
  registerAgent(identity: Omit<AgentIdentity, 'createdAt'>): string {
    const agentId = identity.id || crypto.randomUUID();
    const fullIdentity: AgentIdentity = {
      ...identity,
      id: agentId,
      createdAt: new Date(),
      expiresAt: identity.expiresAt || new Date(Date.now() + this.tokenExpiry),
    };

    this.agents.set(agentId, fullIdentity);

    // Generate token
    const token = this.generateToken();
    this.tokens.set(token, agentId);

    logger.info(`Agent registered: ${identity.name} (${agentId})`);

    return token;
  }

  /**
   * Authenticate agent by token
   */
  authenticate(token: string): AgentIdentity | null {
    const agentId = this.tokens.get(token);
    if (!agentId) {
      logger.warn('Authentication failed: invalid token');
      return null;
    }

    const agent = this.agents.get(agentId);
    if (!agent) {
      logger.warn(`Authentication failed: agent not found (${agentId})`);
      return null;
    }

    // Check expiration
    if (agent.expiresAt && agent.expiresAt < new Date()) {
      logger.warn(`Authentication failed: token expired for ${agent.name}`);
      this.revokeToken(token);
      return null;
    }

    return agent;
  }

  /**
   * Authorize agent for specific action
   */
  authorize(token: string, requiredCapability: string): boolean {
    const agent = this.authenticate(token);
    if (!agent) {
      return false;
    }

    // Admin has all capabilities
    if (agent.role === 'admin') {
      return true;
    }

    // Check specific capability
    if (!agent.capabilities.includes(requiredCapability)) {
      logger.warn(`Authorization failed: ${agent.name} lacks capability '${requiredCapability}'`);
      return false;
    }

    return true;
  }

  /**
   * Revoke agent token
   */
  revokeToken(token: string): void {
    const agentId = this.tokens.get(token);
    if (agentId) {
      const agent = this.agents.get(agentId);
      logger.info(`Token revoked for agent: ${agent?.name || agentId}`);
    }
    this.tokens.delete(token);
  }

  /**
   * Generate secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpired(): void {
    const now = new Date();
    for (const [token, agentId] of this.tokens.entries()) {
      const agent = this.agents.get(agentId);
      if (agent?.expiresAt && agent.expiresAt < now) {
        this.revokeToken(token);
      }
    }
  }
}

// ========================
// SECURE CREDENTIAL MANAGEMENT
// ========================

export interface Credential {
  key: string;
  value: string;
  encrypted: boolean;
  rotatedAt: Date;
  expiresAt?: Date;
}

export class CredentialManager {
  private credentials: Map<string, Credential> = new Map();
  private encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(masterKey?: string) {
    // Use provided key or generate one
    const key = masterKey || process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.encryptionKey = Buffer.from(key.substring(0, 64), 'hex');
  }

  /**
   * Store credential with encryption
   */
  store(key: string, value: string, ttl?: number): void {
    const encrypted = this.encrypt(value);
    const credential: Credential = {
      key,
      value: encrypted,
      encrypted: true,
      rotatedAt: new Date(),
      expiresAt: ttl ? new Date(Date.now() + ttl) : undefined,
    };

    this.credentials.set(key, credential);
    logger.info(`Credential stored: ${key}`);
  }

  /**
   * Retrieve and decrypt credential
   */
  retrieve(key: string): string | null {
    const credential = this.credentials.get(key);
    if (!credential) {
      logger.warn(`Credential not found: ${key}`);
      return null;
    }

    // Check expiration
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      logger.warn(`Credential expired: ${key}`);
      this.credentials.delete(key);
      return null;
    }

    return credential.encrypted ? this.decrypt(credential.value) : credential.value;
  }

  /**
   * Rotate credential (generate new value or update)
   */
  rotate(key: string, newValue?: string): void {
    const existing = this.credentials.get(key);
    if (!existing) {
      logger.warn(`Cannot rotate non-existent credential: ${key}`);
      return;
    }

    const value = newValue || crypto.randomBytes(32).toString('hex');
    this.store(
      key,
      value,
      existing.expiresAt ? existing.expiresAt.getTime() - Date.now() : undefined
    );
    logger.info(`Credential rotated: ${key}`);
  }

  /**
   * Check if credentials need rotation
   */
  checkRotation(): string[] {
    const needsRotation: string[] = [];
    const now = Date.now();

    for (const [key, credential] of this.credentials.entries()) {
      const age = now - credential.rotatedAt.getTime();
      if (age > this.rotationInterval) {
        needsRotation.push(key);
      }
    }

    return needsRotation;
  }

  /**
   * Encrypt value
   */
  private encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt value
   */
  private decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Delete credential
   */
  delete(key: string): void {
    this.credentials.delete(key);
    logger.info(`Credential deleted: ${key}`);
  }
}

// ========================
// RATE LIMITING
// ========================

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, RateLimit> = new Map();

  /**
   * Set rate limit for a key (e.g., agent ID, IP address)
   */
  setLimit(key: string, maxRequests: number, windowMs: number): void {
    this.limits.set(key, { maxRequests, windowMs });
  }

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const limit = this.limits.get(key) || { maxRequests: 100, windowMs: 60000 }; // Default: 100/min
    const now = Date.now();

    // Get or initialize request log
    let requestLog = this.requests.get(key) || [];

    // Remove old requests outside the window
    requestLog = requestLog.filter((timestamp) => now - timestamp < limit.windowMs);

    // Check if limit exceeded
    if (requestLog.length >= limit.maxRequests) {
      logger.warn(`Rate limit exceeded for: ${key}`);
      return false;
    }

    // Add current request
    requestLog.push(now);
    this.requests.set(key, requestLog);

    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const limit = this.limits.get(key) || { maxRequests: 100, windowMs: 60000 };
    const requestLog = this.requests.get(key) || [];
    const now = Date.now();

    const recentRequests = requestLog.filter((timestamp) => now - timestamp < limit.windowMs);
    return Math.max(0, limit.maxRequests - recentRequests.length);
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

// ========================
// SECURITY AUDIT LOG
// ========================

export interface AuditEntry {
  timestamp: Date;
  agentId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'denied';
  details?: any;
  hash?: string;
}

export class AuditLogger {
  private entries: AuditEntry[] = [];
  private maxEntries = 10000;

  /**
   * Log security event
   */
  log(entry: Omit<AuditEntry, 'timestamp' | 'hash'>): void {
    const auditEntry: AuditEntry = {
      ...entry,
      timestamp: new Date(),
      details: InputValidator.sanitizeForLogging(entry.details),
    };

    // Add tamper-detection hash
    auditEntry.hash = this.computeHash(auditEntry);

    this.entries.push(auditEntry);

    // Maintain size limit
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    logger.info(`Audit: ${entry.agentId} ${entry.action} ${entry.resource} -> ${entry.result}`);
  }

  /**
   * Compute hash for tamper detection
   */
  private computeHash(entry: Omit<AuditEntry, 'hash'>): string {
    const data = JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      agentId: entry.agentId,
      action: entry.action,
      resource: entry.resource,
      result: entry.result,
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify audit log integrity
   */
  verifyIntegrity(): boolean {
    for (const entry of this.entries) {
      const expectedHash = this.computeHash(entry);
      if (entry.hash !== expectedHash) {
        logger.error('Audit log tampered detected!', {
          entry: entry.timestamp,
          agentId: entry.agentId,
        });
        return false;
      }
    }
    return true;
  }

  /**
   * Get audit entries for agent
   */
  getEntriesForAgent(agentId: string, limit: number = 100): AuditEntry[] {
    return this.entries.filter((e) => e.agentId === agentId).slice(-limit);
  }

  /**
   * Get recent failed attempts
   */
  getFailedAttempts(limit: number = 100): AuditEntry[] {
    return this.entries
      .filter((e) => e.result === 'failure' || e.result === 'denied')
      .slice(-limit);
  }
}

// ========================
// SECURITY MANAGER (Main Interface)
// ========================

export class SecurityManager {
  public auth: AuthManager;
  public credentials: CredentialManager;
  public rateLimiter: RateLimiter;
  public auditLogger: AuditLogger;

  constructor(encryptionKey?: string) {
    this.auth = new AuthManager();
    this.credentials = new CredentialManager(encryptionKey);
    this.rateLimiter = new RateLimiter();
    this.auditLogger = new AuditLogger();

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Validate and authorize request
   */
  validateRequest(
    token: string,
    action: string,
    resource: string,
    payload?: any
  ): { valid: boolean; agent?: AgentIdentity; error?: string } {
    // Authenticate
    const agent = this.auth.authenticate(token);
    if (!agent) {
      this.auditLogger.log({
        agentId: 'unknown',
        action,
        resource,
        result: 'denied',
        details: { reason: 'authentication_failed' },
      });
      return { valid: false, error: 'Authentication failed' };
    }

    // Check rate limit
    if (!this.rateLimiter.isAllowed(agent.id)) {
      this.auditLogger.log({
        agentId: agent.id,
        action,
        resource,
        result: 'denied',
        details: { reason: 'rate_limit_exceeded' },
      });
      return { valid: false, error: 'Rate limit exceeded', agent };
    }

    // Authorize
    if (!this.auth.authorize(token, action)) {
      this.auditLogger.log({
        agentId: agent.id,
        action,
        resource,
        result: 'denied',
        details: { reason: 'insufficient_permissions' },
      });
      return { valid: false, error: 'Insufficient permissions', agent };
    }

    // Validate payload if provided
    if (payload) {
      try {
        // Sanitize strings in payload
        const sanitized = this.sanitizePayload(payload);
        payload = sanitized;
      } catch (error: any) {
        this.auditLogger.log({
          agentId: agent.id,
          action,
          resource,
          result: 'failure',
          details: { reason: 'invalid_payload', error: error.message },
        });
        return { valid: false, error: 'Invalid payload', agent };
      }
    }

    // Log success
    this.auditLogger.log({
      agentId: agent.id,
      action,
      resource,
      result: 'success',
      details: { payload: InputValidator.sanitizeForLogging(payload) },
    });

    return { valid: true, agent };
  }

  /**
   * Sanitize payload recursively
   */
  private sanitizePayload(payload: any): any {
    if (typeof payload === 'string') {
      return InputValidator.sanitizeString(payload);
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.sanitizePayload(item));
    }

    if (typeof payload === 'object' && payload !== null) {
      const sanitized: any = {};
      for (const key in payload) {
        sanitized[key] = this.sanitizePayload(payload[key]);
      }
      return sanitized;
    }

    return payload;
  }

  /**
   * Start periodic security maintenance
   */
  private startPeriodicCleanup(): void {
    // Clean up expired tokens every hour
    setInterval(
      () => {
        this.auth.cleanupExpired();
      },
      60 * 60 * 1000
    );

    // Check credential rotation daily
    setInterval(
      () => {
        const needsRotation = this.credentials.checkRotation();
        if (needsRotation.length > 0) {
          logger.warn('Credentials need rotation:', needsRotation);
        }
      },
      24 * 60 * 60 * 1000
    );

    // Verify audit log integrity hourly
    setInterval(
      () => {
        if (!this.auditLogger.verifyIntegrity()) {
          logger.error('SECURITY ALERT: Audit log integrity compromised!');
        }
      },
      60 * 60 * 1000
    );
  }
}
