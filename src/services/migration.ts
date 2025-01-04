import * as protobuf from 'protobufjs';

// Define the Protocol Buffer schema for Google Authenticator migration
const migrationProto = `
syntax = "proto3";

message MigrationPayload {
  repeated OtpParameters otp_parameters = 1;
  int32 version = 2;
  int32 batch_size = 3;
  int32 batch_index = 4;
  int32 batch_id = 5;
}

message OtpParameters {
  bytes secret = 1;
  string name = 2;
  string issuer = 3;
  Algorithm algorithm = 4;
  DigitCount digits = 5;
  OtpType type = 6;
  int64 counter = 7;

  enum Algorithm {
    ALGORITHM_UNSPECIFIED = 0;
    ALGORITHM_SHA1 = 1;
    ALGORITHM_SHA256 = 2;
    ALGORITHM_SHA512 = 3;
    ALGORITHM_MD5 = 4;
  }

  enum DigitCount {
    DIGIT_COUNT_UNSPECIFIED = 0;
    DIGIT_COUNT_SIX = 1;
    DIGIT_COUNT_EIGHT = 2;
  }

  enum OtpType {
    OTP_TYPE_UNSPECIFIED = 0;
    OTP_TYPE_HOTP = 1;
    TOTP = 2;
  }
}`;

// Convert Algorithm enum to string
const algorithmMap: { [key: number]: string } = {
  0: 'SHA1', // Default to SHA1 for unspecified
  1: 'SHA1',
  2: 'SHA256',
  3: 'SHA512',
  4: 'MD5'
};

// Convert DigitCount enum to number
const digitCountMap: { [key: number]: number } = {
  0: 6, // Default to 6 digits for unspecified
  1: 6,
  2: 8
};

export interface ParsedOtpParameters {
  secret: string;
  name: string;
  issuer?: string;
  algorithm: string;
  digits: number;
  type: 'hotp' | 'totp';
  counter?: number;
}

export class MigrationService {
  private root: protobuf.Root;
  private MigrationPayload: protobuf.Type;

  constructor() {
    this.root = protobuf.parse(migrationProto).root;
    this.MigrationPayload = this.root.lookupType('MigrationPayload');
  }

  /**
   * Parse a Google Authenticator migration URI
   * @param uri The migration URI (otpauth-migration://offline?data=...)
   * @returns Array of parsed OTP parameters
   */
  async parseGoogleAuthMigration(uri: string): Promise<ParsedOtpParameters[]> {
    try {
      // Extract the base64 data from the URI
      const match = uri.match(/data=([^&]+)/);
      if (!match) {
        throw new Error('Invalid migration URI format');
      }

      // Decode the base64 data
      const base64Data = match[1].replace(/-/g, '+').replace(/_/g, '/');
      const binaryData = Buffer.from(base64Data, 'base64');

      // Decode the protobuf message
      const message = this.MigrationPayload.decode(binaryData);
      const payload = this.MigrationPayload.toObject(message, {
        longs: String,
        enums: Number,
        defaults: true,
      });

      // Convert the decoded message to our format
      return payload.otpParameters.map(params => ({
        secret: Buffer.from(params.secret).toString('base64'),
        name: params.name || '',
        issuer: params.issuer || undefined,
        algorithm: algorithmMap[params.algorithm] || 'SHA1',
        digits: digitCountMap[params.digits] || 6,
        type: params.type === 1 ? 'hotp' : 'totp',
        counter: params.type === 1 ? Number(params.counter) : undefined
      }));
    } catch (error) {
      console.error('Failed to parse migration data:', error);
      throw new Error('Failed to parse migration data');
    }
  }

  /**
   * Parse a single otpauth URI
   * @param uri The otpauth URI (otpauth://totp/...)
   * @returns Parsed OTP parameters
   */
  parseOtpAuthUri(uri: string): ParsedOtpParameters {
    try {
      const url = new URL(uri);
      if (!url.protocol.startsWith('otpauth:')) {
        throw new Error('Invalid otpauth URI');
      }

      const type = url.protocol.replace('otpauth:', '').replace('//', '') as 'hotp' | 'totp';
      const label = decodeURIComponent(url.pathname.substring(1));
      const params = Object.fromEntries(url.searchParams.entries());

      // Split label into issuer and name if it contains a colon
      let issuer = params.issuer;
      let name = label;
      if (label.includes(':')) {
        [issuer, name] = label.split(':').map(s => s.trim());
      }

      return {
        secret: params.secret,
        name,
        issuer,
        algorithm: (params.algorithm || 'SHA1').toUpperCase(),
        digits: parseInt(params.digits || '6', 10),
        type,
        counter: type === 'hotp' ? parseInt(params.counter || '0', 10) : undefined
      };
    } catch (error) {
      console.error('Failed to parse otpauth URI:', error);
      throw new Error('Invalid otpauth URI');
    }
  }
}

export const migrationService = new MigrationService();
