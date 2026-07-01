export type QuoteStatus = 'draft' | 'pending_approval' | 'approved' | 'stuck' | 'converted';
export type OrderStatus = 'new' | 'submitted' | 'fulfillment' | 'ready_to_bill' | 'held';
export type InvoiceStatus = 'draft' | 'held' | 'posted' | 'sent' | 'overdue' | 'paid';
export type OnboardingStatus = 'incomplete' | 'pending_review' | 'approved' | 'rejected';
export type GateStatus = 'pending' | 'passed' | 'current';

export interface KPI {
  id: string;
  stage: string;
  owner: string;
  metric: string;
  baseline: string;
  target: string;
  current: string;
  trend: 'up' | 'down' | 'flat';
  healthy: boolean;
}

export interface Product {
  id: string;
  name: string;
  vertical: string;
  unitPrice: number;
  unit: string;
  requiresFieldTickets: number;
  approvedBulkRate?: number;
}

export interface Customer {
  id: string;
  name: string;
  vertical: string;
  country: string;
  onboardingStatus: OnboardingStatus | 'none';
  fieldTicketsRequired: number;
  creditTier: 'standard' | 'high_value' | 'international' | 'new';
  systemsSynced: { salesforce: boolean; intacct: boolean; cloudCore: boolean };
  notes: string;
}

export interface Quote {
  id: string;
  customerId: string;
  customer: string;
  vertical: string;
  productId: string;
  product: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: QuoteStatus;
  createdDate: string;
  daysOpen: number;
  pricingError?: string;
  approver?: string;
  discountPct?: number;
}

export interface CustomerOnboarding {
  id: string;
  customerId: string;
  customer: string;
  country: string;
  status: OnboardingStatus;
  creditCheck: 'pending' | 'passed' | 'deposit_required';
  taxValidated: boolean;
  achConfirmed: boolean;
  signed: boolean;
  approver: string;
  submittedDate: string;
  taxId?: string;
}

export interface Order {
  id: string;
  quoteId: string;
  customerId: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  submittedDate: string;
  fieldTicketsRequired: number;
  fieldTicketsUploaded: number;
  holdReason?: string;
}

export type HoldReasonCategory =
  | 'missing_docs'
  | 'pricing_error'
  | 'onboarding_pending'
  | 'unbilled_recovery'
  | 'support_docs'
  | 'other';

export interface Invoice {
  id: string;
  orderId: string;
  customerId: string;
  customer: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate?: string;
  dueDate?: string;
  daysOutstanding?: number;
  holdReason?: string;
  holdCategory?: HoldReasonCategory;
  dunningStage?: number;
  revRecStatus?: 'pending' | 'recognized';
  autoPosted?: boolean;
  orderSubmittedDate?: string;
}

export interface FieldTicketDoc {
  id: string;
  orderId: string;
  customerId: string;
  customer: string;
  fileName: string;
  docType: string;
  uploadedDate: string;
  uploadedBy: string;
}

export interface Dispute {
  id: string;
  invoiceId: string;
  customerId: string;
  customer: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved';
  rootCause?: string;
  openedDate: string;
  assignedTo: string;
}

export interface RecoveryPlan {
  id: string;
  customerId: string;
  customer: string;
  invoiceId: string;
  issue: string;
  status: 'active' | 'completed';
  owner: string;
  action: string;
}

export interface ARAccount {
  customerId: string;
  customer: string;
  balance: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120Plus: number;
  lastContact: string;
  dunningStage: number;
}

export interface ProgramGate {
  id: string;
  name: string;
  when: string;
  status: GateStatus;
  owner: string;
  criteria: string[];
}

export interface Workstream {
  id: string;
  name: string;
  lead: string;
  phase: string;
  progress: number;
  nearTermActions: string[];
}

export interface ProgramDecision {
  id: string;
  title: string;
  owner: string;
  status: 'open' | 'pending' | 'decided';
  summary: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  entityType: 'quote' | 'order' | 'invoice' | 'onboarding' | 'customer';
  entityId: string;
}

export type ViewId =
  | 'dashboard'
  | 'quotes'
  | 'orders'
  | 'invoices'
  | 'backlog'
  | 'collections'
  | 'disputes'
  | 'customers'
  | 'catalog'
  | 'program';

export type ModalId =
  | 'create-quote'
  | 'create-onboarding'
  | 'quote-detail'
  | 'order-detail'
  | 'upload-document'
  | 'create-dispute'
  | 'tag-hold'
  | null;

export const HOLD_CATEGORY_LABELS: Record<HoldReasonCategory, string> = {
  missing_docs: 'Missing Field Tickets / Support Docs',
  pricing_error: 'Pricing Discrepancy',
  onboarding_pending: 'Onboarding Not Approved',
  unbilled_recovery: 'Unbilled / Recovery',
  support_docs: 'Missing Support Documentation',
  other: 'Other',
};

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
