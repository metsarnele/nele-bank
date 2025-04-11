import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateSessionRequest } from '../middlewares/session-validation.middleware';
import { userLoginSchema } from '../schemas/user.schema';

const router = Router();
const userController = UserController.getInstance();

/**
 * @swagger
 * /sessions:
 *   post:
 *     tags: [Sessions]
 *     summary: Log in a user
 *     description: Authenticates a user and returns a JWT token
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
 *               token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
 *       400:
 *         description: "Error: Bad Request"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ["error"]
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
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
 *             example:
 *               status: 'error'
 *               error:
 *                 code: 'VALIDATION_ERROR'
 *                 message: 'Username and password are required'
 *                 details: [
 *                   {
 *                     field: 'username',
 *                     message: 'Required',
 *                     code: 'invalid_type'
 *                   },
 *                   {
 *                     field: 'password',
 *                     message: 'Required',
 *                     code: 'invalid_type'
 *                   }
 *                 ]
 *       401:
 *         description: "Error: Unauthorized"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ["error"]
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     message:
 *                       type: string
 *             example:
 *               status: 'error'
 *               error:
 *                 code: 'AUTHENTICATION_ERROR'
 *                 message: 'Invalid username or password'
 */
router.post('/',
  validateSessionRequest(userLoginSchema),
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
 *                 status:
 *                   type: string
 *                   enum: ["success"]
 *                 message:
 *                   type: string
 *             example:
 *               status: 'success'
 *               message: 'Successfully logged out'
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
router.delete('/', authenticate, (req, res) => userController.logout(req, res));

export default router;
