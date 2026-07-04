import { APPROVER, validateQuotePrice } from './data/catalog';
import {
  architectureComparison,
  dunningLadder,
  initialActivity,
  initialAR,
  initialCustomers,
  initialDisputes,
  initialFieldTickets,
  initialInvoices,
  initialKpis,
  initialOnboardings,
  initialOrders,
  openDecisions,
  initialQuotes,
  initialRecoveryPlans,
  programGates,
  programMeta,
  workstreams,
} from './data/initialData';
import { getBacklogByCategory, recalculateKpis, runAutomatedDunning, updateInvoiceAging } from './store/kpiEngine';
import type {
  ActivityLog,
  ARAccount,
  Customer,
  CustomerOnboarding,
  Dispute,
  FieldTicketDoc,
  HoldReasonCategory,
  Invoice,
  KPI,
  ModalId,
  Order,
  Quote,
  QuoteLineItem,
  RecoveryPlan,
  Toast,
  ViewId,
  ProgramDecision,
} from './types';

interface AppState {
  quotes: Quote[];
  orders: Order[];
  invoices: Invoice[];
  onboardings: CustomerOnboarding[];
  customers: Customer[];
  arAccounts: ARAccount[];
  fieldTickets: FieldTicketDoc[];
  disputes: Dispute[];
  recoveryPlans: RecoveryPlan[];
  activity: ActivityLog[];
  kpis: KPI[];
  currentView: ViewId;
  modal: ModalId;
  selectedId: string | null;
  toasts: Toast[];
  quoteSeq: number;
  orderSeq: number;
  invoiceSeq: number;
  onboardingSeq: number;
  ticketSeq: number;
  disputeSeq: number;
}

type Listener = () => void;

const state: AppState = {
  quotes: [...initialQuotes],
  orders: [...initialOrders],
  invoices: [...initialInvoices],
  onboardings: [...initialOnboardings],
  customers: [...initialCustomers],
  arAccounts: [...initialAR],
  fieldTickets: [...initialFieldTickets],
  disputes: [...initialDisputes],
  recoveryPlans: [...initialRecoveryPlans],
  activity: [...initialActivity],
  kpis: [...initialKpis],
  currentView: 'dashboard',
  modal: null,
  selectedId: null,
  toasts: [],
  quoteSeq: 204,
  orderSeq: 8911,
  invoiceSeq: 44103,
  onboardingSeq: 42,
  ticketSeq: 2292,
  disputeSeq: 2,
};

