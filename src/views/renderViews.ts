import {
  architectureComparison,
  arAccounts,
  dunningLadder,
  invoices,
  kpis,
  onboardings,
  orders,
  programGates,
  programMeta,
  quotes,
  workstreams,
} from '../data/mockData';
import type { ViewId } from '../types';
import { formatCurrency, formatDate, statusClass, statusLabel } from '../utils';

function renderKpiCards(): string {
  return kpis
    .map(
      (k) => `
    <div class="kpi-card ${k.healthy ? 'kpi-healthy' : 'kpi-at-risk'}">
      <div class="kpi-stage">${k.stage}</div>
      <div class="kpi-metric">${k.metric}</div>
      <div class="kpi-values">
        <span class="kpi-current">${k.current}</span>
        <span class="kpi-target">Target: ${k.target}</span>
      </div>
      <div class="kpi-meta">
        <span>Baseline: ${k.baseline}</span>
        <span class="trend trend-${k.trend}">${k.trend === 'down' && k.metric.includes('DSO') ? '↓ Improving' : k.trend === 'down' ? '↓ Improving' : k.trend === 'up' ? '↑ Improving' : '→ Flat'}</span>
      </div>
    </div>`
    )
    .join('');
}

function renderArchitectureComparison(): string {
  const { thirdParty, custom } = architectureComparison;
  return `
    <div class="compare-grid">
      <div class="compare-card compare-third">
        <h3>${thirdParty.label}</h3>
        <ul>${thirdParty.systems.map((s) => `<li>${s}</li>`).join('')}</ul>
        <div class="compare-pros"><strong>Pros:</strong> ${thirdParty.pros.join('; ')}</div>
        <div class="compare-cons"><strong>Cons:</strong> ${thirdParty.cons.join('; ')}</div>
      </div>
      <div class="compare-card compare-custom">
        <h3>${custom.label}</h3>
        <ul>${custom.systems.map((s) => `<li>${s}</li>`).join('')}</ul>
        <div class="compare-pros"><strong>Pros:</strong> ${custom.pros.join('; ')}</div>
        <div class="compare-cons"><strong>Cons:</strong> ${custom.cons.join('; ')}</div>
      </div>
    </div>`;
}

function renderSummaryStats(): string {
  const unbilled = invoices.filter((i) => i.status === 'held' || i.status === 'draft').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
  const stuckQuotes = quotes.filter((q) => q.status === 'stuck').length;
  const heldOrders = orders.filter((o) => o.status === 'held').length;

  return `
    <div class="stat-row">
      <div class="stat-card stat-danger"><div class="stat-value">${formatCurrency(unbilled)}</div><div class="stat-label">Unbilled / Held</div></div>
      <div class="stat-card stat-warning"><div class="stat-value">${formatCurrency(overdue)}</div><div class="stat-label">Overdue AR</div></div>
      <div class="stat-card stat-info"><div class="stat-value">71 days</div><div class="stat-label">Current DSO</div></div>
      <div class="stat-card stat-neutral"><div class="stat-value">${stuckQuotes + heldOrders}</div><div class="stat-label">Stuck Quotes + Held Orders</div></div>
    </div>`;
}

export function renderDashboard(): string {
  return `
    <header class="page-header">
      <div>
        <h1>Q2C Command Center</h1>
        <p class="subtitle">Custom in-house platform — ${programMeta.currentMonth} of 9-month program</p>
      </div>
      <div class="header-badge">${programMeta.cloudCoreStatus}</div>
    </header>
    ${renderSummaryStats()}
    <section class="section">
      <h2>Architecture: Third-Party vs Custom Build</h2>
      <p class="section-desc">The client document proposes Salesforce + Sage Intacct. This prototype shows how the same Q2C flows look on a unified custom platform.</p>
      ${renderArchitectureComparison()}
    </section>
    <section class="section">
      <h2>Program KPIs</h2>
      <div class="kpi-grid">${renderKpiCards()}</div>
    </section>`;
}

