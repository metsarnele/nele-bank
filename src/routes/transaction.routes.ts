import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { JWKSController } from '../controllers/jwks.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
  internalTransferSchema,
  externalTransferSchema,
  b2bTransactionSchema
} from '../schemas/transaction.schema';

const router = Router();
const transactionController = TransactionController.getInstance();
const jwksController = JWKSController.getInstance();

// Get transaction history (protected endpoint)
router.get('/', authenticate, (req, res) => transactionController.getTransactionHistory(req, res));

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['success']
 *                   example: 'success'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       transactionId:
 *                         type: string
 *                         format: 'uuid'
 *                         example: '123e4567-e89b-12d3-a456-426614174000'
 *                       type:
 *                         type: string
 *                         enum: ['internal', 'external']
 *                         example: 'internal'
 *                       status:
 *                         type: string
 *                         enum: ['pending', 'inProgress', 'completed', 'failed']
 *                         example: 'completed'
 *                       amount:
 *                         type: number
 *                         example: 500.00
 *                       currency:
 *                         type: string
 *                         enum: ['EUR', 'USD', 'GBP']
 *                         example: 'EUR'
 *                       fromAccountId:
 *                         type: integer
 *                         example: 123
 *                       toAccountId:
 *                         type: integer
 *                         example: 456
 *                       description:
 *                         type: string
 *                         example: 'Rent payment'
 *                       createdAt:
 *                         type: string
 *                         format: 'date-time'
 *                         example: '2025-03-11T15:00:00Z'
 *                       completedAt:
 *                         type: string
 *                         format: 'date-time'
 *                         example: '2025-03-11T15:00:02Z'
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
router.get('/', authenticate, (req, res) => transactionController.getTransactionHistory(req, res));

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *           examples:
 *             internal:
 *               summary: Internal transfer example
 *               value:
 *                 fromAccountId: 123
 *                 toAccount: 'ABC123456789'
 *                 amount: 750.00
 *                 currency: 'EUR'
 *                 description: 'Monthly savings'
 *                 type: 'internal'
 *             external:
 *               summary: External transfer example
 *               value:
 *                 fromAccountId: 123
 *                 toAccount: 'XYZ987654321'
 *                 toBankId: 'BANK003'
 *                 amount: 2500.00
 *                 currency: 'EUR'
 *                 description: 'Investment transfer'
 *                 type: 'external'
 *           description: |
 *             Required fields:
 *             - fromAccountId: ID of your account
 *             - toAccount: Recipient's account number
 *             - amount: Amount to transfer (> 0)
 *             - currency: Must be one of [EUR, USD, GBP]
 *             - type: 'internal' or 'external'
 *             
 *             For external transfers, also include:
 *             - toBankId: ID of the recipient's bank
 *             
 *             Note: For internal transfers, both accounts must use the same currency
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 transaction:
 *                   $ref: '#/components/schemas/TransferResponse'
 *             examples:
 *               success:
 *                 summary: Successful transaction
 *                 value:
 *                   message: 'Transaction completed successfully'
 *                   transaction:
 *                     transactionId: '123e4567-e89b-12d3-a456-426614174000'
 *                     status: 'completed'
 *                     amount: 750.00
 *                     currency: 'EUR'
 *                     fromAccount: 'ABC123456789'
 *                     toAccount: 'XYZ987654321'
 *                     description: 'Monthly savings'
 *                     createdAt: '2025-03-16T11:05:00Z'
 *                     completedAt: '2025-03-16T11:05:02Z'
 *               pending:
 *                 summary: Pending external transfer
 *                 value:
 *                   message: 'Transaction initiated successfully'
 *                   transaction:
 *                     transactionId: '123e4567-e89b-12d3-a456-426614174001'
 *                     status: 'pending'
 *                     amount: 2500.00
 *                     currency: 'EUR'
 *                     fromAccount: 'ABC123456789'
 *                     toAccount: 'XYZ987654321'
 *                     toBankId: 'BANK003'
 *                     description: 'Investment transfer'
 *                     createdAt: '2025-03-16T11:10:00Z'
 *       400:
 *         description: Invalid input or insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               invalidInput:
 *                 value:
 *                   status: 'error'
 *                   message: 'Invalid amount: must be greater than 0'
 *               insufficientFunds:
 *                 value:
 *                   status: 'error'
 *                   message: 'Insufficient funds: available balance is 1000.00 EUR'
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
 *       403:
 *         description: The accountFrom does not belong to the user
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
 *                   example: 'You do not have access to this account'
 *             examples:
 *               forbidden:
 *                 value:
 *                   error: 'Forbidden'
 *       404:
 *         description: Receiver not found
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
 *                   example: 'Receiver account ABC123456789 not found'
 */
