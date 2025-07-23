import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IKey extends Document {
  userId: string;
  name: string;
  value: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KeySchema = new Schema<IKey>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
KeySchema.index({ userId: 1, name: 1 });

// Method to check if key is expired
KeySchema.methods.isExpired = function (): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Encrypt key value before saving
KeySchema.pre('save', function (next) {
  if (!this.isModified('value')) return next();
  
  try {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.CREDS_KEY || 'default-32-character-encryption-key'.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.from(process.env.CREDS_IV || 'default-16-char-iv'.padEnd(16, '0').slice(0, 16));
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(this.value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    this.value = encrypted + ':' + authTag.toString('hex');
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Decrypt key value when retrieved
KeySchema.methods.decryptValue = function (): string {
  try {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.CREDS_KEY || 'default-32-character-encryption-key'.padEnd(32, '0').slice(0, 32));
    const iv = Buffer.from(process.env.CREDS_IV || 'default-16-char-iv'.padEnd(16, '0').slice(0, 16));
    
    const [encrypted, authTag] = this.value.split(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt key value');
  }
};

const Key = mongoose.models.Key || mongoose.model<IKey>('Key', KeySchema);

export default Key;