import { Transaction } from '../models/transaction.model';
import { Account } from '../models/account.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { config } from '../config';
import axios, { AxiosError } from 'axios';
import { Op } from 'sequelize';
import crypto from 'crypto';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
  IInternalTransfer,
  IExternalTransfer,
  IExternalTransactionRequest
} from '../interfaces/transaction.interface';
import {
  NotFoundError,
  InsufficientFundsError,
  ValidationError,
  TransactionError,
  ExternalServiceError
} from '../utils/errors';

export class TransactionService {
  private static instance: TransactionService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  public static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  private toTransactionResponse(transaction: Transaction): ITransaction {
    return {
      id: transaction.id,
      transactionId: transaction.transactionId,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      fromAccountId: transaction.fromAccountId,
      toAccountId: transaction.toAccountId,
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      externalFromAccount: transaction.externalFromAccount,
      externalToAccount: transaction.externalToAccount,
      externalBankId: transaction.externalBankId,
      description: transaction.description,
      errorMessage: transaction.errorMessage,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      completedAt: transaction.completedAt
    };
  }

  private async validateAccounts(fromAccountId: number, toAccountNumber: string, amount: number): Promise<Account> {
    const fromAccount = await Account.findByPk(fromAccountId);
    if (!fromAccount) {
      throw new NotFoundError('Source account');
    }

    if (fromAccount.balance < amount) {
      throw new InsufficientFundsError();
    }

    if (amount <= 0) {
      throw new ValidationError('Transaction amount must be positive');
    }

    return fromAccount;
  }