// Create transaction (protected endpoint)
router.post('/', authenticate, validateRequest({
  body: internalTransferSchema.or(externalTransferSchema)
}), (req, res) => {
  const { type } = req.body;
  if (type === 'internal') {
    return transactionController.createInternalTransfer(req, res);
  } else if (type === 'external') {
    return transactionController.createExternalTransfer(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }
});

/**
 * @swagger
 * /transactions/jwks:
 *   get:
 *     tags: [Transactions]
 *     summary: Get bank's public keys in JWKS format
 *     security: []
 *     responses:
 *       200:
 *         description: JWKS containing public keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       kty:
 *                         type: string
 *                       kid:
 *                         type: string
 *                       n:
 *                         type: string
 *                       e:
 *                         type: string
 *             example:
 *               keys:
 *                 - kty: 'RSA'
 *                   n: 'sNO9smFz1GKJjDpjE-KTfS-Ri4O9V0sOJC7RZXXUZ3fbi3UwcD-MtQ8iek0JZEKELgjQoagugDm9PQ67FHQEdBZ__zrt6hxwA2_TAE0XjhztUJNzmw2S6vPf-TaLgWt4-mVtwNp-uAnYd_kO4xdtPBwySF9vLD4UmyXJJqXl8z3mBZ723kNkhUmxtKBRSSA8fmARDHqLN3YwU5Hd0Nvd9Mj1PYRWd1gz9wFEXqpbunQsggLuF2d5JgZdC598tyjSPrKmOODU3r53MD_0VbMTGuXAkBWauk3eEJ5byTURbtpy77aUDmB5fHEY7aSwxsOYNiCo3bXwO6GQaoOwt9hZkQ'
 *                   e: 'AQAB'
 *                   kid: 'NELE'
 *                   use: 'sig'
 *                   alg: 'RS256'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ["error"]
 *                 message:
 *                   type: string
 *             example:
 *               status: 'error'
 *               message: 'Failed to generate JWKS'
 */
// JWKS endpoint should be public (no authentication required)
router.get('/jwks', (req, res) => jwksController.getJWKS(req, res));

/**
 * @swagger
 * /transactions/b2b:
 *   post:
 *     tags: [Transactions]
 *     summary: Accept transaction from another bank
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/B2BTransaction'
 *           example:
 *             jwt: 'base64EncodedHeaderContainingAlgorithmUsedToSignTheToken.base64EncodedPayloadPart.base64EncodedSignatureCalculatedWithPrivateKeyFromHeaderAndPayload'
 *     responses:
 *       200:
 *         description: Transfer accepted
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
 *               message: 'Transaction processed successfully'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ["error"]
 *                 message:
 *                   type: string
 *             example:
 *               status: 'error'
 *               message: 'Parsing JWT payload failed: reason here'
 *       404:
 *         description: Account not found
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
 *                   example: 'Account not found'
 *       500:
 *         description: Server error occurred during transaction processing
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
 *                   example: 'Cannot verify your signature: The jwksUrl of your bank is missing'
 *       502:
 *         description: Central Bank error
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
 *                   example: 'Central Bank error: Service temporarily unavailable'
 */
router.post('/b2b',
  validateRequest({ body: b2bTransactionSchema }),
  (req, res) => transactionController.handleIncomingExternalTransfer(req, res)
);

export default router;
