import { Request, Response } from 'express';
import { BankService } from '../services/bank.service';
import { config } from '../config';

export class BankController {
  private static instance: BankController;
  private bankService: BankService;

  private constructor() {
    this.bankService = BankService.getInstance();
  }

  public static getInstance(): BankController {
    if (!BankController.instance) {
      BankController.instance = new BankController();
    }
    return BankController.instance;
  }

  public async registerBank(req: Request, res: Response): Promise<void> {
    try {
      const { name, owners } = req.body;

      // Construct registration data with our endpoints
      const registrationData = {
        name,
        owners,
        jwksUrl: `${config.app.baseUrl}/.well-known/jwks.json`,
        transactionUrl: `${config.app.baseUrl}/transactions/b2b`
      };

      const registrationResponse = await this.bankService.registerBank(registrationData);

      // Store the API key and other details in environment variables or secure storage
      // For now, we'll just return them
      res.status(200).json(registrationResponse);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error during bank registration' });
      }
    }
  }
}
