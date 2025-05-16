import { Router } from 'express';
import { JWKSController } from '../controllers/jwks.controller';

const router = Router();
const jwksController = JWKSController.getInstance();

// JWKS endpoint for public key distribution
// The route should be just '/' since we're mounting this router at '/.well-known'
router.get('/', (req, res) => jwksController.getJWKS(req, res));
router.get('/jwks.json', (req, res) => jwksController.getJWKS(req, res));

export default router;
