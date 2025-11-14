import { config } from 'dotenv';
import { BrowserAgent } from './agent';
import { AgentConfig } from './types';

// Load environment variables
config();

// Default configuration
const agentConfig: AgentConfig = {
  browser: {
    headless: process.env.HEADLESS === 'true',
    devtools: process.env.DEVTOOLS === 'true',
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || '1920', 10),
      height: parseInt(process.env.VIEWPORT_HEIGHT || '1080', 10),
    },
    extensionsPath: process.env.EXTENSIONS_PATH || './extensions',
    userDataDir: process.env.USER_DATA_DIR,
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    file: process.env.LOG_FILE,
  },
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    host: process.env.SERVER_HOST || 'localhost',
  },
};

async function main() {
  const agent = new BrowserAgent(agentConfig);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await agent.stop();
    process.exit(0);
  });

  try {
    // Start the agent
    await agent.start();

    // Keep the process running
    console.log('Browser Agent is running. Press Ctrl+C to stop.');

    // Example: Navigate to a page
    const result = await agent.executeCommand({
      type: 'navigate',
      payload: { url: 'https://example.com' },
      id: 'example-nav-1',
    });

    console.log('Navigation result:', result);

    // Keep alive
    await new Promise(() => {});
  } catch (error) {
    console.error('Fatal error:', error);
    await agent.stop();
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

export { BrowserAgent, AgentConfig };
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { generateToken, generateDemoToken, authenticateToken } from './auth/jwt';

// Load environment variables
dotenv.config();

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
app.use(express.json());
app.use(limiter); // Apply rate limiting to all routes

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate token endpoint (for testing) - with stricter rate limiting
app.post('/auth/token', authLimiter, (req: Request, res: Response) => {
  const { userId, role } = req.body;
  
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const token = generateToken({ userId, role: role || 'user' });
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
app.get('/api/protected', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({ 
    message: 'Access granted to protected resource',
    user 
  });
});

// Protected agent status endpoint
app.get('/api/agent/status', authenticateToken, (req: Request, res: Response) => {
  res.json({
    status: 'running',
    user: (req as any).user,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Demo token: http://localhost:${PORT}/auth/demo-token`);
});

export default app;
