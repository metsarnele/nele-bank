import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AccountService } from '../services/account.service';
import { B2BService } from '../services/b2b.service';
import { config } from '../config';
import { ITransaction, IInternalTransfer, IExternalTransfer, ISimplifiedTransfer, ITransactionResponse } from '../interfaces/transaction.interface';
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
      const { fromAccountId, toAccount, amount, currency, description } = req.body;

      // Validate required fields
      if (!fromAccountId || !toAccount || !amount || !currency) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields'
        });
        return;
      }
      
      // Extract the bank ID from the account number
      // The first three characters of the account number represent the bank prefix
      if (!toAccount || toAccount.length < 3) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid account number format'
        });
        return;
      }
      
      const targetBankId = toAccount.substring(0, 3);
      console.log(`Extracted bank prefix from account number: ${targetBankId}`);
      
      // Verify the bank ID with the Central Bank
      try {
        // We'll use the B2B service to verify the bank with the Central Bank
        const b2bService = await import('../services/b2b.service').then(m => m.B2BService.getInstance());
        
        console.log(`Verifying bank ${targetBankId} with Central Bank`);
        
        // This will throw an error if the bank is not registered or not active
        await b2bService.verifyBankWithCentralBank(targetBankId);
      } catch (error) {
        console.error('Error verifying bank with Central Bank:', error);
        res.status(400).json({
          status: 'error',
          message: 'Invalid bank ID or bank not registered with Central Bank'
        });
        return;
      }
      
      // Bank ID has been verified with the Central Bank
      console.log('Using verified bank ID for external transfer:', targetBankId);

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

  /**
   * Process a simplified transfer request that uses account numbers for both source and destination
   * @param req Express request object
   * @param res Express response object
   */
  public async createSimplifiedTransfer(req: Request, res: Response): Promise<void> {
    try {
      const { accountFrom, accountTo, amount, currency = 'EUR', explanation } = req.body;
      
      // Find the user's account by account number
      const fromAccount = await this.accountService.getAccountByNumber(accountFrom);
      
      if (!fromAccount) {
        res.status(404).json({
          status: 'error',
          message: 'Source account not found'
        });
        return;
      }
      
      // Verify account ownership
      const isOwner = await this.accountService.verifyAccountOwnership(fromAccount.id, req.user.id);
      if (!isOwner) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have access to this account'
        });
        return;
      }
      
      // Create a transaction object with the required format
      const transactionData = {
        fromAccountId: fromAccount.id,
        toAccount: accountTo,
        amount,
        currency,
        description: explanation
      };
      
      // Determine if it's an internal or external transfer
      let transaction;
      if (accountTo.startsWith('300')) { // Using Nele Bank prefix
        transaction = await this.transactionService.createInternalTransfer({
          ...transactionData,
          type: 'internal'
        });
      } else {
        transaction = await this.transactionService.createExternalTransfer({
          ...transactionData,
          type: 'external'
        });
      }
      
      // Format the response
      const formattedTransaction = await this.formatTransactionResponse(transaction);
      
      res.status(201).json({
        message: 'Transaction completed successfully',
        transaction: formattedTransaction
      });
    } catch (error: any) {
      console.error('Error processing simplified transfer:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'An error occurred while processing the transfer'
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
