import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../services/account.service';
import { TransactionType } from '../interfaces/transaction.interface';
import crypto from 'crypto';

export class TransactionController {
  private static instance: TransactionController;
  private transactionService: TransactionService;
  private accountService: AccountService;

  private constructor() {
    this.transactionService = TransactionService.getInstance();
    this.accountService = AccountService.getInstance();
  }

  public static getInstance(): TransactionController {
    if (!TransactionController.instance) {
      TransactionController.instance = new TransactionController();
    }
    return TransactionController.instance;
  }

  public async createInternalTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { fromAccountId, toAccount, amount, currency, description } = req.body;

      // Validate required fields
      if (!fromAccountId || !toAccount || !amount || !currency) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
        return;
      }

      // Validate amount
      if (amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Amount must be greater than 0'
        });
        return;
      }

      // Verify account ownership
      const isOwner = await this.accountService.verifyAccountOwnership(fromAccountId, req.user.id);
      if (!isOwner) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have access to this account'
        });
        return;
      }

      const transaction = await this.transactionService.createInternalTransfer({
        fromAccountId,
        toAccount,
        amount,
        currency,
        description
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: transaction.id,
          status: transaction.status
        }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  public async createExternalTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { fromAccountId, toAccount, toBankId, amount, currency, description } = req.body;

      // Validate required fields
      if (!fromAccountId || !toAccount || !toBankId || !amount || !currency) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
        return;
      }

      // Validate amount
      if (amount <= 0) {
        res.status(400).json({
          status: 'error',
          message: 'Amount must be greater than 0'
        });
        return;
      }

      // Verify account ownership
      const isOwner = await this.accountService.verifyAccountOwnership(fromAccountId, req.user.id);
      if (!isOwner) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have access to this account'
        });
        return;
      }

      const transaction = await this.transactionService.createExternalTransfer({
        fromAccountId,
        toAccount,
        toBankId,
        amount,
        currency,
        description
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: transaction.id,
          status: transaction.status
        }
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  public async handleIncomingExternalTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { jwt } = req.body;
      
      if (!jwt) {
        res.status(400).json({
          status: 'error',
          message: 'JWT token is required'
        });
        return;
      }

      // Decode the JWT payload
      try {
        // Extract the payload part (second part) of the JWT
        const parts = jwt.split('.');
        if (parts.length !== 3) {
          res.status(400).json({
            status: 'error',
            message: 'Invalid JWT format'
          });
          return;
        }

        // Decode the base64 payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        // Construct the transaction data from the JWT payload
        const transferData = {
          transactionId: payload.transactionId || crypto.randomUUID(),
          fromAccount: payload.accountFrom,
          toAccount: payload.accountTo,
          amount: payload.amount,
          currency: payload.currency,
          description: payload.explanation || payload.description,
          signature: parts[2] // Use the signature part of the JWT
        };

        await this.transactionService.handleIncomingExternalTransfer(transferData);

        res.status(200).json({
          status: 'success',
          message: 'Transaction processed successfully'
        });
      } catch (decodeError: any) {
        res.status(400).json({
          status: 'error',
          message: `Error decoding JWT: ${decodeError.message}`
        });
      }
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  }

  public async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const transactions = await this.transactionService.getTransactionHistory(req.user.id);

      res.status(200).json({
        status: 'success',
        data: transactions.map(tx => ({
          id: tx.id,
          transactionId: tx.transactionId,
          type: tx.type,
          status: tx.status,
          amount: tx.amount,
          currency: tx.currency,
          fromAccountId: tx.fromAccountId,
          toAccountId: tx.toAccountId,
          description: tx.description,
          createdAt: tx.createdAt,
          completedAt: tx.completedAt
        }))
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve transaction history'
      });
    }
  }

  public async getTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const transaction = await this.transactionService.getTransactionStatus(transactionId);

      if (!transaction) {
        res.status(404).json({
          status: 'error',
          message: 'Transaction not found'
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: {
          id: transaction.id,
          transactionId: transaction.transactionId,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          fromAccountId: transaction.fromAccountId,
          toAccountId: transaction.toAccountId,
          description: transaction.description,
          errorMessage: transaction.errorMessage,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve transaction status'
      });
    }
  }
}
