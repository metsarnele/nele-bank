export enum TransactionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum TransactionType {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

export interface ITransaction {
  id: number;
  transactionId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  fromAccountId: number;
  toAccountId?: number;
  fromUserId: number;
  toUserId?: number;
  externalFromAccount?: string;
  externalToAccount?: string;
  externalBankId?: string;
  description?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface IInternalTransfer {
  fromAccountId: number;
  toAccount: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface IExternalTransfer {
  fromAccountId: number;
  toAccount: string;
  toBankId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface ITransactionResponse {
  transactionId: string;
  status: TransactionStatus;
  errorMessage?: string;
}

export interface IExternalTransactionRequest {
  transactionId: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  description?: string;
  signature: string;
}
