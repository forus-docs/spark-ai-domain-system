import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  keycloakId: string; // Maps to Keycloak 'sub' claim
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
    verificationType?: 'kyc' | 'email' | 'phone' | 'document' | 'keycloak';
    verificationLevel?: 'basic' | 'standard' | 'enhanced';
  };
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  keycloakId: {
    type: String,
    required: true,
    unique: true,
    index: true,
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
      enum: ['kyc', 'email', 'phone', 'document', 'keycloak'],
    },
    verificationLevel: {
      type: String,
      enum: ['basic', 'standard', 'enhanced'],
    },
  },
}, {
  timestamps: true,
});

// Indexes with readable names
// Compound index to ensure a user can't join the same domain twice
UserSchema.index({ '_id': 1, 'domains.domainId': 1 }, { unique: true, name: 'idx_user_domain_unique' });
UserSchema.index({ 'domains.domain': 1 }, { name: 'idx_user_domains' });
UserSchema.index({ 'identity.isVerified': 1 }, { name: 'idx_verified' });

// No password hashing needed with Keycloak authentication

// Remove sensitive data from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  // Convert _id to id for consistency with frontend expectations
  user.id = user._id.toString();
  delete user.apiKeys; // Keep API keys private
  delete user.keycloakId; // Internal mapping, not needed in frontend
  return user;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);