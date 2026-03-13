import { FileUploadResult } from './common.model';

export interface Vehicle {
  id: string;
  title: string;
  slug: string;
  description: string;
  images: FileUploadResult[];
  price: number;
  year: number;
  makeId: string;
  modelId: string;
  make?: VehicleMake;
  model?: VehicleModel;
  transmission: 'AUTOMATIC' | 'MANUAL' | 'CVT';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'OTHER';
  condition: 'NEW' | 'USED';
  status: 'FOR_SALE' | 'SOLD' | 'DRAFT' | 'DELETED';
  mileage: number;
  location: string;
  featured: boolean;
  vin?: string;
  color?: string;
  engineCapacity?: number;
  bodyStyle?: string;
  postedBy: string;
}

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
  logoUrl: FileUploadResult | null;
  countryOfOrigin?: string;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  year: number;
  bodyStyles: string[];
}
