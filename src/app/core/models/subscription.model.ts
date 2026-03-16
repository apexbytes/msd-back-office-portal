export interface Subscription {
  id: string;
  userId: string;
  type: 'VEHICLE' | 'PROPERTY';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  durationMonths: number;
  uploadLimit: number;
  currentUsage: number;
  startDate: string | Date;
  endDate: string | Date;
  grantedBy: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}