const listeners: Listener[] = [];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(date: string): number {
  const d = new Date(date + 'T00:00:00');
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function log(message: string, entityType: ActivityLog['entityType'], entityId: string): void {
  state.activity.unshift({
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toLocaleString(),
    message,
    entityType,
    entityId,
  });
  if (state.activity.length > 30) state.activity.pop();
}

function toast(type: Toast['type'], message: string): void {
  const t: Toast = { id: `T-${Date.now()}`, type, message };
  state.toasts.push(t);
  setTimeout(() => {
    state.toasts = state.toasts.filter((x) => x.id !== t.id);
    notify();
  }, 4000);
}

function notify(): void {
  updateInvoiceAging(state.invoices);
  runAutomatedDunning(state.invoices, (msg, entityId) => log(msg, 'invoice', entityId));
  recalculateKpis(state);
  listeners.forEach((l) => l());
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function getState(): Readonly<AppState> {
  return state;
}

export function getProgramMeta() {
  return programMeta;
}

export function getKpis() {
  return state.kpis;
}

export function getProgramGates() {
  return programGates;
}

export function getWorkstreams() {
  return workstreams;
}

export function getOpenDecisions(): ProgramDecision[] {
  return openDecisions;
}

export function getArchitectureComparison() {
  return architectureComparison;
}

export function getDunningLadder() {
  return dunningLadder;
}

export function setView(view: ViewId): void {
  state.currentView = view;
  state.modal = null;
  state.selectedId = null;
  notify();
}

export function openModal(modal: ModalId, selectedId?: string): void {
  state.modal = modal;
  state.selectedId = selectedId ?? null;
  notify();
}

export function closeModal(): void {
  state.modal = null;
  state.selectedId = null;
  notify();
}

export function getCustomer(id: string): Customer | undefined {
  return state.customers.find((c) => c.id === id);
}

export function getQuote(id: string): Quote | undefined {
  return state.quotes.find((q) => q.id === id);
}

export function getOrder(id: string): Order | undefined {
  return state.orders.find((o) => o.id === id);
}

export function getOrderByQuote(quoteId: string): Order | undefined {
  return state.orders.find((o) => o.quoteId === quoteId);
}

export function getInvoice(id: string): Invoice | undefined {
  return state.invoices.find((i) => i.id === id);
}

export function getInvoiceByOrder(orderId: string): Invoice | undefined {
  return state.invoices.find((i) => i.orderId === orderId);
}

export function getOnboardingByCustomer(customerId: string): CustomerOnboarding | undefined {
  return state.onboardings.find((o) => o.customerId === customerId);
}

export function isOnboardingApproved(customerId: string): boolean {
  const o = getOnboardingByCustomer(customerId);
  return o?.status === 'approved';
}

// --- Quote-to-Order actions ---

export function createQuote(data: {
  customerId: string;
  vertical: string;
  lineItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discountPct: number;
  }>;
}): void {
  const customer = getCustomer(data.customerId);
  if (!customer) {
    toast('error', 'Customer not found');
    return;
  }
  if (!data.lineItems.length) {
    toast('error', 'Add at least one quote item');
    return;
  }
  const lineItems: QuoteLineItem[] = data.lineItems.map((item) => {
    const lineAmount = Math.round(item.quantity * item.unitPrice * (1 - item.discountPct / 100));
    return {
      ...item,
      lineAmount,
      pricingError: validateQuotePrice(item.productId, item.unitPrice),
    };
  });
  const amount = lineItems.reduce((sum, item) => sum + item.lineAmount, 0);
  const pricingError =
    lineItems
      .filter((item) => item.pricingError)
      .map((item) => item.pricingError)
      .join(' | ') || undefined;
  const id = `Q-2026-${String(++state.quoteSeq).padStart(4, '0')}`;
  const createdDate = today();
  const primaryItem = lineItems[0];
  const quote: Quote = {
    id,
    customerId: data.customerId,
    customer: customer.name,
    vertical: data.vertical,
    productId: primaryItem.productId,
    product:
      lineItems.length === 1
        ? `${primaryItem.productName} (${primaryItem.quantity} ${primaryItem.quantity === 1 ? 'unit' : 'units'})`
        : `${primaryItem.productName} + ${lineItems.length - 1} more item${lineItems.length > 2 ? 's' : ''}`,
    quantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
    unitPrice: primaryItem.unitPrice,
    amount,
    status: pricingError ? 'stuck' : 'draft',
    createdDate,
    daysOpen: 0,
    lineItems,
    pricingError,
    discountPct: 0,
  };
  state.quotes.unshift(quote);
  log(`Quote ${id} created for ${customer.name} — ${pricingError ? 'pricing error flagged' : 'draft'}`, 'quote', id);
  toast(pricingError ? 'error' : 'success', pricingError ? `Quote created but stuck: ${pricingError}` : `Quote ${id} created as draft`);
  closeModal();
  state.currentView = 'quotes';
  notify();
}

export function submitQuoteForApproval(quoteId: string): void {
  const quote = getQuote(quoteId);
  if (!quote) return;
  if (quote.status !== 'draft') {
    toast('error', 'Only draft quotes can be submitted');
    return;
  }
  if (quote.pricingError) {
    quote.status = 'stuck';
    toast('error', `Cannot submit — fix pricing: ${quote.pricingError}`);
    notify();
    return;
  }
  quote.status = 'pending_approval';
  quote.approver = APPROVER;
  log(`Quote ${quoteId} submitted for approval`, 'quote', quoteId);
  toast('info', `Quote ${quoteId} sent to ${APPROVER} for approval`);
  notify();
}

export function approveQuote(quoteId: string): void {
  const quote = getQuote(quoteId);
  if (!quote) return;
  if (quote.status !== 'pending_approval') {
    toast('error', 'Quote is not pending approval');
    return;
  }
  quote.status = 'approved';
  log(`Quote ${quoteId} approved by ${APPROVER}`, 'quote', quoteId);
  toast('success', `Quote ${quoteId} approved`);
  notify();
}

export function fixQuotePricing(quoteId: string): void {
  const quote = getQuote(quoteId);
  if (!quote) return;
  if (quote.lineItems?.length) {
    quote.lineItems = quote.lineItems.map((item) => {
      const needsCorrection = Boolean(validateQuotePrice(item.productId, item.unitPrice));
      const unitPrice = needsCorrection ? 135 : item.unitPrice;
      return {
        ...item,
        unitPrice,
        lineAmount: Math.round(item.quantity * unitPrice * (1 - item.discountPct / 100)),
        pricingError: undefined,
      };
    });
    quote.amount = quote.lineItems.reduce((sum, item) => sum + item.lineAmount, 0);
    quote.quantity = quote.lineItems.reduce((sum, item) => sum + item.quantity, 0);
    quote.unitPrice = quote.lineItems[0]?.unitPrice ?? quote.unitPrice;
  } else {
    quote.unitPrice = 135;
    quote.amount = Math.round(quote.quantity * 135 * (1 - (quote.discountPct ?? 0) / 100));
  }
  quote.pricingError = undefined;
  quote.status = 'draft';
  log(`Quote ${quoteId} pricing corrected to $135/unit`, 'quote', quoteId);
  toast('success', 'Pricing corrected — quote returned to draft');
  notify();
}

export function convertQuoteToOrder(quoteId: string): void {
  const quote = getQuote(quoteId);
  if (!quote) return;
  if (quote.status !== 'approved') {
    toast('error', 'Quote must be approved before converting to order');
    return;
  }
  if (!isOnboardingApproved(quote.customerId)) {
    toast('error', 'Customer onboarding must be approved before order submission');
    return;
  }
  if (getOrderByQuote(quoteId)) {
    toast('error', 'Order already exists for this quote');
    return;
  }
  const customer = getCustomer(quote.customerId);
  const id = `ORD-${++state.orderSeq}`;
  const order: Order = {
    id,
    quoteId,
    customerId: quote.customerId,
    customer: quote.customer,
    amount: quote.amount,
    status: 'submitted',
    submittedDate: today(),
    fieldTicketsRequired: customer?.fieldTicketsRequired ?? 1,
    fieldTicketsUploaded: 0,
  };
  quote.status = 'converted';
  state.orders.unshift(order);
  log(`Order ${id} created from quote ${quoteId}`, 'order', id);
  toast('success', `Order ${id} created — fulfillment started`);
  state.currentView = 'orders';
  notify();
}

// --- Onboarding actions ---

export function createOnboarding(data: {
  customerId: string;
  country: string;
  taxId: string;
  achConfirmed: boolean;
  signed: boolean;
}): void {
  const customer = getCustomer(data.customerId);
  if (!customer) {
    toast('error', 'Customer not found');
    return;
  }
  if (getOnboardingByCustomer(data.customerId)) {
    toast('error', 'Onboarding already exists for this customer');
    return;
  }
  const id = `ONB-${String(++state.onboardingSeq).padStart(4, '0')}`;
  const taxValidated = data.taxId.length >= 5;
  const creditCheck =
    customer.creditTier === 'high_value' || customer.creditTier === 'international' || customer.creditTier === 'new'
      ? 'deposit_required'
      : taxValidated
        ? 'passed'
        : 'pending';
  const allComplete = taxValidated && data.achConfirmed && data.signed;
  const onboarding: CustomerOnboarding = {
    id,
    customerId: data.customerId,
    customer: customer.name,
    country: data.country,
    status: allComplete ? 'pending_review' : 'incomplete',
    creditCheck,
    taxValidated,
    achConfirmed: data.achConfirmed,
    signed: data.signed,
    approver: APPROVER,
    submittedDate: today(),
    taxId: data.taxId,
  };
  customer.onboardingStatus = onboarding.status;
  state.onboardings.unshift(onboarding);
  log(`Onboarding ${id} submitted for ${customer.name}`, 'onboarding', id);
  toast('success', `Onboarding ${id} created — ${allComplete ? 'pending review' : 'incomplete fields remain'}`);
  closeModal();
  notify();
}

export function approveOnboarding(onboardingId: string): void {
  const ob = state.onboardings.find((o) => o.id === onboardingId);
  if (!ob) return;
  if (ob.status !== 'pending_review') {
    toast('error', 'Onboarding must be pending review');
    return;
  }
  if (!ob.taxValidated || !ob.achConfirmed || !ob.signed) {
    toast('error', 'All required fields must be complete');
    return;
  }
  ob.status = 'approved';
  const customer = getCustomer(ob.customerId);
  if (customer) customer.onboardingStatus = 'approved';
  log(`Onboarding ${onboardingId} approved — welcome packet sent`, 'onboarding', onboardingId);
  toast('success', `Customer ${ob.customer} approved — automated welcome packet sent`);
  notify();
}

// --- Order-to-Invoice actions ---

export function advanceOrderFulfillment(orderId: string): void {
  const order = getOrder(orderId);
  if (!order) return;
  if (order.status === 'held') {
    toast('error', `Order held: ${order.holdReason}`);
    return;
  }
  if (order.status === 'submitted') {
    order.status = 'fulfillment';
    log(`Order ${orderId} moved to fulfillment`, 'order', orderId);
    toast('info', `Order ${orderId} in fulfillment`);
  } else if (order.status === 'fulfillment') {
    if (order.fieldTicketsUploaded < order.fieldTicketsRequired) {
      toast('error', `Upload ${order.fieldTicketsRequired - order.fieldTicketsUploaded} more field ticket(s)`);
      return;
    }
    order.status = 'ready_to_bill';
    order.holdReason = undefined;
    log(`Order ${orderId} ready to bill`, 'order', orderId);
    toast('success', `Order ${orderId} ready to bill`);
  }
  notify();
}

export function uploadFieldTicket(orderId: string, fileName?: string, docType?: string): void {
  const order = getOrder(orderId);
  if (!order) return;
  const name = fileName ?? `FieldTicket-${orderId}-${state.fieldTickets.length + 1}.pdf`;
  const type = docType ?? 'Field Support Document';
  const doc: FieldTicketDoc = {
    id: `FT-${++state.ticketSeq}`,
    orderId,
    customerId: order.customerId,
    customer: order.customer,
    fileName: name,
    docType: type,
    uploadedDate: today(),
    uploadedBy: 'Current User',
  };
  state.fieldTickets.push(doc);
  order.fieldTicketsUploaded = state.fieldTickets.filter((t) => t.orderId === orderId).length;
  if (order.holdReason?.includes('field ticket') || order.holdReason?.includes('Missing')) {
    order.holdReason =
      order.fieldTicketsUploaded < order.fieldTicketsRequired
        ? `Missing field tickets — ${order.fieldTicketsUploaded}/${order.fieldTicketsRequired}`
        : undefined;
  }
  if (order.status === 'held' && order.fieldTicketsUploaded >= order.fieldTicketsRequired && isOnboardingApproved(order.customerId)) {
    order.status = 'fulfillment';
    order.holdReason = undefined;
  }
  log(`Document "${name}" uploaded for order ${orderId} (${order.fieldTicketsUploaded}/${order.fieldTicketsRequired})`, 'order', orderId);
  toast('success', `Field ticket uploaded — ${order.fieldTicketsUploaded}/${order.fieldTicketsRequired}`);
  notify();
}

export function getFieldTicketsForOrder(orderId: string): FieldTicketDoc[] {
  return state.fieldTickets.filter((t) => t.orderId === orderId);
}

export function releaseOrderHold(orderId: string): void {
  const order = getOrder(orderId);
  if (!order) return;
  if (!isOnboardingApproved(order.customerId)) {
    toast('error', 'Cannot release — customer onboarding not approved');
    return;
  }
  order.status = 'submitted';
  order.holdReason = undefined;
  log(`Hold released on order ${orderId}`, 'order', orderId);
  toast('success', `Order ${orderId} hold released`);
  notify();
}

// --- Invoicing actions ---

function isCleanOrder(order: Order): boolean {
  const docs = getFieldTicketsForOrder(order.id);
  return (
    order.fieldTicketsUploaded >= order.fieldTicketsRequired &&
    docs.length >= order.fieldTicketsRequired &&
    isOnboardingApproved(order.customerId) &&
    !order.holdReason
  );
}

function autoPostInvoice(invoice: Invoice, order: Order): void {
  const issued = today();
  invoice.status = 'posted';
  invoice.issuedDate = issued;
  invoice.dueDate = addDays(issued, 30);
  invoice.daysOutstanding = 0;
  invoice.dunningStage = 0;
  invoice.holdReason = undefined;
  invoice.revRecStatus = 'recognized';
  invoice.autoPosted = true;
  invoice.orderSubmittedDate = order.submittedDate;
  log(`Invoice ${invoice.id} auto-posted (clean order) — ASC 606 revenue recognized`, 'invoice', invoice.id);
}

export function generateInvoice(orderId: string): void {
  const order = getOrder(orderId);
  if (!order) return;
  if (order.status !== 'ready_to_bill') {
    toast('error', 'Order must be ready to bill');
    return;
  }
  if (getInvoiceByOrder(orderId)) {
    toast('error', 'Invoice already exists for this order');
    return;
  }
  const id = `INV-${++state.invoiceSeq}`;
  if (!isCleanOrder(order)) {
    const inv: Invoice = {
      id,
      orderId,
      customerId: order.customerId,
      customer: order.customer,
      amount: order.amount,
      status: 'held',
      holdReason: order.fieldTicketsUploaded < order.fieldTicketsRequired
        ? 'Missing required support documents'
        : order.holdReason ?? 'Exception — requires human review',
      holdCategory: order.fieldTicketsUploaded < order.fieldTicketsRequired ? 'missing_docs' : 'other',
      orderSubmittedDate: order.submittedDate,
    };
    state.invoices.unshift(inv);
    log(`Invoice ${id} routed to held queue — exception review required`, 'invoice', id);
    toast('error', `Invoice ${id} held — missing docs or exception`);
    state.currentView = 'backlog';
    notify();
    return;
  }
  const invoice: Invoice = {
    id,
    orderId,
    customerId: order.customerId,
    customer: order.customer,
    amount: order.amount,
    status: 'draft',
    revRecStatus: 'pending',
    orderSubmittedDate: order.submittedDate,
  };
  autoPostInvoice(invoice, order);
  state.invoices.unshift(invoice);
  toast('success', `Invoice ${id} auto-posted — clean order, revenue recognized`);
  state.currentView = 'invoices';
  notify();
}

export function postInvoice(invoiceId: string): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  if (invoice.status !== 'draft' && invoice.status !== 'held') {
    toast('error', 'Invoice cannot be posted from current status');
    return;
  }
  if (invoice.holdReason && invoice.status === 'held') {
    toast('error', `Cannot post — ${invoice.holdReason}`);
    return;
  }
  const issued = today();
  invoice.status = 'posted';
  invoice.issuedDate = issued;
  invoice.dueDate = addDays(issued, 30);
  invoice.daysOutstanding = 0;
  invoice.dunningStage = 0;
  invoice.holdReason = undefined;
  invoice.revRecStatus = 'recognized';
  invoice.autoPosted = false;
  log(`Invoice ${invoiceId} manually posted — ASC 606 revenue recognized`, 'invoice', invoiceId);
  toast('success', `Invoice ${invoiceId} posted and revenue recognized`);
  notify();
}

