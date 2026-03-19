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
  user?: User;
}

export interface SupportTicket {
  id: string;
  userId?: string | null;
  email?: string;
  mobileNumber?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;

  user?: User;
  assignee?: User;
  messages?: TicketMessage[];
}
