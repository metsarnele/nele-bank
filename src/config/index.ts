import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Debug: Check if environment variables are loaded
console.log('Environment Variables:', {
  DB_PATH: process.env.DB_PATH
});

interface DBConfig {
  path: string;
}

interface Config {
  env: string;
  port: number;
  app: {
    baseUrl: string;
  };
  bank: {
    name: string;
    prefix: string;
    apiKey: string;
    privateKeyPath: string;
    publicKeyPath: string;
    transactionEndpoint: string;
    jwksEndpoint: string;
  };
  jwt: {
    secret: string;
    algorithm: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  centralBank: {
    url: string;
    publicKeyUrl: string;
    registerUrl: string;
    verifyUrl: string;
  };
  database: DBConfig & {
    test: DBConfig;
  };
  logging: {
    level: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  exchange: {
    apiUrl: string;
    apiKey: string;
  };
  testing: {
    mockCentralBank: boolean;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3001',
  },
  bank: {
    name: process.env.BANK_NAME || 'Nele Bank',
    prefix: process.env.BANK_PREFIX || 'NELE',
    apiKey: process.env.BANK_API_KEY || '',
    privateKeyPath: process.env.BANK_PRIVATE_KEY_PATH || path.join(__dirname, '../../keys/private_key.pem'),
    publicKeyPath: process.env.BANK_PUBLIC_KEY_PATH || path.join(__dirname, '../../keys/public_key.pem'),
    transactionEndpoint: process.env.BANK_TRANSACTION_ENDPOINT || 'http://localhost:3001/transactions/b2b',
    jwksEndpoint: process.env.BANK_JWKS_ENDPOINT || 'http://localhost:3001/.well-known/jwks.json',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-for-jwt',
    algorithm: process.env.JWT_ALGORITHM || 'RS256',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  centralBank: {
    url: process.env.CENTRAL_BANK_URL || 'http://localhost:8001',
    publicKeyUrl: process.env.CENTRAL_BANK_PUBLIC_KEY_URL || 'http://localhost:8001/.well-known/jwks.json',
    registerUrl: process.env.CENTRAL_BANK_REGISTER_URL || 'http://localhost:8001/banks/register',
    verifyUrl: process.env.CENTRAL_BANK_VERIFY_URL || 'http://localhost:8001/banks/verify',
  },
  database: {
    path: process.env.DB_PATH || './nele_bank.sqlite',
    test: {
      path: process.env.TEST_DB_PATH || './nele_bank_test.sqlite'
    }
  } as const,
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  exchange: {
    apiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
    apiKey: process.env.EXCHANGE_RATE_API_KEY || '',
  },
  testing: {
    mockCentralBank: process.env.TEST_MODE === 'true',
  },
};
