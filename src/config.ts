import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DB_PATH: z.string().default('./nele_bank.sqlite'),
  JWT_SECRET: z.string().default('your-secret-key'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  dbPath: env.DB_PATH,
  jwtSecret: env.JWT_SECRET,
  jwt: {
    algorithm: process.env.JWT_ALGORITHM || 'RS256',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  bank: {
    name: process.env.BANK_NAME || 'Nele Bank',
    id: 'NELE001',
    prefix: process.env.BANK_PREFIX || 'NELE',
    publicKeyPath: process.env.BANK_PUBLIC_KEY_PATH || './keys/public_key.pem',
    privateKeyPath: process.env.BANK_PRIVATE_KEY_PATH || './keys/private_key.pem',
    transactionEndpoint: process.env.BANK_TRANSACTION_ENDPOINT || 'http://localhost:3000/api/v1/transactions/b2b'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  centralBank: {
    url: process.env.CENTRAL_BANK_URL || 'https://henno.cfd/central-bank',
    registerUrl: process.env.CENTRAL_BANK_REGISTER_URL || 'https://henno.cfd/central-bank/api/v1/banks/register',
    verifyUrl: process.env.CENTRAL_BANK_VERIFY_URL || 'https://henno.cfd/central-bank/api/v1/banks/verify',
    publicKeyUrl: process.env.CENTRAL_BANK_PUBLIC_KEY_URL || 'https://henno.cfd/central-bank/.well-known/jwks.json',
    apiKey: process.env.BANK_API_KEY || 'test-api-key'
  }
} as const;
