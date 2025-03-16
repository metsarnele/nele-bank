import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './routes';
import { swaggerSpec } from './utils/swagger';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests
});
app.use(limiter);

// API routes
app.use('/api/v1', routes);

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: `${config.bank.name} - API Documentation`,
  swaggerOptions: {
    url: '/docs/swagger.json'
  }
}));

// Serve Swagger spec as JSON
app.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Error handling
app.use(errorHandler);

export default app;
