import { Model, DataTypes, Optional } from 'sequelize';
import { getSequelize } from '../services/database.service';
import { IAccount } from '../interfaces/account.interface';
import { generateAccountNumber } from '../utils/account.utils';
import { User } from './user.model';

interface AccountCreationAttributes extends Optional<IAccount, 'id'> {}

export class Account extends Model<IAccount, AccountCreationAttributes> implements IAccount {
  public id!: number;
  public accountNumber!: string;
  public userId!: number;
  public currency!: string;
  public balance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public user?: User;
}

Account.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  accountNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    defaultValue: generateAccountNumber
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
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
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize: getSequelize(),
  modelName: 'Account',
  tableName: 'accounts',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['accountNumber'] }
  ]
});

// Associations are defined in init-db.ts