export function renderQuotes(): string {
  const quoteRows = quotes
    .map(
      (q) => `
    <tr>
      <td><strong>${q.id}</strong></td>
      <td>${q.customer}</td>
      <td>${q.vertical}</td>
      <td>${q.product}</td>
      <td>${formatCurrency(q.amount)}</td>
      <td><span class="badge ${statusClass(q.status)}">${statusLabel(q.status)}</span></td>
      <td>${q.daysOpen}d</td>
      <td>${q.pricingError ? `<span class="text-danger">${q.pricingError}</span>` : q.approver ?? '—'}</td>
    </tr>`
    )
    .join('');

  const onboardingRows = onboardings
    .map(
      (o) => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}</td>
      <td>${o.country}</td>
      <td><span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
      <td>${o.taxValidated ? '✓' : '✗'} Tax</td>
      <td>${o.achConfirmed ? '✓' : '✗'} ACH</td>
      <td>${o.signed ? '✓' : '✗'} Signed</td>
      <td>${o.approver}</td>
    </tr>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Quote-to-Order</h1>
        <p class="subtitle">WS1 — Lead: Hector Maytorena · Custom CPQ + Onboarding Module</p>
      </div>
    </header>
    <div class="flow-banner">
      <span>Opportunity</span><span class="flow-arrow">→</span>
      <span>Configure & Price</span><span class="flow-arrow">→</span>
      <span>Approve</span><span class="flow-arrow">→</span>
      <span>Onboard Customer</span><span class="flow-arrow">→</span>
      <span>Submit Order</span>
    </div>
    <section class="section">
      <h2>Active Quotes</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Quote ID</th><th>Customer</th><th>Vertical</th><th>Product</th><th>Amount</th><th>Status</th><th>Age</th><th>Notes</th></tr></thead>
          <tbody>${quoteRows}</tbody>
        </table>
      </div>
    </section>
    <section class="section">
      <h2>Customer Onboarding (Built-in — replaces FormAssembly + DocuSign)</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Country</th><th>Status</th><th>Tax</th><th>ACH</th><th>E-Sign</th><th>Approver</th></tr></thead>
          <tbody>${onboardingRows}</tbody>
        </table>
      </div>
      <div class="info-box">
        <strong>Approval Gate:</strong> No order or shipment until onboarding status = Approved. Demi serves as interim approver (Tracy departure).
      </div>
    </section>`;
}

export function renderOrders(): string {
  const orderRows = orders
    .map(
      (o) => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.quoteId}</td>
      <td>${o.customer}</td>
      <td>${formatCurrency(o.amount)}</td>
      <td><span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
      <td>${formatDate(o.submittedDate)}</td>
      <td>${o.fieldTicketsUploaded}/${o.fieldTicketsRequired}</td>
      <td>${o.holdReason ? `<span class="text-danger">${o.holdReason}</span>` : '—'}</td>
    </tr>`
    )
    .join('');

  const backlogTotal = orders
    .filter((o) => o.status === 'held' || o.status === 'ready_to_bill')
    .reduce((s, o) => s + o.amount, 0);

  return `
    <header class="page-header">
      <div>
        <h1>Order-to-Invoice</h1>
        <p class="subtitle">WS2 — Lead: Stan Hughey · Custom Order Mgmt + Invoicing Engine</p>
      </div>
      <div class="header-badge">Backlog: ${formatCurrency(backlogTotal)}</div>
    </header>
    <div class="flow-banner">
      <span>Order Submitted</span><span class="flow-arrow">→</span>
      <span>Fulfillment</span><span class="flow-arrow">→</span>
      <span>Field Tickets</span><span class="flow-arrow">→</span>
      <span>Invoice Generation</span><span class="flow-arrow">→</span>
      <span>Auto-Post / Exception</span>
    </div>
    <section class="section">
      <h2>Orders Pipeline</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order ID</th><th>Quote</th><th>Customer</th><th>Amount</th><th>Status</th><th>Submitted</th><th>Field Tickets</th><th>Hold Reason</th></tr></thead>
          <tbody>${orderRows}</tbody>
        </table>
      </div>
      <div class="info-box">
        <strong>Invoice Posting Rule:</strong> Invoices cannot post without required support documents. Per-customer requirements stored on account record.
      </div>
    </section>`;
}

