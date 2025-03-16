import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { userRegistrationSchema, userLoginSchema } from '../schemas/user.schema';

const router = Router();
const userController = UserController.getInstance();

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: '5f7739fedc144dc2b25cfa75'
 *                 name:
 *                   type: string
 *                   example: 'Miki Hiir'
 *                 username:
 *                   type: string
 *                   example: 'miki'
 *                 accounts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: 'Main'
 *                       balance:
 *                         type: number
 *                         example: 100000
 *                       currency:
 *                         type: string
 *                         example: 'EUR'
 *                       number:
 *                         type: string
 *                         example: 'abc633520f3596e174fd17832eefa508c0b'
 *                       id:
 *                         type: string
 *                         example: '5f7739fedc144dc2b25cfa76'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Username already exists
 */
router.post('/',
  validateRequest({ body: userRegistrationSchema }),
  (req, res) => userController.register(req, res)
);

/**
 * @swagger
 * /users/current:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       401:
 *         description: Not authenticated
 */
router.get('/current',
  authenticate,
  (req, res) => userController.getProfile(req, res)
);

export default router;
