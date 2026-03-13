import { FileUploadResult } from './common.model';

export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  images: FileUploadResult[];
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  status: 'AVAILABLE' | 'RENTED' | 'SOLD' | 'ARCHIVED' | 'FOR_SALE' | 'FOR_RENT' | 'DRAFT' | 'DELETED';
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  amenities: Record<string, boolean>;
  featured: boolean;
  postedBy: string; // User ID
  latitude?: number;
  longitude?: number;
  createdAt: string;
}
