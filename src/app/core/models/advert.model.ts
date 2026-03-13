import { FileUploadResult } from './common.model';

export interface Advert {
  id: string;
  title: string;
  description: string;
  media: FileUploadResult | null;
  published: boolean;
  lifespanDays: number;
  expiresAt: string | null;
  metadata: {
    websiteUrl?: string;
    contactEmail?: string;
  };
}
