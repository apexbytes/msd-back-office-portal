import { User } from './user.model';

export interface SupportTicket {
  id: string;
  ticketUid: string;
  userId: string;
  subject: string;
  description: string;
  category: 'TECH_SUPPORT' | 'PERMISSION_REQUEST' | 'BILLING_INQUIRY' | 'GENERAL_QUESTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
  assignedTo?: string; // Admin User ID
  messages?: TicketMessage[];
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: Partial<User>;
}