export function renderInvoices(): string {
  const invoiceRows = invoices
    .map(
      (i) => `
    <tr>
      <td><strong>${i.id}</strong></td>
      <td>${i.orderId}</td>
      <td>${i.customer}</td>
      <td>${formatCurrency(i.amount)}</td>
      <td><span class="badge ${statusClass(i.status)}">${statusLabel(i.status)}</span></td>
      <td>${i.issuedDate ? formatDate(i.issuedDate) : '—'}</td>
      <td>${i.daysOutstanding !== undefined ? i.daysOutstanding + 'd' : '—'}</td>
      <td>${i.holdReason ?? '—'}</td>
    </tr>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Invoicing</h1>
        <p class="subtitle">Built-in Invoicing + ASC 606 Rev Rec (replaces Sage Intacct)</p>
      </div>
    </header>
    <section class="section">
      <h2>Invoice Queue</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Issued</th><th>Outstanding</th><th>Notes</th></tr></thead>
          <tbody>${invoiceRows}</tbody>
        </table>
      </div>
      <div class="info-box">
        <strong>Auto-Post Rules:</strong> Clean orders post automatically. Exceptions route to held queue for human review. Target issuance lag: ≤ 5 days.
      </div>
    </section>`;
}

export function renderCollections(): string {
  const arRows = arAccounts
    .map(
      (a) => `
    <tr>
      <td><strong>${a.customer}</strong></td>
      <td>${formatCurrency(a.balance)}</td>
      <td>${formatCurrency(a.current)}</td>
      <td>${formatCurrency(a.days30)}</td>
      <td>${formatCurrency(a.days60)}</td>
      <td>${formatCurrency(a.days90)}</td>
      <td>${formatCurrency(a.days120Plus)}</td>
      <td>Stage ${a.dunningStage}</td>
      <td>${formatDate(a.lastContact)}</td>
    </tr>`
    )
    .join('');

  const dunningRows = dunningLadder
    .map((d) => `<tr><td>${d.days}+ days</td><td>${d.action}</td><td>${d.owner}</td></tr>`)
    .join('');

  const totalAR = arAccounts.reduce((s, a) => s + a.balance, 0);

  return `
    <header class="page-header">
      <div>
        <h1>Invoice-to-Cash</h1>
        <p class="subtitle">WS3 — Lead: Steve Manz · Custom AR + Collections Module</p>
      </div>
      <div class="header-badge">Total AR: ${formatCurrency(totalAR)}</div>
    </header>
    <div class="flow-banner">
      <span>Invoice Sent</span><span class="flow-arrow">→</span>
      <span>Revenue Recognition</span><span class="flow-arrow">→</span>
      <span>Collections</span><span class="flow-arrow">→</span>
      <span>Dunning Ladder</span><span class="flow-arrow">→</span>
      <span>Cash Collected</span>
    </div>
    <section class="section">
      <h2>AR Aging</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Total</th><th>Current</th><th>1–30</th><th>31–60</th><th>61–90</th><th>120+</th><th>Dunning</th><th>Last Contact</th></tr></thead>
          <tbody>${arRows}</tbody>
        </table>
      </div>
    </section>
    <section class="section">
      <h2>Dunning Ladder (Enforced)</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Days Past Due</th><th>Action</th><th>Owner</th></tr></thead>
          <tbody>${dunningRows}</tbody>
        </table>
      </div>
    </section>`;
}

export function renderProgram(): string {
  const gateCards = programGates
    .map(
      (g) => `
    <div class="gate-card gate-${g.status}">
      <div class="gate-header">
        <span class="badge ${statusClass(g.status)}">${statusLabel(g.status)}</span>
        <span class="gate-when">${g.when}</span>
      </div>
      <h3>${g.name}</h3>
      <p class="gate-owner">Owner: ${g.owner}</p>
      <ul>${g.criteria.map((c) => `<li>${c}</li>`).join('')}</ul>
    </div>`
    )
    .join('');

  const wsCards = workstreams
    .map(
      (w) => `
    <div class="ws-card">
      <div class="ws-header">
        <h3>${w.name}</h3>
        <span class="ws-phase">${w.phase}</span>
      </div>
      <p class="ws-lead">Lead: ${w.lead}</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${w.progress}%"></div></div>
      <span class="progress-label">${w.progress}% complete</span>
      <ul class="ws-actions">${w.nearTermActions.map((a) => `<li>${a}</li>`).join('')}</ul>
    </div>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Program Governance</h1>
        <p class="subtitle">9-Month Compressed Timeline · Sponsor: ${programMeta.sponsor}</p>
      </div>
    </header>
    <section class="section">
      <h2>Decision Gates</h2>
      <div class="gate-grid">${gateCards}</div>
    </section>
    <section class="section">
      <h2>Workstreams</h2>
      <div class="ws-grid">${wsCards}</div>
    </section>`;
}

const viewRenderers: Record<ViewId, () => string> = {
  dashboard: renderDashboard,
  quotes: renderQuotes,
  orders: renderOrders,
  invoices: renderInvoices,
  collections: renderCollections,
  program: renderProgram,
};

export function renderView(view: ViewId): string {
  return viewRenderers[view]();
}

export const navItems: { id: ViewId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'quotes', label: 'Quote-to-Order', icon: '◎' },
  { id: 'orders', label: 'Order-to-Invoice', icon: '◈' },
  { id: 'invoices', label: 'Invoicing', icon: '◫' },
  { id: 'collections', label: 'Invoice-to-Cash', icon: '◆' },
  { id: 'program', label: 'Program', icon: '◇' },
];
