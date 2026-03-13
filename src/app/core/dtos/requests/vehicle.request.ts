export interface CreateVehicleRequest {
  title: string;
  description: string;
  price: number;
  makeId: string;
  modelId: string;
  year: number;
  images: string[]; // public_ids
  status: 'FOR_SALE' | 'SOLD' | 'DRAFT' | 'DELETED';
  transmission: 'AUTOMATIC' | 'MANUAL' | 'CVT';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER';
  condition: 'NEW' | 'USED';
  mileage: number;
  location: string;
  featured?: boolean;
  vin?: string;
  color?: string;
  engineCapacity?: number;
  bodyStyle?: string;
}

export interface UpdateVehicleRequest {
  title?: string;
  description?: string;
  price?: number;
  makeId?: string;
  modelId?: string;
  year?: number;
  images: string[]; // public_ids (existing + new)
  removeImages?: boolean;
  status?: string;
  transmission?: string;
  fuelType?: string;
  condition?: string;
  mileage?: number;
  location?: string;
  featured?: boolean;
  vin?: string;
  color?: string;
  engineCapacity?: number;
  bodyStyle?: string;
}
