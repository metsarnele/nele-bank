import { Request, Response } from 'express';
import fs from 'fs/promises';
import { createPublicKey } from 'crypto';
import { config } from '../config';

export class JWKSController {
  private static instance: JWKSController;

  private constructor() {}

  public static getInstance(): JWKSController {
    if (!JWKSController.instance) {
      JWKSController.instance = new JWKSController();
    }
    return JWKSController.instance;
  }

  public async getJWKS(req: Request, res: Response): Promise<void> {
    try {
      // Read the public key file
      const publicKeyPem = await fs.readFile(config.bank.publicKeyPath, 'utf8');
      
      // Convert PEM to KeyObject
      const publicKey = createPublicKey(publicKeyPem);
      
      // Get the key details
      const keyDetails = publicKey.export({ format: 'jwk' });

      // Create JWKS response
      const jwks = {
        keys: [{
          ...keyDetails,
          kid: config.bank.prefix,
          use: 'sig',
          alg: config.jwt.algorithm
        }]
      };

      res.status(200).json(jwks);
    } catch (error) {
      console.error('Error generating JWKS:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate JWKS'
      });
    }
  }
}
