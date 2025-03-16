import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

// Import route handlers
import userRoutes from './user.routes';
import sessionRoutes from './session.routes';
import transactionRoutes from './transaction.routes';
import accountRoutes from './account.routes';

const router = Router();

// Define routes
router.use('/users', userRoutes);
router.use('/sessions', sessionRoutes);
router.use('/transactions', authenticate, transactionRoutes);
router.use('/accounts', authenticate, accountRoutes);

// Log registered routes
console.log('Registered routes:', router.stack.map(r => r.route?.path || r.regexp).join(', '));

export default router;
