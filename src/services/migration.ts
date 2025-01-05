import * as protobuf from 'protobufjs';
import { base32 } from 'rfc4648';
import protoDefinition from './otpauth.proto?raw';

export interface OTPSecretInfo {
  secret: string;
  name: string;
  issuer: string;
  algorithm: string;
  digits: number;
  type: string;
  counter: {
    low: number;
    high: number;
    unsigned: boolean;
  };
}

const ALGORITHM = {
  0: "unspecified",
  1: "sha1",
  2: "sha256",
  3: "sha512",
  4: "md5",
} as const;

const DIGIT_COUNT = {
  0: 6, // default to 6 for unspecified
  1: 6,
  2: 8,
} as const;

const OTP_TYPE = {
  0: "unspecified",
  1: "hotp",
  2: "totp",
} as const;

// Convert a base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function parseGoogleAuthMigration(dataUri: string): Promise<OTPSecretInfo[]> {
  try {
    if (typeof dataUri !== "string") {
      throw new Error("source url must be a string");
    }

    if (!dataUri.startsWith("otpauth-migration://offline")) {
      throw new Error("source url must begin with otpauth-migration://offline");
    }

    // Extract the data parameter using URL
    const url = new URL(dataUri);
    const sourceData = url.searchParams.get("data");

    if (!sourceData) {
      throw new Error("source url doesn't contain otpauth data");
    }

    // Load and parse the protobuf schema
    const root = await protobuf.parse(protoDefinition).root;
    const MigrationPayload = root.lookupType('MigrationPayload');

    // Decode the base64 data
    const binaryData = base64ToUint8Array(sourceData);

    // Decode the protobuf message
    const message = MigrationPayload.decode(binaryData);
    const decodedOtpPayload = MigrationPayload.toObject(message, {
      longs: String,
      enums: Number,
      defaults: true,
    });

    // Convert the decoded message to our format
    return decodedOtpPayload.otpParameters.map(params => ({
      secret: base32.stringify(params.secret),
      name: params.name || '',
      issuer: params.issuer || '',
      algorithm: ALGORITHM[params.algorithm] || 'sha1',
      digits: DIGIT_COUNT[params.digits] || 6,
      type: OTP_TYPE[params.type] || 'totp',
      counter: {
        low: 0,
        high: 0,
        unsigned: false
      }
    }));
  } catch (error) {
    console.error('Error parsing OTP migration data:', error);
    throw error;
  }
}

export const migrationService = {
  parseGoogleAuthMigration
};