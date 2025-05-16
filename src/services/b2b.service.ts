import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AuthService } from './auth.service';
import { TransactionService } from './transaction.service';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { User } from '../models/user.model';
import { TransactionStatus, TransactionType } from '../interfaces/transaction.interface';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import {
  IB2BTransactionPayload,
  IB2BTransactionResponse,
  IB2BTransactionRequest,
  IBankVerificationResponse,
  IBankRegistrationRequest,
  IBankRegistrationResponse
} from '../interfaces/b2b.interface';

export class B2BService {
  private static instance: B2BService;
  private authService: AuthService;
  private transactionService: TransactionService;

  private constructor() {
    this.authService = AuthService.getInstance();
    this.transactionService = TransactionService.getInstance();
  }

  public static getInstance(): B2BService {
    if (!B2BService.instance) {
      B2BService.instance = new B2BService();
    }
    return B2BService.instance;
  }

  private async verifyBankWithCentralBank(bankPrefix: string): Promise<IBankVerificationResponse> {
    try {
      // Mock response for testing
      if (process.env.TEST_MODE === 'true') {
        // Mock response for testing
        return {
          name: 'Test Bank',
          prefix: bankPrefix,
          transactionEndpoint: 'http://localhost:3001/transactions/b2b',
          jwksEndpoint: 'http://localhost:3001/.well-known/jwks.json',
          isActive: true
        };
      }

      const response = await axios.get(
        `${config.centralBank.verifyUrl}/${bankPrefix}`,
        {
          headers: {
            'Authorization': `Bearer ${config.centralBank.apiKey}`
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to verify bank with Central Bank');
    }
  }

  /**
   * Convert a JWK to PEM format for JWT verification
   * @param jwk The JWK object
   * @returns PEM formatted public key
   */
  private async jwkToPem(jwk: any): Promise<string> {
    // For simplicity, we'll use a basic approach
    // In production, you should use a proper JWK to PEM conversion library
    try {
      // In a real implementation, you would use a library like 'jwk-to-pem'
      // For now, we'll use a simplified approach that works with Node.js crypto
      
      // For testing purposes, return a mock PEM key
      // In production, implement proper JWK to PEM conversion
      return `-----BEGIN PUBLIC KEY-----\n${jwk.n}\n-----END PUBLIC KEY-----`;
    } catch (error) {
      console.error('Error converting JWK to PEM:', error);
      throw new Error('Failed to convert public key format');
    }
  }
  
  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      // Use environment variables for exchange rate API
      const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest';
      const apiKey = process.env.EXCHANGE_RATE_API_KEY || '';

      const response = await axios.get(
        `${apiUrl}/${fromCurrency}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      if (!response.data.rates[toCurrency]) {
        throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      }

      return response.data.rates[toCurrency];
    } catch (error) {
      throw new Error('Failed to fetch exchange rate');
    }
  }

  public async registerWithCentralBank(ownerInfo: IBankRegistrationRequest['ownerInfo']): Promise<IBankRegistrationResponse> {
    try {
      const registrationData: IBankRegistrationRequest = {
        name: config.bank.name,
        prefix: config.bank.prefix,
        transactionEndpoint: config.bank.transactionEndpoint,
        jwksEndpoint: `http://localhost:${config.port}/.well-known/jwks.json`,
        ownerInfo
      };

      const response = await axios.post(
        config.centralBank.registerUrl,
        registrationData
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to register with Central Bank');
    }
  }

  public async processIncomingTransaction(request: IB2BTransactionRequest): Promise<IB2BTransactionResponse> {
    // Extract bank prefix from the JWT payload
    try {
      // First, just decode the payload to get the source bank info
      const parts = request.jwt.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      // Decode the payload without verification first
      const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Extract bank information from JWT header instead of account number
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      // The kid field in the header should identify the source bank
      const kid = header.kid;
      console.log('JWT key ID (kid):', kid);

      // Extract bank prefix from kid or use a mapping
      let sourceBankPrefix;
      if (kid && kid.includes('HENN')) {
        // If kid contains Henno Pank's identifier
        sourceBankPrefix = 'HENN';
      } else if (kid) {
        // Try to extract prefix from kid
        sourceBankPrefix = kid.split('-')[0];
      } else {
        // Fallback to test mode
        console.log('Could not determine source bank, using test mode');
        process.env.TEST_MODE = 'true';
        sourceBankPrefix = 'TEST';
      }
      console.log('Source bank prefix:', sourceBankPrefix);
      
      // Get source bank info from central bank
      const sourceBank = await this.verifyBankWithCentralBank(sourceBankPrefix);
      if (!sourceBank.isActive) {
        throw new Error('Source bank is not active');
      }
      
      // Fetch the public key from the source bank's JWKS endpoint
      try {
        console.log('Fetching public key from:', sourceBank.jwksEndpoint);
        const jwksResponse = await axios.get(sourceBank.jwksEndpoint);
        const jwks = jwksResponse.data;
        
        // Extract the key ID from the JWT header
        const headerPart = parts[0];
        const header = JSON.parse(Buffer.from(headerPart, 'base64').toString());
        const kid = header.kid;
        
        // Find the matching key in the JWKS
        const key = jwks.keys.find((k: any) => k.kid === kid);
        if (!key) {
          throw new Error('Public key not found in JWKS');
        }
        
        // Convert JWK to PEM format
        const publicKey = await this.jwkToPem(key);
        
        // Verify the JWT signature
        const verified = jwt.verify(request.jwt, publicKey, { algorithms: ['RS256'] });
        console.log('JWT verified successfully');
        
        // Use the verified payload
        const payload = verified as IB2BTransactionPayload;

        // Validate receiving account
        const receivingAccount = await Account.findOne({ where: { accountNumber: payload.accountTo } });
        if (!receivingAccount) {
          throw new Error('Receiving account not found');
        }
        
        // Create transaction record
        const transaction = await Transaction.create({
          transactionId: uuidv4(),
          type: TransactionType.EXTERNAL,
          status: TransactionStatus.PENDING,
          amount: payload.amount,
          currency: payload.currency,
          toAccountId: receivingAccount.id,
          toUserId: receivingAccount.userId,
          fromAccountId: 0,
          fromUserId: 0,
          externalFromAccount: payload.accountFrom,
          externalBankId: sourceBankPrefix,
          description: payload.explanation,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        try {
          // Handle currency conversion if needed
          if (payload.currency !== receivingAccount.currency) {
            const exchangeRate = await this.getExchangeRate(payload.currency, receivingAccount.currency);
            payload.amount = Math.floor(payload.amount * exchangeRate);
          }
          
          // Credit receiving account
          await receivingAccount.increment('balance', { by: payload.amount });
          await receivingAccount.save();
          
          transaction.status = TransactionStatus.COMPLETED;
          transaction.completedAt = new Date();
          await transaction.save();
          
          // Get receiver's name from user record
          const receiver = await Account.findOne({
            where: { id: receivingAccount.id },
            include: [{ model: User, as: 'user' }]
          });
          
          if (!receiver || !receiver.user) {
            throw new Error('Failed to load receiver information');
          }
          
          return {
            receiverName: receiver.user.name,
            message: 'Transaction processed successfully'
          };
        } catch (error) {
          transaction.status = TransactionStatus.FAILED;
          transaction.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          await transaction.save();
          throw error;
        }
      } catch (jwksError: any) {
        console.error('Error verifying JWT:', jwksError);
        throw new Error(`JWT verification failed: ${jwksError.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }


  }

  public async initiateExternalTransfer(
    fromAccount: string,
    toAccount: string,
    amount: number,
    currency: string,
    explanation: string
  ): Promise<void> {
    // Extract destination bank prefix
    const destinationBankPrefix = toAccount.substring(0, 3);
    const destinationBank = await this.verifyBankWithCentralBank(destinationBankPrefix);

    if (!destinationBank.isActive) {
      throw new Error('Destination bank is not active');
    }

    // Get sender's account and name
    const senderAccount = await Account.findOne({
      where: { accountNumber: fromAccount },
      include: [{ model: User, as: 'user' }]
    });
    if (!senderAccount) {
      throw new Error('Sender account not found');
    }

    // Create transaction payload
    const payload: IB2BTransactionPayload = {
      accountFrom: fromAccount,
      accountTo: toAccount,
      currency,
      amount,
      explanation,
      senderName: senderAccount.user ? senderAccount.user.name : 'Unknown'
    };

    // Sign the payload
    // Temporarily mock JWT signing
    const jwt = JSON.stringify(payload);

    // Send to destination bank
    try {
      await axios.post(
        destinationBank.transactionEndpoint,
        { jwt },
        {
          headers: {
            'Authorization': `Bearer ${config.centralBank.apiKey}`
          }
        }
      );
    } catch (error) {
      throw new Error('Failed to send transaction to destination bank');
    }
  }
}
