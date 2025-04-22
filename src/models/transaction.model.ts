import { Model, DataTypes, Optional } from 'sequelize';
import { ITransaction, TransactionStatus, TransactionType } from '../interfaces/transaction.interface';
import { getSequelize } from '../services/database.service';
import crypto from 'crypto';
import { User } from './user.model';
import { Account } from './account.model';

interface TransactionCreationAttributes extends Optional<ITransaction, 'id'> {}

export class Transaction extends Model<ITransaction, TransactionCreationAttributes> implements ITransaction {
  public id!: number;
  public transactionId!: string;
  public type!: TransactionType;
  public status!: TransactionStatus;
  public amount!: number;
  public currency!: string;
  public fromAccountId!: number;
  public toAccountId?: number;
  public fromUserId!: number;
  public toUserId?: number;
  public externalFromAccount?: string;
  public externalToAccount?: string;
  public externalBankId?: string;
  public description?: string;
  public errorMessage?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public completedAt?: Date;
}

Transaction.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  transactionId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
    defaultValue: () => crypto.randomUUID()
  },
  type: {
    type: DataTypes.ENUM(...Object.values(TransactionType)),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(...Object.values(TransactionStatus)),
    allowNull: false,
    defaultValue: TransactionStatus.PENDING,
    comment: 'Transaction status:\n' +
      '- pending: Initial state, transaction is created but not yet processed\n' +
      '- inProgress: Transaction is being processed (e.g., external bank transfer)\n' +
      '- completed: Transaction has been successfully processed\n' +
      '- failed: Transaction failed due to an error (see errorMessage)'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    validate: {
      len: [3, 3],
      isUppercase: true
    }
  },
  fromAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for external transfers
    references: {
      model: 'accounts',
      key: 'id'
    }
  },
  toAccountId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'accounts',
      key: 'id'
    }
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for external transfers
    references: {
      model: 'users',
      key: 'id'
    }
  },
  toUserId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  externalFromAccount: {
    type: DataTypes.STRING
  },
  externalToAccount: {
    type: DataTypes.STRING
  },
  externalBankId: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.STRING
  },
  errorMessage: {
    type: DataTypes.STRING
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completedAt: {
    type: DataTypes.DATE
  }
}, {
  sequelize: getSequelize(),
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['transactionId'] },
    { fields: ['fromAccountId'] },
    { fields: ['toAccountId'] },
    { fields: ['fromUserId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

// Associations are defined in init-db.ts
