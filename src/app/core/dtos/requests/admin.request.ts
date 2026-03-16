export interface GrantSubscriptionRequest {
  type: 'VEHICLE' | 'PROPERTY';
  durationMonths: number;
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

/**
 * Request payload for admin moderation actions (e.g., approving, rejecting, or featuring listings).
 * Properties are optional because an admin might update just the status, just the featured flag, or both.
 */
export interface AdminStatusUpdateRequest {
  /**
   * The new status to apply to the resource.
   * e.g., 'ACTIVE', 'PENDING', 'REJECTED', 'SOLD', 'SUSPENDED'
   */
  status?: string;

  /**
   * Whether the resource should be promoted/featured on the platform.
   */
  featured?: boolean;

  /**
   * Optional reason provided by the admin (useful for rejections or suspensions).
   */
  reason?: string;
}
