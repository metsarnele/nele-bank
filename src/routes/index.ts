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
// Don't apply authentication middleware at the router level for transactions
// as some transaction endpoints need to be public
router.use('/transactions', transactionRoutes);
router.use('/accounts', authenticate, accountRoutes);

// Log registered routes
console.log('Registered routes:', router.stack.map(r => r.route?.path || r.regexp).join(', '));

export default router;
