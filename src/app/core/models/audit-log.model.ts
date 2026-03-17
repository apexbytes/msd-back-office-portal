export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  companyName?: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  user?: AuditLogUser;
}
