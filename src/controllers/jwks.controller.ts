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

  public async getJWKS(req: Request, res: Response): Promise<Response | void> {
    try {
      // Read the public key file
      let publicKeyPem;
      try {
        publicKeyPem = await fs.readFile(config.bank.publicKeyPath, 'utf8');
      } catch (fileError) {
        console.error(`Could not read public key file at ${config.bank.publicKeyPath}:`, fileError);
        return res.status(500).json({
          status: 'error',
          message: 'Public key file not found or inaccessible'
        });
      }
      
      // Convert PEM to KeyObject
      let publicKey;
      try {
        publicKey = createPublicKey(publicKeyPem);
      } catch (cryptoError) {
        console.error('Invalid public key format:', cryptoError);
        return res.status(500).json({
          status: 'error',
          message: 'Invalid public key format'
        });
      }
      
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
