import crypto from 'crypto';

// Generate a 32-byte key from our environment variable or fallback configuration
const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || 'mindmirror-super-secret-key-32bytes-long';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts cleartext into iv:authTag:ciphertext format
 */
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let ciphertext = cipher.update(text, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${ciphertext}`;
};

/**
 * Decrypts a formatted cipher string (iv:authTag:ciphertext) back to cleartext
 */
export const decrypt = (cipherString: string): string => {
  try {
    const parts = cipherString.split(':');
    if (parts.length !== 3) {
      // If it doesn't match format, assume it was stored plaintext (e.g. legacy data)
      return cipherString;
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, log and return original string to prevent breaking
    return cipherString;
  }
};
