import { Request, Response } from 'express';
import { AccountService } from '../services/account.service';
import { validateSchema } from '../middlewares/validation.middleware';
import { accountCurrencyUpdateSchema } from '../schemas/account.schema';

export class AccountController {
  private static instance: AccountController;
  private accountService: AccountService;

  private constructor() {
    this.accountService = AccountService.getInstance();
  }

  public static getInstance(): AccountController {
    if (!AccountController.instance) {
      AccountController.instance = new AccountController();
    }
    return AccountController.instance;
  }

  public async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { currency } = req.body;

      if (!currency) {
        res.status(400).json({
          status: 'error',
          message: 'Currency is required'
        });
        return;
      }

      // Validate currency format (ISO 4217)
      if (!/^[A-Z]{3}$/.test(currency)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid currency format. Must be ISO 4217 code (e.g., EUR, USD)'
        });
        return;
      }

      const account = await this.accountService.createAccount({
        userId: req.user.id,
        currency: currency
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: account.id,
          accountNumber: account.accountNumber,
          currency: account.currency,
          balance: account.balance
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create account'
      });
    }
  }

  public async getAccounts(req: Request, res: Response): Promise<void> {
    try {
      const accounts = await this.accountService.getAccountsByUserId(req.user.id);

      res.status(200).json({
        status: 'success',
        data: accounts.map(account => ({
          id: account.id,
          accountNumber: account.accountNumber,
          currency: account.currency,
          balance: account.balance
        }))
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve accounts'
      });
    }
  }

  public async getAccountBalance(req: Request, res: Response): Promise<void> {
    try {
      const accountId = parseInt(req.params.accountId, 10);
      if (isNaN(accountId)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid account ID'
        });
        return;
      }

      // Verify account ownership
      const isOwner = await this.accountService.verifyAccountOwnership(accountId, req.user.id);
      if (!isOwner) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have access to this account'
        });
        return;
      }

      const account = await this.accountService.getAccountBalance(accountId);
      if (!account) {
        res.status(404).json({
          status: 'error',
          message: 'Account not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          accountNumber: account.accountNumber,
          currency: account.currency,
          balance: account.balance
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve account balance'
      });
    }
  }

  public async updateAccountCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { accountNumber } = req.params;
      const { currency } = validateSchema<{ currency: string }>(accountCurrencyUpdateSchema, req.body);

      // Verify account ownership
      const account = await this.accountService.getAccountByNumber(accountNumber);
      if (!account) {
        res.status(404).json({
          status: 'error',
          message: 'Account not found'
        });
        return;
      }

      if (account.userId !== req.user.id) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have access to this account'
        });
        return;
      }

      const result = await this.accountService.updateAccountCurrency(accountNumber, currency);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          status: 'error',
          message: error.message
        });
        return;
      }
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred'
      });
    }
  }
}
