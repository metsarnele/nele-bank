import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';

export function initializeDatabase() {
  // User-Account relationship (one-to-many)
  User.hasMany(Account, {
    sourceKey: 'id',
    foreignKey: 'userId',
    as: 'accounts'
  });
  Account.belongsTo(User, {
    targetKey: 'id',
    foreignKey: 'userId',
    as: 'user'
  });

  // Account-Transaction relationships
  Account.hasMany(Transaction, {
    sourceKey: 'id',
    foreignKey: 'fromAccountId',
    as: 'outgoingTransactions'
  });
  Account.hasMany(Transaction, {
    sourceKey: 'id',
    foreignKey: 'toAccountId',
    as: 'incomingTransactions'
  });
  Transaction.belongsTo(Account, {
    targetKey: 'id',
    foreignKey: 'fromAccountId',
    as: 'fromAccount'
  });
  Transaction.belongsTo(Account, {
    targetKey: 'id',
    foreignKey: 'toAccountId',
    as: 'toAccount'
  });
}
