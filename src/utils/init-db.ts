import { connectToDatabase, getSequelize } from '../services/database.service';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';

async function initializeDatabase() {
  try {
    await connectToDatabase();
    const sequelize = getSequelize();

    // Define model associations before syncing
    
    // User <-> Account associations
    User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
    Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    
    // Transaction <-> Account associations
    Transaction.belongsTo(Account, { foreignKey: 'fromAccountId', as: 'fromAccount' });
    Transaction.belongsTo(Account, { foreignKey: 'toAccountId', as: 'toAccount' });
    Account.hasMany(Transaction, { foreignKey: 'fromAccountId', as: 'outgoingTransactions' });
    Account.hasMany(Transaction, { foreignKey: 'toAccountId', as: 'incomingTransactions' });
    
    // Transaction <-> User associations
    Transaction.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
    Transaction.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' });
    User.hasMany(Transaction, { foreignKey: 'fromUserId', as: 'sentTransactions' });
    User.hasMany(Transaction, { foreignKey: 'toUserId', as: 'receivedTransactions' });

    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
