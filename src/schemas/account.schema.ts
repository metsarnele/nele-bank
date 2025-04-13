import { z } from 'zod';

// Supported currencies based on SQLite schema
export const currencySchema = z.enum(['EUR', 'USD', 'GBP']);

export const accountCurrencyUpdateSchema = z.object({
  currency: currencySchema
});

export const accountCurrencyUpdateResponseSchema = z.object({
  message: z.string(),
  account: z.object({
    name: z.string(),
    balance: z.number(),
    currency: currencySchema,
    number: z.string()
  }),
  conversionRate: z.string()
});

export const createAccountSchema = z.object({
  currency: currencySchema.describe('Currency for the new account')
});

export const accountBalanceSchema = z.object({
  accountNumber: z.string()
    .min(1, 'Account number is required')
    .max(50, 'Account number cannot exceed 50 characters'),
  currency: currencySchema,
  balance: z.number()
    .min(0, 'Balance cannot be negative')
    .default(0)
});

export const accountResponseSchema = z.object({
  id: z.number(),
  accountNumber: z.string(),
  userId: z.number(),
  currency: currencySchema,
  balance: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type CreateAccount = z.infer<typeof createAccountSchema>;
export type AccountBalance = z.infer<typeof accountBalanceSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
