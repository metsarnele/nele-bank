import { z } from 'zod';
import { currencySchema } from './account.schema';

export const transactionTypeSchema = z.enum(['internal', 'external']);
export const transactionStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed']);

const baseTransactionSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum transaction amount is 0.01'),
  currency: z.enum(['EUR', 'USD', 'GBP'], {
    required_error: 'Currency is required',
    invalid_type_error: 'Currency must be one of: EUR, USD, GBP'
  }),
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
});

// Legacy schemas kept for backward compatibility
export const internalTransferSchema = baseTransactionSchema.extend({
  fromAccountId: z.number().int('Account ID must be an integer'),
  toAccount: z.string()
    .min(1, 'Destination account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  type: z.literal('internal')
});

export const externalTransferSchema = baseTransactionSchema.extend({
  fromAccountId: z.number().int('Account ID must be an integer'),
  toAccount: z.string()
    .min(1, 'Destination account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  // Bank ID is now extracted from the account number
  type: z.literal('external')
});

// New unified schema that doesn't require the type field
export const unifiedTransferSchema = baseTransactionSchema.extend({
  fromAccountId: z.number().int('Account ID must be an integer'),
  toAccount: z.string()
    .min(1, 'Destination account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  // Type is optional and will be determined automatically if not provided
  type: z.enum(['internal', 'external']).optional()
});

// Simplified schema using account numbers for both source and destination
export const simplifiedTransferSchema = z.object({
  accountFrom: z.string()
    .min(1, 'Source account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  accountTo: z.string()
    .min(1, 'Destination account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  amount: z.number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum transaction amount is 0.01'),
  currency: z.enum(['EUR', 'USD', 'GBP'], {
    required_error: 'Currency is required',
    invalid_type_error: 'Currency must be one of: EUR, USD, GBP'
  }).optional(), // Make currency optional, default to EUR if not provided
  explanation: z.string()
    .max(200, 'Explanation cannot exceed 200 characters')
    .optional()
});

export const b2bTransactionSchema = z.object({
  jwt: z.string().min(1, 'JWT token is required')
});

// Original schema kept for reference
export const b2bTransactionPayloadSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  fromAccount: z.string()
    .min(1, 'Source account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  toAccount: z.string()
    .min(1, 'Destination account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  amount: z.number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum transaction amount is 0.01'),
  currency: currencySchema,
  description: z.string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional(),
  signature: z.string().min(1, 'Transaction signature is required')
});

export const transactionResponseSchema = z.object({
  id: z.string(),
  status: transactionStatusSchema,
  amount: z.string(),
  currency: currencySchema,
  accountFrom: z.string(),
  accountTo: z.string(),
  explanation: z.string().optional(),
  senderName: z.string(),
  createdAt: z.string(),
  statusDetail: z.string().default('')
});

export type InternalTransfer = z.infer<typeof internalTransferSchema>;
export type ExternalTransfer = z.infer<typeof externalTransferSchema>;
export type B2BTransaction = z.infer<typeof b2bTransactionSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