export function sendInvoice(invoiceId: string): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  if (invoice.status !== 'posted') {
    toast('error', 'Invoice must be posted before sending');
    return;
  }
  invoice.status = 'sent';
  log(`Invoice ${invoiceId} sent to customer`, 'invoice', invoiceId);
  toast('success', `Invoice ${invoiceId} delivered to customer`);
  notify();
}

export function releaseInvoiceHold(invoiceId: string): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  invoice.status = 'draft';
  invoice.holdReason = undefined;
  log(`Invoice ${invoiceId} released from held queue`, 'invoice', invoiceId);
  toast('success', `Invoice ${invoiceId} ready for posting`);
  notify();
}

// --- Collections actions ---

export function escalateDunning(invoiceId: string): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  if (!invoice.daysOutstanding || invoice.daysOutstanding < 60) {
    toast('error', 'Dunning applies to invoices 60+ days outstanding');
    return;
  }
  invoice.dunningStage = Math.min(4, (invoice.dunningStage ?? 0) + 1);
  if (invoice.dunningStage >= 3) invoice.status = 'overdue';
  const ar = state.arAccounts.find((a) => a.customerId === invoice.customerId);
  if (ar) {
    ar.dunningStage = invoice.dunningStage;
    ar.lastContact = today();
  }
  const stages = ['60-day email + statement', 'Escalated to sales rep', 'Escalated to CFO', 'Write-off evaluation'];
  log(`Dunning stage ${invoice.dunningStage} for ${invoice.customer}: ${stages[invoice.dunningStage - 1]}`, 'invoice', invoiceId);
  toast('info', `Dunning escalated — ${stages[(invoice.dunningStage ?? 1) - 1]}`);
  notify();
}

