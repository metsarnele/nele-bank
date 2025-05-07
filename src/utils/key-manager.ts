import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { generateKeyPair } from 'crypto';
import { config } from '../config';

const generateKeyPairAsync = promisify(generateKeyPair);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
const writeFileAsync = promisify(fs.writeFile);

/**
 * Ensures that RSA keys exist at the configured paths
 * If keys don't exist, generates a new key pair
 */
export async function ensureKeysExist(): Promise<void> {
  try {
    // Check if keys directory exists, create if not
    const keysDir = path.dirname(config.bank.publicKeyPath);
    try {
      await accessAsync(keysDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await mkdirAsync(keysDir, { recursive: true });
      console.log(`Created keys directory: ${keysDir}`);
    }

    // Check if public key exists
    try {
      await accessAsync(config.bank.publicKeyPath);
      await accessAsync(config.bank.privateKeyPath);
      console.log('RSA keys already exist');
      return; // Keys exist, nothing to do
    } catch (error) {
      // Keys don't exist, generate them
      console.log('RSA keys not found, generating new key pair...');
      
      const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Write keys to files
      await writeFileAsync(config.bank.publicKeyPath, publicKey);
      await writeFileAsync(config.bank.privateKeyPath, privateKey);
      
      console.log('RSA key pair generated successfully');
    }
  } catch (error) {
    console.error('Error ensuring keys exist:', error);
    throw new Error('Failed to ensure RSA keys exist');
  }
}
