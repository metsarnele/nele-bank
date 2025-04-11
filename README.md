# Nele Bank

Secure banking application that integrates with the central bank and enables inter-bank transactions.

## Features

- User registration with simplified requirements (name, username, password)
- Default EUR account with 100 EUR initial balance for new users
- Multiple currency accounts per user (EUR, USD, GBP)
- Internal bank transfers with same-currency validation
- External bank transfers via Central Bank integration
- Secure communication using JWT-signed payloads
- Transaction history and status tracking
- SwaggerUI API documentation
- Automatic currency conversion for cross-currency transactions
- Bank registration with Central Bank
- JWKS endpoint for public key distribution
- Bank-to-bank transaction processing
- Test mode for development and integration testing

## Technical Stack

- Express.js (backend framework)
- SQLite (relational database)
- Sequelize (ORM)
- JWT (authentication and secure messaging)
- Node.js (runtime)
- TypeScript (programming language)
- Swagger/OpenAPI (API documentation)
- RSA-256 for bank-to-bank security
- JWKS for public key distribution
- Exchange Rate API for currency conversion

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

   If you encounter any issues with missing dependencies, make sure to install them explicitly:
   ```bash
   npm install http-status-codes
   ```

2. Database Setup:
   The application uses SQLite which requires no additional installation. The database file will be automatically created when you start the application.

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your bank's configuration
   ```

   Required environment variables:
   - Database configuration:
     - `DB_PATH`: Path to SQLite database file (default: ./nele_bank.sqlite)
     - `TEST_DB_PATH`: Path to test database file (default: ./nele_bank_test.sqlite)
   - Bank interoperability:
     - `BANK_API_KEY`: API key from Central Bank (obtained during registration)
     - `BANK_PREFIX`: Your bank's 3-character prefix (assigned by Central Bank)
     - `BANK_TRANSACTION_ENDPOINT`: Your bank's endpoint for receiving transactions
     - `BANK_JWKS_ENDPOINT`: Your bank's JWKS endpoint
     - `CENTRAL_BANK_REGISTER_URL`: Central Bank's registration endpoint
     - `CENTRAL_BANK_VERIFY_URL`: Central Bank's verification endpoint
     - `EXCHANGE_RATE_API_KEY`: API key for currency exchange rates
     - `TEST_MODE`: Enable/disable Central Bank response mocking

3. Generate RSA key pair:
   ```bash
   npm run generate-keys
   ```

4. Initialize database:
   ```bash
   # The database schema will be automatically created on first run
   npm run dev
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   npm start
   ```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3001/docs

The API documentation includes:
- All available endpoints
- Request/response examples
- Authentication requirements
- Schema definitions

## Security

### Authentication

Public endpoints (no authentication required):
- POST /users - User registration
- POST /sessions - User login
- GET /transactions/jwks - Bank's public keys
- POST /transactions/b2b - Inter-bank transactions

All other endpoints require JWT authentication.

### Security Features
- Inter-bank communication uses JWT-signed payloads
- Bank's public key is published via JWKS endpoint
- All incoming transactions are validated using sender's public key
- RSA-256 encryption for bank-to-bank communication
- Central Bank verification of participating banks
- Rate limiting to prevent abuse
- Secure key storage with environment variables

## Bank Registration

1. Generate your RSA key pair using the provided script:
   ```bash
   npm run generate-keys
   ```

2. Configure your bank's details in `.env` (copy from .env.example)

3. Register with the Central Bank using your bank's details

4. Update your `.env` with the received API key

## Bank-to-Bank Transactions

### User Registration
```bash
POST /users
Content-Type: application/json

{
  "name": "John Doe",        # 2-100 characters, letters/spaces/hyphens only
  "username": "johndoe123",  # 3-50 characters, alphanumeric/underscores/hyphens
  "password": "securepass"   # minimum 8 characters
}
```

Upon successful registration:
- A new user account is created
- A default EUR account is created with 100 EUR initial balance
- Additional currency accounts can be created with 0 initial balance

### Sending a Transaction
```bash
POST /api/v1/transactions/external
Content-Type: application/json
Authorization: Bearer <your-access-token>

{
  "fromAccount": "NELE123456789",
  "toAccount": "BANK987654321",
  "amount": 10000,  # Amount in smallest currency unit (cents)
  "currency": "EUR",
  "explanation": "Payment for services"
}
```

### Receiving a Transaction
Transactions from other banks will be received at your `BANK_TRANSACTION_ENDPOINT`:
```bash
POST /api/v1/transactions/b2b
Content-Type: application/json
Authorization: Bearer <bank-api-key>

{
  "jwt": "<signed-transaction-payload>"
}
```

### Currency Conversion
Cross-currency transactions are automatically handled using the configured exchange rate API. The conversion happens at the receiving bank's end to ensure the most current rates are used.

## Testing

For development and testing:
1. Set `TEST_MODE=true` in `.env` to mock Central Bank responses
2. Use the provided test endpoints to simulate inter-bank transactions
3. Monitor the logs for detailed transaction flow

For production:
1. Ensure `TEST_MODE=false`
2. Configure all required environment variables
3. Register with the actual Central Bank
4. Test with small transactions first

## Error Handling & Troubleshooting

### Common HTTP Status Codes
- `400 Bad Request`: Invalid transaction payload or validation error
- `401 Unauthorized`: Invalid or missing JWT/API key
- `403 Forbidden`: Bank not registered or inactive
- `404 Not Found`: Receiving account not found
- `409 Conflict`: Duplicate transaction or insufficient funds
- `500 Internal Server Error`: Server-side error

### Common Issues
1. **JWKS Endpoint Unreachable**
   - Check if your bank's JWKS endpoint is accessible
   - Verify the RSA key pair exists in the specified path
   - Ensure the public key is properly formatted

2. **Transaction Verification Failed**
   - Verify the sending bank's prefix matches their registration
   - Check if the sending bank is active in Central Bank

3. **Database Issues**
   - Ensure write permissions for the SQLite database directory
   - Check if the database file path in .env is correct
   - For fresh start, delete the .sqlite file and restart the application

4. **Currency Mismatch**
   - For internal transfers, both accounts must use the same currency
   - External transfers will be automatically converted at the receiving bank
   - Ensure the JWT signature is valid

3. **Currency Conversion Failed**
   - Verify your exchange rate API key
   - Check if the currency pair is supported
   - Ensure the exchange rate API is accessible

4. **Central Bank Communication**
   - Verify your bank's API key is valid
   - Check if Central Bank endpoints are accessible
   - Ensure your bank's registration is active

## Logging & Monitoring

### Transaction Logs
All bank-to-bank transactions are logged with detailed information:
- Transaction ID and timestamp
- Source and destination banks
- Transaction status and completion time
- Currency conversion details
- Error messages if any

### Security Logs
- Failed authentication attempts
- Invalid JWT signatures
- Rate limit violations
- Bank verification failures

### Monitoring
The application exposes metrics for monitoring:
- Transaction success/failure rates
- API response times
- Currency conversion rates
- Bank-to-bank communication status

Logs are written to:
- Console in development mode
- Log files in production mode (see `LOG_LEVEL` in `.env`)
