import app from './app';
import { config } from './config';
import { connectToDatabase } from './services/database.service';
import { initializeDatabase } from './services/init-db';
import { ensureKeysExist } from './utils/key-manager';

const startServer = async () => {
  try {
    // Ensure RSA keys exist for JWKS endpoint
    await ensureKeysExist();
    
    // Initialize database connection
    await connectToDatabase();

    // Initialize database associations
    initializeDatabase();

    // Start the server
    app.listen(config.port, () => {
      console.log(`Server is running at http://localhost:${config.port}`);
      console.log(`API Documentation available at http://localhost:${config.port}/docs`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
