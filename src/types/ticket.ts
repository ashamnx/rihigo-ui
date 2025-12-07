// Ticket Types for Support & Ticketing System

// Status workflow: open → in_progress → resolved → closed
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type TicketCategory =
  | 'booking_issue'
  | 'refund'
  | 'inquiry'
  | 'complaint'
  | 'technical'
  | 'payment'
  | 'other';

export type TicketSenderType = 'user' | 'guest' | 'admin' | 'vendor' | 'system';

// Main Ticket interface
export interface Ticket {
  id: string;
  ticket_number: string; // Format: TKT-YYYYMM-000001
  user_id?: string;
  guest_email?: string;
  guest_name?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_vendor_id?: string;
  assigned_vendor_name?: string;
  related_booking_id?: string;
  related_activity_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  messages?: TicketMessage[];
  // Expanded relations
  user?: {
    id: string;
    name: string;
    email: string;
  };
  booking?: {
    id: string;
    booking_number: string;
    activity_title: string;
  };
  activity?: {
    id: string;
    title: string;
    slug: string;
  };
}

// Ticket Message interface
export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: TicketSenderType;
  sender_id?: string;
  sender_name?: string;
  sender_email?: string;
  message: string;
  is_internal: boolean; // Internal notes not visible to users/guests
  created_at: string;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  content_type: string;
  size: number;
}

// Input types for creating tickets
export interface CreateTicketInput {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  related_booking_id?: string;
  related_activity_id?: string;
}

export interface GuestCreateTicketInput extends CreateTicketInput {
  guest_name: string;
  guest_email: string;
}

// Input types for updating tickets
export interface UpdateTicketInput {
  priority?: TicketPriority;
  category?: TicketCategory;
}

export interface UpdateTicketStatusInput {
  status: TicketStatus;
}

export interface AssignTicketInput {
  assigned_to?: string; // Admin user ID
  assigned_vendor_id?: string; // Vendor ID
}

// Input for adding messages
export interface AddTicketMessageInput {
  message: string;
  is_internal?: boolean; // Only for admin/vendor
}

export interface GuestAddMessageInput {
  message: string;
  guest_email: string;
}

// Filter types for listing
export interface TicketFilters {
  page?: number;
  page_size?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  assigned_vendor_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Summary/Statistics types
export interface TicketSummary {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  by_category: Record<TicketCategory, number>;
  average_resolution_time_hours?: number;
}

// Helper constants for UI
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'badge-info',
  in_progress: 'badge-warning',
  resolved: 'badge-success',
  closed: 'badge-ghost',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'badge-ghost',
  medium: 'badge-info',
  high: 'badge-warning',
  critical: 'badge-error',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  booking_issue: 'Booking Issue',
  refund: 'Refund Request',
  inquiry: 'General Inquiry',
  complaint: 'Complaint',
  technical: 'Technical Issue',
  payment: 'Payment Issue',
  other: 'Other',
};
