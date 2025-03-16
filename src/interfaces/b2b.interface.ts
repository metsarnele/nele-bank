export interface IB2BTransactionPayload {
  accountFrom: string;  // Must start with bank prefix
  accountTo: string;    // Must start with bank prefix
  currency: string;     // 3-letter currency code (EUR, USD, GBP)
  amount: number;       // Amount in smallest currency unit (cents)
  explanation: string;  // Transaction description
  senderName: string;   // Name of the sending account holder
}

export interface IB2BTransactionResponse {
  receiverName: string; // Name of the receiving account holder
}

export interface IB2BTransactionRequest {
  jwt: string;  // JWT containing the transaction payload
}

// Response from Central Bank's bank verification endpoint
export interface IBankVerificationResponse {
  name: string;
  prefix: string;
  transactionEndpoint: string;
  jwksEndpoint: string;
  isActive: boolean;
}

// Request body for bank registration with Central Bank
export interface IBankRegistrationRequest {
  name: string;
  prefix: string;
  transactionEndpoint: string;
  jwksEndpoint: string;
  ownerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
}

// Response from bank registration
export interface IBankRegistrationResponse {
  apiKey: string;
  prefix: string;
  status: 'active' | 'pending' | 'rejected';
  message?: string;
}
