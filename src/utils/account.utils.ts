import { config } from '../config';

export function generateAccountNumber(): string {
  // Format: BANK_PREFIX + TIMESTAMP + RANDOM_DIGITS
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${config.bank.prefix}${timestamp}${random}`;
}