export function recordPayment(invoiceId: string): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  if (invoice.status === 'paid') {
    toast('info', 'Invoice already paid');
    return;
  }
  invoice.status = 'paid';
  invoice.daysOutstanding = 0;
  invoice.dunningStage = 0;
  const ar = state.arAccounts.find((a) => a.customerId === invoice.customerId);
  if (ar) {
    ar.balance = Math.max(0, ar.balance - invoice.amount);
    ar.current = Math.max(0, ar.current - invoice.amount);
  }
  log(`Payment recorded for invoice ${invoiceId} — ${invoice.customer}`, 'invoice', invoiceId);
  toast('success', `Payment of invoice ${invoiceId} recorded — cash collected`);
  notify();
}

// --- Backlog & tagging ---

export function tagInvoiceHold(invoiceId: string, category: HoldReasonCategory): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  invoice.holdCategory = category;
  log(`Invoice ${invoiceId} tagged: ${category}`, 'invoice', invoiceId);
  toast('info', `Hold reason tagged`);
  notify();
}

export function getBacklogSummary() {
  return getBacklogByCategory(state.invoices);
}

// --- Disputes ---

export function createDispute(invoiceId: string, reason: string): void {
  const invoice = getInvoice(invoiceId);
  if (!invoice) return;
  const id = `DSP-${String(++state.disputeSeq).padStart(3, '0')}`;
  const dispute: Dispute = {
    id,
    invoiceId,
    customerId: invoice.customerId,
    customer: invoice.customer,
    reason,
    status: 'open',
    openedDate: today(),
    assignedTo: 'Customer Success',
  };
  state.disputes.unshift(dispute);
  log(`Dispute ${id} opened for ${invoice.customer}: ${reason}`, 'invoice', invoiceId);
  toast('info', `Dispute ${id} created`);
  closeModal();
  state.currentView = 'disputes';
  notify();
}

