import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  username: string;
  avatar?: string;
  role: string;
  currentDomainId?: string;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Domains the user has joined.
   * Note: Joining a domain requires only role selection and membership payment.
   * Identity verification is NOT required to join a domain.
   */
  domains: Array<{
    domainId: string;
    role: string;
    joinedAt: Date;
  }>;
  apiKeys: Array<{
    name: string;
    key: string;
    expiresAt?: Date;
  }>;
  /**
   * Identity verification state.
   * This is a SEPARATE process from domain joining.
   * Users can join domains without being verified.
   * Verification is handled through posts on the home screen,
   * not during the domain join flow.
   */
  identity: {
    isVerified: boolean;
    verifiedAt?: Date;
    verificationType?: 'kyc' | 'email' | 'phone' | 'document';
    verificationLevel?: 'basic' | 'standard' | 'enhanced';
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin'],
  },
  currentDomainId: {
    type: String,
  },
  domains: [{
    domainId: String,
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  apiKeys: [{
    name: String,
    key: String,
    expiresAt: Date,
  }],
  identity: {
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    verificationType: {
      type: String,
      enum: ['kyc', 'email', 'phone', 'document'],
    },
    verificationLevel: {
      type: String,
      enum: ['basic', 'standard', 'enhanced'],
    },
  },
}, {
  timestamps: true,
});

// Compound index to ensure a user can't join the same domain twice
// This provides database-level protection against duplicate domain joins
UserSchema.index({ '_id': 1, 'domains.domainId': 1 }, { unique: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  // Convert _id to id for consistency with frontend expectations
  user.id = user._id.toString();
  delete user.password;
  delete user.apiKeys;
  return user;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);