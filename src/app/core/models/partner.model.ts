import { FileUploadResult } from './common.model';

export interface Partner {
  id: string;
  name: string;
  description: string;
  logo: FileUploadResult | null;
  website?: string;
  partnershipLevel: 'PREMIUM' | 'STANDARD' | 'BASIC';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}
