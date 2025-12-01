/**
 * Express type augmentation for Passport and JWT
 */

import { JWTPayload } from '../auth/jwt';

declare global {
  namespace Express {
    // Passport User type
    interface User {
      id: string;
      email: string;
      full_name?: string;
      access_level: string;
      github_username?: string;
      avatar_url?: string;
    }
  }
}

// Extend the module to make TypeScript happy
export {};
