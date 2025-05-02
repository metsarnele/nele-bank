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
 *                 status:
 *                   type: string
 *                   enum: ['success']
 *                   example: 'success'
 *                 message:
 *                   type: string
 *                   example: 'User registered successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: 'Miki Hiir'
 *                     username:
 *                       type: string
 *                       example: 'miki'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['error']
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: 'VALIDATION_ERROR'
 *                     message:
 *                       type: string
 *                       example: 'Invalid request data'
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           message:
 *                             type: string
 *                           code:
 *                             type: string
 *       409:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['error']
 *                 message:
 *                   type: string
 *                   example: 'Username already exists'
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
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['error']
 *                   example: 'error'
 *                 message:
 *                   type: string
 *                   example: 'Authentication token is missing'
 */
router.get('/current',
  authenticate,
  (req, res) => userController.getProfile(req, res)
);

export default router;
