import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../services/account.service';
import { ITransaction, TransactionType } from '../interfaces/transaction.interface';
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

  /**
   * Format transaction response to match Swagger documentation
   */
  private async formatTransactionResponse(transaction: ITransaction): Promise<any> {
    // Get source account number
    let fromAccount = '';
    if (transaction.fromAccountId && transaction.fromAccountId > 0) {
      const sourceAccount = await this.accountService.getAccountBalance(transaction.fromAccountId);
      if (sourceAccount) {
        fromAccount = sourceAccount.accountNumber;
      }
    } else if (transaction.externalFromAccount) {
      fromAccount = transaction.externalFromAccount;
    }

    // Get destination account number
    let toAccount = '';
    if (transaction.toAccountId) {
      const destAccount = await this.accountService.getAccountBalance(transaction.toAccountId);
      if (destAccount) {
        toAccount = destAccount.accountNumber;
      }
    } else if (transaction.externalToAccount) {
      toAccount = transaction.externalToAccount;
    }

    return {
      transactionId: transaction.transactionId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      fromAccount: fromAccount,
      toAccount: toAccount,
      description: transaction.description || '',
      createdAt: transaction.createdAt.toISOString(),
      completedAt: transaction.completedAt ? transaction.completedAt.toISOString() : undefined
    };
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

      // Check if destination account exists
      const destinationAccount = await this.accountService.getAccountByNumber(toAccount);
      if (!destinationAccount) {
        res.status(404).json({
          status: 'error',
          message: 'Destination account not found'
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

      // Format the response to match Swagger documentation
      const formattedTransaction = await this.formatTransactionResponse(transaction);

      res.status(201).json({
        message: 'Transaction completed successfully',
        transaction: formattedTransaction
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
      if (!fromAccountId || !toAccount || !amount || !currency) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
        return;
      }
      
      // Get the destination bank ID
      let targetBankId = toBankId;
      
      // If bank ID is not provided, we need to determine it
      if (!targetBankId) {
        console.log('Bank ID not provided, attempting to determine from account number:', toAccount);
        
        // In a real banking system, we would query the Central Bank's registry
        // to determine which bank an account belongs to
        
        // For Henno Bank, we know their accounts start with '61cb'
        if (toAccount.startsWith('61cb')) {
          targetBankId = 'HENN'; // Henno Bank
          console.log('Determined bank ID for Henno Bank:', targetBankId);
        } else {
          // For other banks, we require the toBankId to be explicitly provided
          // This is because account number formats vary and may not contain identifiable prefixes
          res.status(400).json({
            status: 'error',
            message: 'Could not determine destination bank. Please provide toBankId parameter.'
          });
          return;
        }
      }
      
      // Validate the bank ID with the Central Bank
      try {
        // In production, we would verify the bank ID with the Central Bank
        // For now, we'll just log it
        console.log('Using bank ID for external transfer:', targetBankId);
      } catch (error) {
        console.error('Error verifying bank ID with Central Bank:', error);
        res.status(400).json({
          status: 'error',
          message: 'Invalid bank ID or bank not registered with Central Bank'
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
        toBankId: targetBankId, // Use the determined bank ID
        amount,
        currency,
        description
      });

      // Format the response to match Swagger documentation
      const formattedTransaction = await this.formatTransactionResponse(transaction);

      res.status(201).json({
        message: 'Transaction completed successfully',
        transaction: formattedTransaction
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
          message: 'JWT token is required',
          receiverName: ''
        });
        return;
      }

      try {
        // Use B2B service to process the transaction
        // This will handle JWT verification, account validation, and transaction processing
        const b2bService = await import('../services/b2b.service').then(m => m.B2BService.getInstance());
        const result = await b2bService.processIncomingTransaction({ jwt });
        
        // Return success response
        res.status(200).json({
          receiverName: result.receiverName,
          message: result.message
        });
      } catch (processingError: any) {
        console.error('Error processing B2B transaction:', processingError);
        
        // Determine if this is a JWT validation error
        if (processingError.message && processingError.message.includes('JWT')) {
          res.status(400).json({
            status: 'error',
            message: `Error decoding JWT: ${processingError.message}`,
            receiverName: ''
          });
        } else {
          res.status(400).json({
            status: 'error',
            message: processingError.message,
            receiverName: ''
          });
        }
      }
    } catch (error: any) {
      console.error('Unexpected error in handleIncomingExternalTransfer:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error processing transaction',
        receiverName: ''
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