export function investigateDispute(disputeId: string, rootCause: string): void {
  const d = state.disputes.find((x) => x.id === disputeId);
  if (!d) return;
  d.status = 'investigating';
  d.rootCause = rootCause;
  log(`Dispute ${disputeId} under investigation — root cause: ${rootCause}`, 'invoice', d.invoiceId);
  toast('info', 'Dispute moved to investigating');
  notify();
}

export function resolveDispute(disputeId: string): void {
  const d = state.disputes.find((x) => x.id === disputeId);
  if (!d) return;
  d.status = 'resolved';
  log(`Dispute ${disputeId} resolved for ${d.customer}`, 'invoice', d.invoiceId);
  toast('success', `Dispute ${disputeId} resolved`);
  notify();
}

// --- Recovery plans ---

export function executeRecovery(planId: string): void {
  const plan = state.recoveryPlans.find((p) => p.id === planId);
  if (!plan || plan.status === 'completed') return;
  const invoice = getInvoice(plan.invoiceId);
  if (!invoice) return;

  if (plan.customerId === 'CUST-001') {
    invoice.status = 'draft';
    invoice.holdReason = undefined;
    invoice.holdCategory = undefined;
    postInvoice(invoice.id);
    sendInvoice(invoice.id);
    plan.status = 'completed';
    log(`Silver Bow recovery complete — INV-44021 posted and sent`, 'invoice', invoice.id);
    toast('success', 'Silver Bow billed — recovery plan completed');
  } else if (plan.customerId === 'CUST-007') {
    invoice.holdReason = undefined;
    invoice.holdCategory = undefined;
    invoice.status = 'draft';
    postInvoice(invoice.id);
    plan.status = 'completed';
    log(`Apache → Vinson recovery — hold released and invoice posted`, 'invoice', invoice.id);
    toast('success', 'Apache → Vinson invoice posted');
  } else if (plan.customerId === 'CUST-006') {
    const dispute = state.disputes.find((d) => d.invoiceId === invoice.id);
    if (dispute && dispute.status !== 'resolved') {
      investigateDispute(dispute.id, 'Contract rate verified — partial credit applied');
    }
    escalateDunning(invoice.id);
    plan.status = 'completed';
    log(`Exxon recovery actions executed — dunning escalated`, 'invoice', invoice.id);
    toast('success', 'Exxon recovery plan executed');
  } else if (plan.customerId === 'CUST-004') {
    const dispute = state.disputes.find((d) => d.invoiceId === invoice.id);
    if (dispute) resolveDispute(dispute.id);
    plan.status = 'completed';
    log(`Diamondback dispute resolved per recovery plan`, 'invoice', invoice.id);
    toast('success', 'Diamondback recovery plan completed');
  }
  notify();
}

