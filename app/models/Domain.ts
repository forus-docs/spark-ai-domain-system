import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
  domainId: string;
  name: string;
  tagline?: string;
  description: string;
  icon: string;
  color: string;
  gradient?: string;
  cta?: string;
  joinDetails?: any;
  memberCount: number;
  availableRoles: Array<{
    id: string;
    name: string;
    description: string;
    monthlyFee: number;
    benefits: string[];
  }>;
  features: string[];
  processes: string[]; // Process IDs
  navigation: Array<{
    id: string;
    name: string;
    href: string;
    icon: string;
    badge?: string;
  }>;
  region?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema<IDomain>(
  {
    domainId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    tagline: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    gradient: {
      type: String,
    },
    cta: {
      type: String,
    },
    joinDetails: {
      type: Schema.Types.Mixed,
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    availableRoles: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        monthlyFee: {
          type: Number,
          required: true,
        },
        benefits: [String],
      },
    ],
    features: [String],
    processes: [String], // References to Process IDs
    navigation: [
      {
        id: String,
        name: String,
        href: String,
        icon: String,
        badge: String,
      },
    ],
    region: String,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
DomainSchema.index({ name: 'text', description: 'text' });

const Domain = mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);

export default Domain;