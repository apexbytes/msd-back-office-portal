export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory =
  | 'TECH_SUPPORT'
  | 'PERMISSION_REQUEST'
  | 'BILLING_INQUIRY'
  | 'GENERAL_QUESTION';

export interface SupportTicketUser {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
}

export interface SupportTicketAssignee {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: Date;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    avatar?: string;
  };
}

export interface SupportTicket {
  id: string;
  ticketUid: string;
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: SupportTicketUser;
  assignee?: SupportTicketAssignee;
  messages?: TicketMessage[];
}
