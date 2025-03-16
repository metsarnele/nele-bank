import { Account } from '../models/account.model';
import { IAccount, IAccountCreate } from '../interfaces/account.interface';
import { generateAccountNumber } from '../utils/account.utils';
import { BankService } from './bank.service';
import { User } from '../models/user.model';

export class AccountService {
  private static instance: AccountService;

  private constructor() {}

  public static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService();
    }
    return AccountService.instance;
  }

  private toAccountResponse(account: Account): IAccount {
    return {
      id: account.id,
      accountNumber: account.accountNumber,
      userId: account.userId,
      currency: account.currency,
      balance: account.balance,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    };
  }

  public async createAccount(accountData: IAccountCreate): Promise<IAccount> {
    const accountNumber = generateAccountNumber();
    
    // Verify account number uniqueness
    const existingAccount = await Account.findOne({ where: { accountNumber } });
    if (existingAccount) {
      // In the unlikely event of a collision, generate a new number
      return this.createAccount(accountData);
    }

    // Set initial balance to 100 EUR for new accounts
    const initialBalance = accountData.currency.toUpperCase() === 'EUR' ? 100 : 0;

    const account = await Account.create({
      accountNumber,
      userId: accountData.userId,
      currency: accountData.currency.toUpperCase(),
      balance: initialBalance,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.toAccountResponse(account);
  }

  public async getAccountsByUserId(userId: number): Promise<IAccount[]> {
    const accounts = await Account.findAll({ where: { userId } });
    return accounts.map(account => this.toAccountResponse(account));
  }

  public async getAccountBalance(accountId: number): Promise<IAccount | null> {
    const account = await Account.findByPk(accountId);
    return account ? this.toAccountResponse(account) : null;
  }

  public async getAccountByNumber(accountNumber: string): Promise<IAccount | null> {
    const account = await Account.findOne({
      where: { accountNumber },
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    });
    return account ? this.toAccountResponse(account) : null;
  }

  public async updateAccountCurrency(accountNumber: string, newCurrency: string): Promise<{
    message: string;
    account: {
      name: string;
      balance: number;
      currency: string;
      number: string;
    };
    conversionRate: string;
  }> {
    const account = await Account.findOne({
      where: { accountNumber },
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const oldCurrency = account.currency;
    if (oldCurrency === newCurrency) {
      throw new Error('Account is already in the requested currency');
    }

    // Get exchange rate and convert balance
    const bankService = BankService.getInstance();
    const { rate } = await bankService.getExchangeRate(oldCurrency, newCurrency);
    const newBalance = await bankService.convertAmount(account.balance, oldCurrency, newCurrency);

    // Update account with new currency and balance
    await account.update({
      currency: newCurrency,
      balance: newBalance
    });

    return {
      message: 'Account currency updated successfully',
      account: {
        name: account.user?.name || 'Main',
        balance: newBalance,
        currency: newCurrency,
        number: accountNumber
      },
      conversionRate: rate.toString()
    };
  }

  public async verifyAccountOwnership(accountId: number, userId: number): Promise<boolean> {
    const account = await Account.findOne({
      where: {
        id: accountId,
        userId: userId
      }
    });
    return !!account;
  }
}
