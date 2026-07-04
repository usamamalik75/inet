import { products, VERTICALS } from '../data/catalog';
import {
  getInvoiceByOrder,
  getOnboardingByCustomer,
  getOrderByQuote,
  getState,
} from '../store';
import type { Quote, Order, Invoice } from '../types';
import { formatCurrency, formatDate, statusClass, statusLabel } from '../utils';

export function linkEntity(type: string, id: string, label?: string): string {
  return `<button class="link-btn" data-nav-entity="${type}" data-entity-id="${id}">${label ?? id}</button>`;
}

export function actionBtn(action: string, id: string, label: string, variant = 'primary'): string {
  return `<button class="btn btn-${variant}" data-action="${action}" data-id="${id}">${label}</button>`;
}

export function renderBreadcrumb(items: { label: string; view?: string; entityId?: string }[]): string {
  return `<nav class="breadcrumb">${items
    .map((item, i) => {
      const sep = i > 0 ? '<span class="bc-sep">-></span>' : '';
      if (item.view) {
        return `${sep}<button class="link-btn" data-nav-view="${item.view}" data-entity-id="${item.entityId ?? ''}">${item.label}</button>`;
      }
      return `${sep}<span class="bc-current">${item.label}</span>`;
    })
    .join('')}</nav>`;
}

export function renderQuoteActions(q: Quote): string {
  const ob = getOnboardingByCustomer(q.customerId);
  const order = getOrderByQuote(q.id);
  const parts: string[] = [];

  if (q.status === 'draft') parts.push(actionBtn('submit-quote', q.id, 'Submit for Approval'));
  if (q.status === 'pending_approval') parts.push(actionBtn('approve-quote', q.id, 'Approve', 'success'));
  if (q.status === 'stuck') parts.push(actionBtn('fix-pricing', q.id, 'Fix Pricing ($135)', 'warning'));
  if (q.status === 'approved') parts.push(actionBtn('convert-order', q.id, 'Convert to Order', 'success'));
  if (!ob) parts.push(actionBtn('open-onboarding', q.customerId, 'Start Onboarding', 'secondary'));
  if (order) parts.push(linkEntity('order', order.id, `View Order ${order.id}`));

  return parts.length ? `<div class="action-row">${parts.join('')}</div>` : '';
}

export function renderOrderActions(o: Order): string {
  const invoice = getInvoiceByOrder(o.id);
  const parts: string[] = [];

  if (o.status === 'held') parts.push(actionBtn('release-order', o.id, 'Release Hold', 'warning'));
  if (o.status === 'submitted' || o.status === 'fulfillment') {
    parts.push(actionBtn('open-upload-document', o.id, 'Upload Document', 'secondary'));
    if (o.fieldTicketsUploaded >= o.fieldTicketsRequired && o.status === 'fulfillment') {
      parts.push(actionBtn('advance-order', o.id, 'Mark Ready to Bill', 'success'));
    } else if (o.status === 'submitted') {
      parts.push(actionBtn('advance-order', o.id, 'Start Fulfillment'));
    }
  }
  if (o.status === 'ready_to_bill' && !invoice) {
    parts.push(actionBtn('generate-invoice', o.id, 'Generate Invoice', 'success'));
  }
  if (invoice) parts.push(linkEntity('invoice', invoice.id, `View Invoice ${invoice.id}`));
  parts.push(linkEntity('quote', o.quoteId, `Quote ${o.quoteId}`));

  return `<div class="action-row">${parts.join('')}</div>`;
}

export function renderInvoiceActions(i: Invoice): string {
  const parts: string[] = [];
  if (i.status === 'draft') parts.push(actionBtn('post-invoice', i.id, 'Post Invoice', 'success'));
  if (i.status === 'held') parts.push(actionBtn('release-invoice', i.id, 'Release Hold', 'warning'));
  if (i.status === 'posted') parts.push(actionBtn('send-invoice', i.id, 'Send to Customer'));
  if (i.status === 'sent' || i.status === 'overdue') {
    parts.push(actionBtn('escalate-dunning', i.id, 'Escalate Dunning', 'warning'));
    parts.push(actionBtn('record-payment', i.id, 'Record Payment', 'success'));
    parts.push(actionBtn('open-create-dispute', i.id, 'Open Dispute', 'secondary'));
  }
  if (i.status === 'held') parts.push(actionBtn('open-tag-hold', i.id, 'Tag Hold Reason', 'secondary'));
  parts.push(linkEntity('order', i.orderId, `Order ${i.orderId}`));
  return `<div class="action-row">${parts.join('')}</div>`;
}

export function renderOnboardingActions(id: string, status: string): string {
  if (status === 'pending_review') {
    return `<div class="action-row">${actionBtn('approve-onboarding', id, 'Approve Customer', 'success')}</div>`;
  }
  return '';
}

