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

export interface Quote {
  id: string;
  customer: string;
  vertical: string;
  product: string;
  amount: number;
  status: QuoteStatus;
  createdDate: string;
  daysOpen: number;
  pricingError?: string;
  approver?: string;
}

export interface CustomerOnboarding {
  id: string;
  customer: string;
  country: string;
  status: OnboardingStatus;
  creditCheck: 'pending' | 'passed' | 'deposit_required';
  taxValidated: boolean;
  achConfirmed: boolean;
  signed: boolean;
  approver: string;
  submittedDate: string;
}

export interface Order {
  id: string;
  quoteId: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  submittedDate: string;
  fieldTicketsRequired: number;
  fieldTicketsUploaded: number;
  holdReason?: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  status: InvoiceStatus;
  issuedDate?: string;
  dueDate?: string;
  daysOutstanding?: number;
  holdReason?: string;
  dunningStage?: number;
}

export interface ARAccount {
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

export type ViewId = 'dashboard' | 'quotes' | 'orders' | 'invoices' | 'collections' | 'program';
