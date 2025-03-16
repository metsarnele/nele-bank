import { Router } from 'express';
import { JWKSController } from '../controllers/jwks.controller';

const router = Router();
const jwksController = JWKSController.getInstance();

// JWKS endpoint for public key distribution
router.get('/jwks.json', (req, res) => jwksController.getJWKS(req, res));

export default router;
