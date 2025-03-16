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
    const fromAccount = await this.validateAccounts(
      transferData.fromAccountId,
      transferData.toAccount,
      transferData.amount
    );

    const transaction = await Transaction.create({
      transactionId: crypto.randomUUID(),
      type: TransactionType.EXTERNAL,
      status: TransactionStatus.PENDING,
      amount: transferData.amount,
      currency: fromAccount.currency,
      fromAccountId: fromAccount.id,
      fromUserId: fromAccount.userId,
      externalToAccount: transferData.toAccount,
      externalBankId: transferData.toBankId,
      description: transferData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      // Since we've migrated to SQLite, we'll just process the transfer locally
      await this.updateBalances(fromAccount, null, transferData.amount, TransactionType.EXTERNAL);
      
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

  public async handleIncomingExternalTransfer(transferData: IExternalTransactionRequest): Promise<void> {
    // Since we've migrated to SQLite and simplified the app, we'll skip external bank verification

    const destinationAccount = await Account.findOne({
      where: { accountNumber: transferData.toAccount }
    });

    if (!destinationAccount) {
      throw new Error('Destination account not found');
    }

    if (destinationAccount.currency !== transferData.currency) {
      throw new Error('Currency mismatch');
    }

    const transaction = await Transaction.create({
      transactionId: transferData.transactionId,
      type: TransactionType.EXTERNAL,
      status: TransactionStatus.PENDING,
      amount: transferData.amount,
      currency: transferData.currency,
      fromAccountId: 0, // Using 0 as a placeholder for external transfers
      toAccountId: destinationAccount.id,
      fromUserId: 0, // Using 0 as a placeholder for external transfers
      toUserId: destinationAccount.userId,
      externalFromAccount: transferData.fromAccount,
      externalToAccount: undefined,
      externalBankId: transferData.fromAccount.substring(0, 4),
      description: transferData.description,
      errorMessage: undefined,
      completedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    try {
      // Update destination account balance
      await destinationAccount.increment('balance', { by: transferData.amount });

      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
      await transaction.save();
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      await transaction.save();
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
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
