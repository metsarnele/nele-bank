import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';
import { schemas } from './swagger.schemas';
import path from 'path';

const options: swaggerJsdoc.Options = {
  swaggerDefinition: {
    tags: [
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Sessions', description: 'Session management endpoints' },
      { name: 'Transactions', description: 'Transaction management endpoints' },
      { name: 'Accounts', description: 'Account management endpoints' }
    ],
    openapi: '3.0.0',
    info: {
      title: config.bank.name,
      version: '1.0.0',
      description: 'Banking API that enables secure internal and inter-bank transactions',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: `${config.env === 'production' ? 'Production' : 'Development'} server`
      }
    ],
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [path.resolve(__dirname, '../routes/*.routes.ts')] // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
