import jwt, { SignOptions, JwtPayload as JwtLibPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import type ms from 'ms';

// Type alias for cleaner code
type StringValue = ms.StringValue;

// Extend Express Request to include user payload
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRATION = (process.env.JWT_EXPIRATION || '24h') as StringValue;

/**
 * Validate JWT configuration (should be called after logging is set up)
 * Call this during application startup to ensure JWT_SECRET is set in production.
 */
export function validateJwtConfig(): void {
  if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'default-secret-change-in-production') {
    console.error('FATAL ERROR: JWT_SECRET not set in production environment! The application will now exit.');
    process.exit(1);
  }
}

// Validate JWT_EXPIRATION format - accepts formats like: 100ms, 1.5h, 2d, 1 hour, 2 days
const VALID_EXPIRATION_PATTERN = /^\d+(\.\d+)?\s*[a-z]+$/i;
if (!VALID_EXPIRATION_PATTERN.test(JWT_EXPIRATION)) {
  console.warn(`WARNING: JWT_EXPIRATION "${JWT_EXPIRATION}" may not be valid. Use format like: 1h, 24h, 7d, 30d`);
}

export interface JWTPayload extends JwtLibPayload {
  userId: string;
  role?: string;
  [key: string]: string | number | boolean | undefined;
}

// Extend Express Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Generate a JWT token with configurable expiration
 * @param payload - Data to encode in the token
 * @param expiresIn - Optional expiration time (e.g., '1h', '24h', '7d'). Defaults to JWT_EXPIRATION env var.
 * @returns Signed JWT token
 */
export function generateToken(payload: JWTPayload, expiresIn?: SignOptions['expiresIn']): string {
  const options: SignOptions = {
    expiresIn: expiresIn || JWT_EXPIRATION,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Log error details for debugging (without exposing sensitive info)
    if (error instanceof Error) {
      console.warn(`JWT verification failed: ${error.message}`);
    }
    return null;
  }
}

/**
 * Express middleware to authenticate requests using JWT
 * Verifies the JWT token from Authorization header and attaches user payload to request
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Use route pattern instead of actual path to avoid logging sensitive query params
    const routePath = req.route?.path || req.path;
    console.warn(`Authentication failed: No token provided for ${req.method} ${routePath}`);
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    // Use route pattern instead of actual path to avoid logging sensitive query params
    const routePath = req.route?.path || req.path;
    console.warn(`Authentication failed: Invalid token for ${req.method} ${routePath}`);
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach payload to request object for use in routes
  req.user = payload;
  (req as AuthenticatedRequest).user = payload;
  next();
}

/**
 * Generate a token for testing/demo purposes
 * @param userId - User identifier
 * @param role - Optional user role
 * @returns JWT token
 */
export function generateDemoToken(userId: string = 'demo-user', role: string = 'user'): string {
  return generateToken({ userId, role });
}