export function renderPipeline(): string {
  const s = getState();
  const counts = {
    draft: s.quotes.filter((q) => q.status === 'draft' || q.status === 'pending_approval').length,
    approved: s.quotes.filter((q) => q.status === 'approved').length,
    orders: s.orders.filter((o) => o.status !== 'ready_to_bill').length,
    ready: s.orders.filter((o) => o.status === 'ready_to_bill').length,
    invoices: s.invoices.filter((i) => !['paid', 'sent'].includes(i.status)).length,
    ar: s.invoices.filter((i) => i.status === 'overdue').length,
  };
  return `
    <div class="pipeline">
      <button class="pipeline-step" data-nav-view="quotes"><span class="pipe-count">${counts.draft}</span><span class="pipe-label">Quotes</span></button>
      <span class="pipe-arrow">-></span>
      <button class="pipeline-step" data-nav-view="quotes"><span class="pipe-count">${counts.approved}</span><span class="pipe-label">Approved</span></button>
      <span class="pipe-arrow">-></span>
      <button class="pipeline-step" data-nav-view="orders"><span class="pipe-count">${counts.orders}</span><span class="pipe-label">Orders</span></button>
      <span class="pipe-arrow">-></span>
      <button class="pipeline-step" data-nav-view="orders"><span class="pipe-count">${counts.ready}</span><span class="pipe-label">Ready to Bill</span></button>
      <span class="pipe-arrow">-></span>
      <button class="pipeline-step" data-nav-view="invoices"><span class="pipe-count">${counts.invoices}</span><span class="pipe-label">Invoices</span></button>
      <span class="pipe-arrow">-></span>
      <button class="pipeline-step" data-nav-view="collections"><span class="pipe-count">${counts.ar}</span><span class="pipe-label">Collections</span></button>
    </div>`;
}

export function renderActivityFeed(): string {
  const { activity } = getState();
  return `
    <div class="activity-feed">
      ${activity
        .slice(0, 8)
        .map(
          (a) => `
        <div class="activity-item">
          <span class="activity-time">${a.timestamp}</span>
          <span class="activity-msg">${a.message}</span>
        </div>`
        )
        .join('')}
    </div>`;
}

export function renderToasts(): string {
  const { toasts } = getState();
  if (!toasts.length) return '';
  return `<div class="toast-container">${toasts
    .map((t) => `<div class="toast toast-${t.type}">${t.message}</div>`)
    .join('')}</div>`;
}

