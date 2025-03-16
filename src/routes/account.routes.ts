import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { accountCurrencyUpdateSchema } from '../schemas/account.schema';

const router = Router();
const accountController = AccountController.getInstance();

/**
 * @openapi
 * tags:
 *   name: Accounts
 *   description: Account management endpoints
 */

/**
 * @openapi
 * /accounts/{accountNumber}:
 *   patch:
 *     tags: [Accounts]
 *     summary: Update account currency
 *     description: Update an account's currency with automatic balance conversion
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Account number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currency
 *             properties:
 *               currency:
 *                 type: string
 *                 enum: [EUR, USD, GBP]
 *                 description: New currency for the account
 *           example:
 *             currency: 'USD'
 *     responses:
 *       200:
 *         description: Account currency updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 account:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     balance:
 *                       type: number
 *                     currency:
 *                       type: string
 *                       enum: [EUR, USD, GBP]
 *                     number:
 *                       type: string
 *                 conversionRate:
 *                   type: string
 *                   description: Exchange rate used for conversion
 *             example:
 *               message: 'Account currency updated successfully'
 *               account:
 *                 name: 'Main Account'
 *                 balance: 121.50
 *                 currency: 'USD'
 *                 number: 'abc633520f3596e174fd17832eefa508c0b'
 *               conversionRate: '1 EUR = 1.215 USD'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               invalidCurrency:
 *                 value:
 *                   error: 'Invalid currency. Supported currencies are: EUR, USD, GBP'
 *               sameCurrency:
 *                 value:
 *                   error: 'Account is already in USD currency'
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
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: 'Account abc633520f3596e174fd17832eefa508c0b not found'
 */
router.patch('/:accountNumber', 
  validateRequest({ body: accountCurrencyUpdateSchema }),
  (req, res) => accountController.updateAccountCurrency(req, res)
);

export default router;
