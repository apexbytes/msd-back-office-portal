export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  createdAt: string;
}
