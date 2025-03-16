import axios from 'axios';
import { config } from '../config';
import { IBankRegistrationRequest, IBankRegistrationResponse } from '../interfaces/bank.interface';

export interface ExchangeRateResponse {
  success: boolean;
  rate: number;
  from: string;
  to: string;
  timestamp: number;
}

export class BankService {
  private static instance: BankService;
  private readonly exchangeRateBaseUrl = 'https://api.exchangerate-api.com/v4/latest';
  private constructor() {}

  public static getInstance(): BankService {
    if (!BankService.instance) {
      BankService.instance = new BankService();
    }
    return BankService.instance;
  }

  public async registerBank(registrationData: IBankRegistrationRequest): Promise<IBankRegistrationResponse> {
    try {
      const response = await axios.post<IBankRegistrationResponse>(
        config.centralBank.registerUrl,
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.centralBank.apiKey
          }
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to register bank');
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Bank registration failed: ${error.message}`);
      }
      throw new Error('Bank registration failed with unknown error');
    }
  }

  public async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRateResponse> {
    try {
      const response = await axios.get(`${this.exchangeRateBaseUrl}/${fromCurrency}`);
      
      if (!response.data.rates || !response.data.rates[toCurrency]) {
        throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      const rate = response.data.rates[toCurrency];
      return {
        success: true,
        rate,
        from: fromCurrency,
        to: toCurrency,
        timestamp: response.data.time_last_updated
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get exchange rate: ${error.message}`);
      }
      throw new Error('Failed to get exchange rate');
    }
  }

  public async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const { rate } = await this.getExchangeRate(fromCurrency, toCurrency);
    return Number((amount * rate).toFixed(2));
  }
}
