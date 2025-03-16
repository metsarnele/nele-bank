import { Sequelize } from 'sequelize';
import { config } from '../config';

let sequelize: Sequelize | null = null;

export function initializeSequelize(): Sequelize {
  if (!sequelize) {
    // Set up SQLite database configuration
    const dbPath = process.env.DB_PATH || './nele_bank.sqlite';
    
    // Debug log to verify configuration
    console.log('Database Configuration:', {
      dialect: 'sqlite',
      storage: dbPath
    });

    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: config.env === 'development' ? console.log : false
    });

    // Log connection details
    console.log('Attempting database connection with:', {
      dialect: 'sqlite',
      storage: dbPath
    });
  }
  return sequelize;
}

export function getSequelize(): Sequelize {
  if (!sequelize) {
    return initializeSequelize();
  }
  return sequelize;
}

export async function connectToDatabase(): Promise<void> {
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('Successfully connected to SQLite database.');
  } catch (error) {
    console.error('Error connecting to SQLite database:', error);
    process.exit(1);
  }
}
