export interface GrantSubscriptionRequest {
  type: 'VEHICLE' | 'PROPERTY';
  duration: number; // e.g., in days
  uploadLimit: number;
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  type: 'ADMIN' | 'CLIENT' | 'USER';
  permissionIds: number[];
}

export interface UpdateUserStatusRequest {
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}