export function renderCreateQuoteModal(): string {
  const { customers } = getState();
  const customerOpts = customers
    .map((c) => `<option value="${c.id}">${c.name} (${c.vertical})</option>`)
    .join('');
  const productOpts = products
    .map((p) => `<option value="${p.id}" data-price="${p.unitPrice}" data-vertical="${p.vertical}" data-name="${p.name}">${p.name} - ${formatCurrency(p.unitPrice)}/${p.unit}</option>`)
    .join('');
  const verticalOpts = VERTICALS.map((v) => `<option value="${v}">${v}</option>`).join('');

  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Create New Quote</h2>
          <button class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form class="form" id="create-quote-form">
          <p class="form-hint">Opportunity -> Configure & Price -> Save as Draft in Salesforce CPQ</p>
          <label>Customer<select name="customerId" required>${customerOpts}</select></label>
          <label>Vertical<select name="vertical" required>${verticalOpts}</select></label>
          <label>Product<select name="productId" required id="product-select">${productOpts}</select></label>
          <div class="form-row">
            <label>Quantity<input type="number" name="quantity" value="1" min="1" required /></label>
            <label>Unit Price ($)<input type="number" name="unitPrice" id="unit-price" step="0.01" required /></label>
            <label>Discount %<input type="number" name="discountPct" value="0" min="0" max="50" /></label>
          </div>
          <div class="form-preview" id="quote-preview">Estimated total: $0</div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Quote (Draft)</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function renderCreateOnboardingModal(customerId?: string): string {
  const { customers } = getState();
  const customerOpts = customers
    .filter((c) => !getOnboardingByCustomer(c.id))
    .map((c) => `<option value="${c.id}" ${c.id === customerId ? 'selected' : ''}>${c.name}</option>`)
    .join('');

  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Customer Onboarding</h2>
          <button class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form class="form" id="create-onboarding-form">
          <p class="form-hint">Electronic onboarding with required-field validation, Avalara tax checks, ACH confirmation, and DocuSign e-signature</p>
          <label>Customer<select name="customerId" required>${customerOpts}</select></label>
          <label>Country<input name="country" value="US" required /></label>
          <label>Tax ID / EIN<input name="taxId" placeholder="XX-XXXXXXX" required /></label>
          <label class="checkbox-label"><input type="checkbox" name="achConfirmed" /> ACH payment confirmed</label>
          <label class="checkbox-label"><input type="checkbox" name="signed" /> E-signature completed</label>
          <div class="info-box"><strong>Approval Gate:</strong> No order or shipment until Demi (interim) approves.</div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Onboarding</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function renderDetailModal(): string {
  const { modal, selectedId } = getState();
  if (!selectedId) return '';

  if (modal === 'quote-detail') {
    const q = getState().quotes.find((x) => x.id === selectedId);
    if (!q) return '';
    const order = getOrderByQuote(q.id);
    const ob = getOnboardingByCustomer(q.customerId);
    const invoice = order ? getInvoiceByOrder(order.id) : undefined;
    const crumbs: { label: string; view?: string; entityId?: string }[] = [{ label: 'Quotes', view: 'quotes' }, { label: q.id }];
    if (order) crumbs.push({ label: order.id, view: 'orders', entityId: order.id });
    if (invoice) crumbs.push({ label: invoice.id, view: 'invoices', entityId: invoice.id });

    return `
      <div class="modal-overlay" data-action="close-modal">
        <div class="modal modal-lg" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2>Quote Detail - ${q.id}</h2>
            <button class="modal-close" data-action="close-modal">&times;</button>
          </div>
          ${renderBreadcrumb(crumbs)}
          <div class="detail-grid">
            <div><span class="detail-label">Customer</span><span>${q.customer}</span></div>
            <div><span class="detail-label">Product</span><span>${q.product}</span></div>
            <div><span class="detail-label">Amount</span><span>${formatCurrency(q.amount)}</span></div>
            <div><span class="detail-label">Status</span><span class="badge ${statusClass(q.status)}">${statusLabel(q.status)}</span></div>
            <div><span class="detail-label">Onboarding</span><span>${ob ? `<span class="badge ${statusClass(ob.status)}">${statusLabel(ob.status)}</span>` : '<span class="text-danger">Not started</span>'}</span></div>
            <div><span class="detail-label">Created</span><span>${formatDate(q.createdDate)} (${q.daysOpen}d open)</span></div>
          </div>
          ${q.pricingError ? `<div class="alert alert-danger">${q.pricingError}</div>` : ''}
          ${renderQuoteActions(q)}
        </div>
      </div>`;
  }

  return '';
}

export function renderUploadDocumentModal(orderId?: string): string {
  const { orders } = getState();
  const orderOpts = orders
    .map((o) => `<option value="${o.id}" ${o.id === orderId ? 'selected' : ''}>${o.id} - ${o.customer}</option>`)
    .join('');
  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Upload Field Ticket / Support Document</h2>
          <button class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form class="form" id="upload-document-form">
          <p class="form-hint">Single document location per customer - required before the order can be invoiced in Sage Intacct</p>
          <label>Order<select name="orderId" required>${orderOpts}</select></label>
          <label>Document Type<select name="docType">
            <option>Install Report</option>
            <option>Site Survey</option>
            <option>Customer Sign-off</option>
            <option>Deployment Record</option>
            <option>Support Documentation</option>
          </select></label>
          <label>File Name<input name="fileName" placeholder="Customer-Report.pdf" required /></label>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Upload Document</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function renderCreateDisputeModal(invoiceId?: string): string {
  const { invoices } = getState();
  const invOpts = invoices
    .filter((i) => i.status !== 'paid')
    .map((i) => `<option value="${i.id}" ${i.id === invoiceId ? 'selected' : ''}>${i.id} - ${i.customer} (${i.amount})</option>`)
    .join('');
  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Open Billing Dispute</h2>
          <button class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form class="form" id="create-dispute-form">
          <p class="form-hint">Track dispute root causes with Customer Success (WS3)</p>
          <label>Invoice<select name="invoiceId" required>${invOpts}</select></label>
          <label>Reason<textarea name="reason" rows="3" required placeholder="Describe the billing dispute..."></textarea></label>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Open Dispute</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function renderTagHoldModal(invoiceId?: string): string {
  const { invoices } = getState();
  const inv = invoices.find((i) => i.id === invoiceId);
  const categories = Object.entries(
    { missing_docs: 'Missing Field Tickets / Support Docs', pricing_error: 'Pricing Discrepancy', onboarding_pending: 'Onboarding Not Approved', unbilled_recovery: 'Unbilled / Recovery', support_docs: 'Missing Support Documentation', other: 'Other' }
  )
    .map(([k, v]) => `<option value="${k}" ${inv?.holdCategory === k ? 'selected' : ''}>${v}</option>`)
    .join('');
  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Tag Hold Reason</h2>
          <button class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form class="form" id="tag-hold-form">
          <input type="hidden" name="invoiceId" value="${invoiceId ?? ''}" />
          <p class="form-hint">Pareto backlog analysis - tag held invoices by root cause</p>
          <label>Hold Category<select name="category" required>${categories}</select></label>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Tag</button>
          </div>
        </form>
      </div>
    </div>`;
}

export function pageActions(buttons: string): string {
  return `<div class="page-actions">${buttons}</div>`;
}
