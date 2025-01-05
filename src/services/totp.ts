// Base32 decode function
function base32ToBytes(base32: string): Uint8Array {
  const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(base32.length * 5 / 8 | 0);

  base32 = base32.replace(/=+$/, '').toUpperCase();

  for (let i = 0; i < base32.length; i++) {
    value = (value << 5) | base32chars.indexOf(base32[i]);
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output;
}

// HMAC-SHA1 implementation
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    message
  );

  return new Uint8Array(signature);
}

export async function generateTOTP(secret: string, period: number = 30, digits: number = 6): Promise<string> {
  try {
    // Get current counter value
    const counter = Math.floor(Date.now() / 1000 / period);
    
    // Convert counter to buffer
    const counterBuffer = new Uint8Array(8);
    let temp = counter;
    for (let i = counterBuffer.length - 1; i >= 0; i--) {
      counterBuffer[i] = temp & 0xff;
      temp = temp >> 8;
    }

    // Get key from base32 secret
    const key = base32ToBytes(secret.toUpperCase());

    // Calculate HMAC
    const hmac = await hmacSha1(key, counterBuffer);

    // Get offset
    const offset = hmac[hmac.length - 1] & 0xf;

    // Generate 4-byte code
    const code = ((hmac[offset] & 0x7f) << 24) |
                ((hmac[offset + 1] & 0xff) << 16) |
                ((hmac[offset + 2] & 0xff) << 8) |
                (hmac[offset + 3] & 0xff);

    // Get the specified number of digits
    const modulus = Math.pow(10, digits);
    const formatStr = digits === 6 ? '000000' : '00000000';
    const result = (code % modulus).toString();

    return (formatStr + result).slice(-digits);
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return '000000';
  }
}

export function getRemainingSeconds(period: number = 30): number {
  return period - (Math.floor(Date.now() / 1000) % period);
}
