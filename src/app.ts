import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './routes';
import jwksRoutes from './routes/jwks.routes';
import { JWKSController } from './controllers/jwks.controller';
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

// Serve Swagger spec as JSON
app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Also serve Swagger spec at /nele-bank path
app.get('/nele-bank/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: `${config.bank.name} - API Documentation`,
  explorer: true
}));

// Also serve Swagger UI at /nele-bank/docs
app.use('/nele-bank/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: `${config.bank.name} - API Documentation`,
  explorer: true
}));

// JWKS routes for public key distribution
// These need to be registered at /.well-known path as per standard
app.use('/.well-known', jwksRoutes);
// For the /nele-bank prefix, we need to ensure no double slashes
const jwksController = JWKSController.getInstance();
app.use('/nele-bank/.well-known/jwks.json', (req, res) => jwksController.getJWKS(req, res));
// Also support direct access to the JWKS endpoint
app.get('/jwks.json', (req, res) => jwksController.getJWKS(req, res));

// Error handling
app.use(errorHandler);

export default app;