  private async updateBalances(
    fromAccount: Account,
    toAccount: Account | null,
    amount: number,
    type: TransactionType
  ): Promise<void> {
    const t = await Account.sequelize!.transaction();
    try {
      // Deduct from source account
      await fromAccount.decrement('balance', { by: amount, transaction: t });

      // Add to destination account if internal transfer
      if (type === TransactionType.INTERNAL && toAccount) {
        await toAccount.increment('balance', { by: amount, transaction: t });
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw new TransactionError(
        'Failed to update account balances',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  public async createInternalTransfer(transferData: IInternalTransfer): Promise<ITransaction> {
    const fromAccount = await this.validateAccounts(
      transferData.fromAccountId,
      transferData.toAccount,
      transferData.amount
    );

    const toAccount = await Account.findOne({ where: { accountNumber: transferData.toAccount } });
    if (!toAccount) {
      throw new NotFoundError('Destination account');
    }

    if (fromAccount.currency !== toAccount.currency) {
      throw new ValidationError('Currency mismatch between accounts', {
        fromCurrency: fromAccount.currency,
        toCurrency: toAccount.currency
      });
    }

    // Prevent transfers to the same account
    if (fromAccount.id === toAccount.id) {
      throw new ValidationError('Cannot transfer to the same account');
    }

    const transaction = await Transaction.create({
      transactionId: crypto.randomUUID(),
      type: TransactionType.INTERNAL,
      status: TransactionStatus.PENDING,
      amount: transferData.amount,
      currency: fromAccount.currency,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      fromUserId: fromAccount.userId,
      toUserId: toAccount.userId,
      description: transferData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      await this.updateBalances(fromAccount, toAccount, transferData.amount, TransactionType.INTERNAL);

      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
      await transaction.save();

      return this.toTransactionResponse(transaction);
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      await transaction.save();
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }

  public async createExternalTransfer(transferData: IExternalTransfer): Promise<ITransaction> {
    // Validate the accounts and ensure sufficient funds
    const fromAccount = await this.validateAccounts(
      transferData.fromAccountId,
      transferData.toAccount,
      transferData.amount
    );

    // Create a pending transaction record
    const transaction = await Transaction.create({
      transactionId: crypto.randomUUID(),
      type: TransactionType.EXTERNAL,
      status: TransactionStatus.PENDING,
      amount: transferData.amount,
      currency: fromAccount.currency,
      fromAccountId: fromAccount.id,
      fromUserId: fromAccount.userId,
      externalToAccount: transferData.toAccount,
      externalBankId: transferData.toAccount.substring(0, 3), // Extract bank prefix from account number
      description: transferData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      // Update the local balance
      await this.updateBalances(fromAccount, null, transferData.amount, TransactionType.EXTERNAL);
      
      // Use the B2B service to send the transfer to the destination bank
      try {
        console.log('Initiating external transfer through B2B service');
        const b2bService = await import('./b2b.service').then(m => m.B2BService.getInstance());
        
        // Send the transfer to the destination bank
        const result = await b2bService.initiateExternalTransfer(
          fromAccount.accountNumber,
          transferData.toAccount,
          transferData.amount,
          fromAccount.currency,
          transferData.description || 'Transfer from ' + config.bank.name
        );
        
        console.log('External transfer initiated successfully:', result);
        
        // Mark the transaction as completed
        transaction.status = TransactionStatus.COMPLETED;
        transaction.completedAt = new Date();
        await transaction.save();
      } catch (error) {
        console.error('Error initiating external transfer:', error);
        
        // If the B2B transfer fails, we should revert the balance update
        // Credit the amount back to the sender's account
        try {
          // Use the same method but reverse the direction
          // This adds the amount back to the fromAccount
          fromAccount.balance += transferData.amount;
          await fromAccount.save();
          console.log(`Reverted balance for account ${fromAccount.id} to ${fromAccount.balance}`);
        } catch (balanceError) {
          console.error('Failed to revert balance:', balanceError);
          // Continue with the error handling even if balance revert fails
        }
        
        // Mark the transaction as failed
        transaction.status = TransactionStatus.FAILED;
        transaction.errorMessage = error instanceof Error ? error.message : 'Failed to send transfer to destination bank';
        await transaction.save();
        
        throw new TransactionError('Failed to send transfer to destination bank: ' + 
          (error instanceof Error ? error.message : 'Unknown error'));
      }

      return this.toTransactionResponse(transaction);
    } catch (error) {
      // Only update the transaction status if it hasn't been updated already
      if (transaction.status === TransactionStatus.PENDING) {
        transaction.status = TransactionStatus.FAILED;
        transaction.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        await transaction.save();
      }
      
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }

  public async handleIncomingExternalTransfer(transferData: IExternalTransactionRequest): Promise<ITransaction> {
    // Since we've migrated to SQLite and simplified the app, we'll skip external bank verification
    console.log('Processing incoming external transfer:', transferData);

    // Validate required fields according to Bank API v2 spec
    if (!transferData.fromAccount) {
      throw new Error('Source account (accountFrom) is required');
    }

    if (!transferData.toAccount) {
      throw new Error('Destination account (accountTo) is required');
    }

    if (!transferData.amount || transferData.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const destinationAccount = await Account.findOne({
      where: { accountNumber: transferData.toAccount }
    });

    if (!destinationAccount) {
      throw new Error('Destination account not found');
    }

    // Use the currency from the transfer data, or the destination account's currency if not specified
    const currency = transferData.currency || destinationAccount.currency;

    if (destinationAccount.currency !== currency) {
      throw new Error('Currency mismatch');
    }

    // Use explanation field from Bank API v2 spec as the description if available
    const description = transferData.explanation || transferData.description || `Payment from ${transferData.senderName || 'external account'}`;

    try {
      // Create transaction data with null for foreign key fields that don't exist
      const transactionData: any = {
        transactionId: transferData.transactionId || crypto.randomUUID(),
        type: TransactionType.EXTERNAL,
        status: TransactionStatus.PENDING,
        amount: transferData.amount,
        currency: currency, // Use the validated currency
        fromAccountId: null, // Use null instead of 0 for external transfers
        toAccountId: destinationAccount.id,
        fromUserId: null, // Use null instead of 0 for external transfers
        toUserId: destinationAccount.userId,
        externalFromAccount: transferData.fromAccount,
        externalBankId: transferData.fromAccount.substring(0, 4),
        description: description,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating transaction with data:', transactionData);

      const transaction = await Transaction.create(transactionData);

      // Update the destination account balance
      destinationAccount.balance += transferData.amount;
      await destinationAccount.save();

      // Update the transaction status
      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
      await transaction.save();

      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    // The transaction has already been created and the balance updated in the try block above
  }

  public async getTransactionHistory(userId: number): Promise<ITransaction[]> {
    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    return transactions.map(tx => this.toTransactionResponse(tx));
  }

  public async getTransactionStatus(transactionId: string): Promise<ITransaction | null> {
    const transaction = await Transaction.findOne({ where: { transactionId } });
    return transaction ? this.toTransactionResponse(transaction) : null;
  }
}
