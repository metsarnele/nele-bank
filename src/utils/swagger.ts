import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config';
import { schemas } from './swagger.schemas';
import path from 'path';
import fs from 'fs';

// Determine if we're running from compiled JS or TS source
const isCompiled = __filename.endsWith('.js');
const srcDir = isCompiled ? path.resolve(__dirname, '..') : path.resolve(__dirname, '..');

// Find all route files in the routes directory
const routeFiles = [];
const routesDir = path.join(srcDir, 'routes');

if (fs.existsSync(routesDir)) {
  const files = fs.readdirSync(routesDir);
  for (const file of files) {
    if (file.endsWith('.routes.ts') || file.endsWith('.routes.js')) {
      routeFiles.push(path.join(routesDir, file));
    }
  }
}

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
      },
      {
        url: '/',
        description: 'Root server (no /api/v1 prefix)'
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
  apis: routeFiles // Use the dynamically found route files
};

console.log('Swagger API files:', routeFiles);
export const swaggerSpec = swaggerJsdoc(options);
