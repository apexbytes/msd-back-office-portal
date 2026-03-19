export type AdvertStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AdvertPlacement = 'HERO' | 'SIDEBAR' | 'FOOTER' | 'IN_FEED' | 'POPUP';

export interface Advert {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  placement: AdvertPlacement;
  status: AdvertStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