export function getRecoveryPlans() {
  return state.recoveryPlans;
}

export function getDisputes() {
  return state.disputes;
}

export function getFieldTickets() {
  return state.fieldTickets;
}

export function getLiveDso(): number {
  const kpi = state.kpis.find((k) => k.id === 'kpi-6');
  return parseInt(kpi?.current ?? '71', 10) || 71;
}

// --- Computed stats ---

export function getSummaryStats() {
  const unbilled = state.invoices
    .filter((i) => i.status === 'held' || i.status === 'draft')
    .reduce((s, i) => s + i.amount, 0);
  const overdue = state.invoices
    .filter((i) => i.status === 'overdue')
    .reduce((s, i) => s + i.amount, 0);
  const stuckQuotes = state.quotes.filter((q) => q.status === 'stuck').length;
  const heldOrders = state.orders.filter((o) => o.status === 'held').length;
  const totalAR = state.arAccounts.reduce((s, a) => s + a.balance, 0);
  const backlog = state.orders
    .filter((o) => o.status === 'held' || o.status === 'ready_to_bill')
    .reduce((s, o) => s + o.amount, 0);
  const openDisputes = state.disputes.filter((d) => d.status !== 'resolved').length;
  const dso = getLiveDso();
  const cei = (state as AppState & { _cei?: number })._cei ?? 65;
  return { unbilled, overdue, stuckQuotes, heldOrders, totalAR, backlog, openDisputes, dso, cei };
}

export function refreshQuoteAges(): void {
  state.quotes.forEach((q) => {
    q.daysOpen = daysSince(q.createdDate);
  });
}

export function getPipelineCounts() {
  return {
    quotes: state.quotes.filter((q) => q.status !== 'converted').length,
    pendingApproval: state.quotes.filter((q) => q.status === 'pending_approval').length,
    orders: state.orders.length,
    readyToBill: state.orders.filter((o) => o.status === 'ready_to_bill').length,
    invoices: state.invoices.length,
    overdue: state.invoices.filter((i) => i.status === 'overdue').length,
  };
}
