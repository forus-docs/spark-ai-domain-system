export interface Role {
  id: string;
  name: string;
  description: string;
  price: string;
  isDefault?: boolean;
  benefits: string[];
}

export interface JoinDetails {
  minInvestment: string;
  minimumInvestment?: string;
  benefit: string;
}

export interface Domain {
  id: string;
  slug?: string; // String identifier like 'maven-hub' for reference
  icon: string;
  name: string;
  tagline: string;
  description: string;
  cta: string;
  region: string;
  color: string;
  gradient: string;
  hasExistingMembers: boolean;
  joinDetails: JoinDetails;
  roles: Role[];
  availableRoles: Role[];
  memberCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'max';
}

export interface UserDomainMembership {
  userId: string;
  domainId: string;
  roleId: string;
  joinedAt: Date;
}

export interface RecentItem {
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  section: string;
}