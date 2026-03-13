export interface CreatePropertyRequest {
  title: string;
  description: string;
  price: number;
  images: string[]; // array of public_ids
  status: 'AVAILABLE' | 'RENTED' | 'SOLD' | 'ARCHIVED' | 'FOR_SALE' | 'FOR_RENT' | 'DRAFT' | 'DELETED';
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  amenities: Record<string, boolean>;
  featured?: boolean;
}

export interface UpdatePropertyRequest {
  title?: string;
  description?: string;
  price?: number;
  images: string[]; // public_ids (existing + new)
  removeImages?: boolean;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  propertyType?: string;
  address?: Partial<{
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }>;
  amenities?: Record<string, boolean>;
  featured?: boolean;
}
