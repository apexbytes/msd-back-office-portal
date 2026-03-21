import { User } from './user.model';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory =
  | 'TECH_SUPPORT'
  | 'PERMISSION_REQUEST'
  | 'BILLING_INQUIRY'
  | 'GENERAL_QUESTION';

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: string | Date;
  user?: Partial<User>;
}

export interface SupportTicket {
  id: string;
  ticketUid: string;
  userId?: string | null;
  guestEmail?: string | null;
  guestMobile?: string | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string | null;
  resolvedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;

  user?: Partial<User>;
  assignee?: Partial<User>;
  messages?: TicketMessage[];
}
