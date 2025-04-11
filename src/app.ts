import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './routes';
import { swaggerSpec } from './utils/swagger';
import { errorHandler } from './middlewares/error.middleware';
import { customResponseMiddleware } from './middlewares/response.middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Custom response middleware to ensure error status messages match OpenAPI spec
app.use(customResponseMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests
});
app.use(limiter);

// API routes
app.use('/api/v1', routes);
app.use('/nele-bank/api/v1', routes);

// Root route handler for /nele-bank
app.get('/nele-bank', (req, res) => {
  res.redirect('/nele-bank/docs');
});

// Root route handler
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: `${config.bank.name} - API Documentation`,
  swaggerOptions: {
    url: '/docs/swagger.json'
  }
}));

// Also serve Swagger UI at /nele-bank/docs
app.use('/nele-bank/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: `${config.bank.name} - API Documentation`,
  swaggerOptions: {
    url: '/nele-bank/docs/swagger.json'
  }
}));

// Serve Swagger spec as JSON with custom modifications
app.get('/docs/swagger.json', (req, res) => {
  // Create a deep copy of the swagger spec
  const customSpec = JSON.parse(JSON.stringify(swaggerSpec));
  
  // Log all paths to see what's available
  console.log('Available paths in Swagger spec:', Object.keys(customSpec.paths || {}));
  
  // Try all possible session path formats
  const possiblePaths = ['/sessions', 'sessions', '/api/v1/sessions', '/nele-bank/api/v1/sessions'];
  
  // Check each possible path
  for (const path of possiblePaths) {
    if (customSpec.paths && customSpec.paths[path] && customSpec.paths[path].post) {
      console.log(`Found sessions endpoint at path: ${path}`);
      const postSessions = customSpec.paths[path].post;
      
      // Update the 400 error description
      if (postSessions.responses && postSessions.responses['400']) {
        console.log(`Updating 400 description for ${path}`);
        postSessions.responses['400'].description = 'Bad Request';
      }
      
      // Update the 401 error description
      if (postSessions.responses && postSessions.responses['401']) {
        console.log(`Updating 401 description for ${path}`);
        postSessions.responses['401'].description = 'Unauthorized';
      }
    }
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.send(customSpec);
});

// Also serve Swagger spec at /nele-bank path with custom modifications
app.get('/nele-bank/docs/swagger.json', (req, res) => {
  // Create a deep copy of the swagger spec
  const customSpec = JSON.parse(JSON.stringify(swaggerSpec));
  
  // Log all paths to see what's available
  console.log('Available paths in Swagger spec (nele-bank):', Object.keys(customSpec.paths || {}));
  
  // Try all possible session path formats
  const possiblePaths = ['/sessions', 'sessions', '/api/v1/sessions', '/nele-bank/api/v1/sessions'];
  
  // Check each possible path
  for (const path of possiblePaths) {
    if (customSpec.paths && customSpec.paths[path] && customSpec.paths[path].post) {
      console.log(`Found sessions endpoint at path (nele-bank): ${path}`);
      const postSessions = customSpec.paths[path].post;
      
      // Update the 400 error description
      if (postSessions.responses && postSessions.responses['400']) {
        console.log(`Updating 400 description for ${path} (nele-bank)`);
        postSessions.responses['400'].description = 'Bad Request';
      }
      
      // Update the 401 error description
      if (postSessions.responses && postSessions.responses['401']) {
        console.log(`Updating 401 description for ${path} (nele-bank)`);
        postSessions.responses['401'].description = 'Unauthorized';
      }
    }
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.send(customSpec);
});

// Error handling
app.use(errorHandler);

export default app;
