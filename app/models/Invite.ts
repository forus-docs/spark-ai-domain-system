import mongoose from 'mongoose';

export interface IInvite extends mongoose.Document {
  code: string;
  domainId: string;
  roleId: string;
  createdBy: string; // userId who created the invite
  createdAt: Date;
  expiresAt: Date;
  usedBy?: string; // userId who used the invite
  usedAt?: Date;
  status: 'active' | 'used' | 'expired';
}

const InviteSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  domainId: {
    type: String,
    required: true
  },
  roleId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  usedBy: {
    type: String,
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  }
});

// Indexes for efficient lookup (removed duplicate code index since unique already creates one)
InviteSchema.index({ status: 1, expiresAt: 1 });

// Method to check if invite is valid
InviteSchema.methods.isValid = function() {
  return this.status === 'active' && new Date() < this.expiresAt;
};

// Method to mark invite as used
InviteSchema.methods.markAsUsed = async function(userId: string) {
  this.status = 'used';
  this.usedBy = userId;
  this.usedAt = new Date();
  return this.save();
};

const Invite = mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);

export default Invite;