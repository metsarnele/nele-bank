import { generateKeyPairSync } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

async function generateKeys() {
  // Generate RSA key pair
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
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

  // Create keys directory if it doesn't exist
  const keysDir = path.join(__dirname, '..', 'keys');
  await fs.mkdir(keysDir, { recursive: true });

  // Write keys to files
  await fs.writeFile(path.join(keysDir, 'private_key.pem'), privateKey);
  await fs.writeFile(path.join(keysDir, 'public_key.pem'), publicKey);

  console.log('RSA key pair generated successfully!');
  console.log('Location: ' + keysDir);
}

generateKeys().catch(console.error);
