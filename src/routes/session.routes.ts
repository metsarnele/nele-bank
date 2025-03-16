import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { userLoginSchema } from '../schemas/user.schema';

const router = Router();
const userController = UserController.getInstance();

/**
 * @swagger
 * /sessions:
 *   post:
 *     tags: [Sessions]
 *     summary: Log in a user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *           example:
 *             username: 'miki'
 *             password: 'MySecurePass123!'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *             example:
 *               token: '5f883c52cdb989473690cc95'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: 'Username and password are required'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: 'Invalid username or password'
 */
router.post('/',
  validateRequest({ body: userLoginSchema }),
  (req, res) => userController.login(req, res)
);

/**
 * @swagger
 * /sessions:
 *   delete:
 *     tags: [Sessions]
 *     summary: Log out current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: 'Successfully logged out'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: 'Authentication token is missing or invalid'
 */
router.delete('/', authenticate, (req, res) => userController.logout(req, res));

export default router;
