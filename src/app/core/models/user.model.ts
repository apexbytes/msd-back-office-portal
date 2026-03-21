import { FileUploadResult } from './common.model';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  mobileNumber?: string;
  callNumber?: string;
  whatsappNumber?: string;
  useSameNumberForWhatsapp?: boolean;
  avatar: FileUploadResult | null;
  bio?: string;
  roles: Role[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  isOnline: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  city?: string;
  country?: string;
  rating?: number;
  socialLinks?: {
    website?: string;
    facebook?: string;
    x?: string;
    linkedIn?: string;
    instagram?: string;
  };
  lastActive: string; // ISO Date
  createdAt: string; // ISO Date
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  type: 'ADMIN' | 'CLIENT' | 'USER';
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  action: string;
  resource: string;
  description?: string;
}
