import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { generateToken, generateDemoToken, authenticateToken, AuthenticatedRequest, validateJwtConfig } from './auth/jwt';
import { generateToken, generateDemoToken, authenticateToken, AuthenticatedRequest } from './auth/jwt';
import { validateRequest, schemas } from './middleware/validation';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { getHealthStatus } from './utils/health';

// Load environment variables
dotenv.config();

// Validate JWT configuration early
validateJwtConfig();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(helmet()); // Security headers
app.use(express.json());
app.use(limiter); // Apply rate limiting to all routes

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  next();
});

// Health check endpoint with enhanced metrics
app.get('/health', (req: Request, res: Response) => {
  const health = getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Generate token endpoint (for testing) - with stricter rate limiting and validation
app.post('/auth/token', authLimiter, validateRequest(schemas.generateToken), (req: Request, res: Response) => {
  const { userId, role } = req.body;

  const token = generateToken({ userId, role });
  
  logger.info('Token generated', { userId, role });
  
  res.json({ token });
});

// Demo token endpoint - with stricter rate limiting
app.get('/auth/demo-token', authLimiter, (req: Request, res: Response) => {
  const token = generateDemoToken();
  res.json({ 
    token,
    message: 'Use this token for testing. Add it to Authorization header as: Bearer <token>'
  });
});

// Protected route example
app.get('/api/protected', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
app.get('/api/protected', authenticateToken, (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({ 
    message: 'Access granted to protected resource',
    user: authenticatedReq.user 
  });
});

// Protected agent status endpoint
app.get('/api/agent/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: 'running',
    user: req.user,
app.get('/api/agent/status', authenticateToken, (req: Request, res: Response) => {
  const authenticatedReq = req as AuthenticatedRequest;
  res.json({
    status: 'running',
    user: authenticatedReq.user,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Demo token: http://localhost:${PORT}/auth/demo-token`);
});

export default app;
