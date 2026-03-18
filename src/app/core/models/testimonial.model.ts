import { FileUploadResult } from './common.model';

export interface Testimonial {
  id: string;
  name: string;
  designation?: string;
  company?: string;
  message: string;
  image: FileUploadResult | null;
  rating?: number;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'DELETED';
  featured?: boolean;
  sortOrder?: number;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
