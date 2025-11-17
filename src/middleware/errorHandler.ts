import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error class with status code support
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Prevents sensitive information leakage in production
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Determine status code and error code
  const statusCode = (err as AppError).statusCode || 500;
  const errorCode = (err as AppError).code || 'INTERNAL_ERROR';
  const isOperational = (err as AppError).isOperational === true;

  // Log full error details internally (never send to client)
  logger.error('Unhandled error:', {
    error: err.message,
    code: errorCode,
    statusCode,
    isOperational,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Don't leak internal errors to client
  if (res.headersSent) {
    return next(err);
  }

  // In production, send generic error message for non-operational errors
  // In development, include error message for debugging
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Determine error message to send to client
  // Only show actual error message if:
  // 1. It's an operational error (explicitly marked as safe to show), OR
  // 2. We're in development mode
  const errorMessage = (isOperational || isDevelopment) 
    ? err.message 
    : 'Internal server error';
  
  res.status(statusCode).json({
    error: errorMessage,
    code: errorCode,
    message: isDevelopment ? err.message : undefined,
    timestamp: new Date().toISOString(),
    path: req.path,
    // Never send stack traces to clients
  });
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
}
