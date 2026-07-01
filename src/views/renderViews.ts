import {
  getArchitectureComparison,
  getBacklogSummary,
  getDunningLadder,
  getDisputes,
  getFieldTickets,
  getKpis,
  getOpenDecisions,
  getProgramGates,
  getProgramMeta,
  getRecoveryPlans,
  getState,
  getSummaryStats,
  getWorkstreams,
} from '../store';
import { HOLD_CATEGORY_LABELS, type ViewId } from '../types';
import { formatCurrency, formatDate, statusClass, statusLabel } from '../utils';
import {
  actionBtn,
  linkEntity,
  pageActions,
  renderActivityFeed,
  renderCreateDisputeModal,
  renderCreateOnboardingModal,
  renderCreateQuoteModal,
  renderDetailModal,
  renderInvoiceActions,
  renderOnboardingActions,
  renderOrderActions,
  renderPipeline,
  renderQuoteActions,
  renderTagHoldModal,
  renderToasts,
  renderUploadDocumentModal,
} from './components';
import { products } from '../data/catalog';

function renderKpiCards(): string {
  return getKpis()
    .map(
      (k) => `
    <div class="kpi-card ${k.healthy ? 'kpi-healthy' : 'kpi-at-risk'}">
      <div class="kpi-stage">${k.stage}</div>
      <div class="kpi-metric">${k.metric}</div>
      <div class="kpi-values">
        <span class="kpi-current">${k.current}</span>
        <span class="kpi-target">Target: ${k.target}</span>
      </div>
      <div class="kpi-meta"><span>Baseline: ${k.baseline}</span></div>
    </div>`
    )
    .join('');
}

function renderArchitectureComparison(): string {
  const { thirdParty, custom } = getArchitectureComparison();
  return `
    <div class="compare-grid">
      <div class="compare-card compare-third">
        <h3>${thirdParty.label}</h3>
        <ul>${thirdParty.systems.map((s) => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="compare-card compare-custom">
        <h3>${custom.label}</h3>
        <ul>${custom.systems.map((s) => `<li>${s}</li>`).join('')}</ul>
      </div>
    </div>`;
}

function renderSummaryStats(): string {
  const { unbilled, overdue, stuckQuotes, heldOrders, dso, openDisputes } = getSummaryStats();
  return `
    <div class="stat-row">
      <div class="stat-card stat-danger"><div class="stat-value">${formatCurrency(unbilled)}</div><div class="stat-label">Unbilled / Held</div></div>
      <div class="stat-card stat-warning"><div class="stat-value">${formatCurrency(overdue)}</div><div class="stat-label">Overdue AR</div></div>
      <div class="stat-card stat-info"><div class="stat-value">${dso} days</div><div class="stat-label">Live DSO</div></div>
      <div class="stat-card stat-neutral"><div class="stat-value">${stuckQuotes + heldOrders + openDisputes}</div><div class="stat-label">Issues (Stuck + Held + Disputes)</div></div>
    </div>`;
}

export function renderDashboard(): string {
  const meta = getProgramMeta();
  return `
    <header class="page-header">
      <div>
        <h1>Q2C Command Center</h1>
        <p class="subtitle">End-to-end connected flow — ${meta.currentMonth} of 9-month program</p>
      </div>
      <div class="header-badge">${meta.cloudCoreStatus}</div>
    </header>
    ${renderSummaryStats()}
    <section class="section">
      <h2>Connected Pipeline</h2>
      <p class="section-desc">Click any stage to navigate. Create a quote → approve → onboard → order → invoice → collect cash.</p>
      ${renderPipeline()}
    </section>
    <section class="section">
      <h2>Recent Activity</h2>
      ${renderActivityFeed()}
    </section>
    <section class="section">
      <h2>Recovery Plans (Near-Term Fixes)</h2>
      ${renderRecoveryPlans()}
    </section>
    <section class="section">
      <h2>Program KPIs <span class="live-badge">LIVE</span></h2>
      <div class="kpi-grid">${renderKpiCards()}</div>
    </section>`;
}

export function renderQuotes(): string {
  const { quotes, onboardings } = getState();

  const quoteRows = quotes
    .map((q) => {
      const order = getState().orders.find((o) => o.quoteId === q.id);
      return `
    <tr class="expandable-row">
      <td>${linkEntity('quote', q.id, q.id)}</td>
      <td>${q.customer}</td>
      <td>${q.vertical}</td>
      <td>${q.product}</td>
      <td>${formatCurrency(q.amount)}</td>
      <td><span class="badge ${statusClass(q.status)}">${statusLabel(q.status)}</span></td>
      <td>${q.daysOpen}d</td>
      <td>${order ? linkEntity('order', order.id, order.id) : '—'}</td>
      <td class="actions-cell">${renderQuoteActions(q)}</td>
    </tr>
    ${q.pricingError ? `<tr class="sub-row"><td colspan="9"><span class="text-danger">⚠ ${q.pricingError}</span></td></tr>` : ''}`;
    })
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
      <td>${o.creditCheck.replace('_', ' ')}</td>
      <td class="actions-cell">${renderOnboardingActions(o.id, o.status)}</td>
    </tr>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Quote-to-Order</h1>
        <p class="subtitle">WS1 — Configure, price, approve, onboard, and convert to order</p>
      </div>
      ${pageActions(`
        <button class="btn btn-primary" data-action="open-create-quote">+ Create Quote</button>
        <button class="btn btn-secondary" data-action="open-create-onboarding">+ New Onboarding</button>
      `)}
    </header>
    <div class="flow-banner">
      <span>Opportunity</span><span class="flow-arrow">→</span>
      <span>Configure & Price</span><span class="flow-arrow">→</span>
      <span>Approve</span><span class="flow-arrow">→</span>
      <span>Onboard Customer</span><span class="flow-arrow">→</span>
      <span>Convert to Order</span>
    </div>
    <section class="section">
      <h2>Active Quotes</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Quote ID</th><th>Customer</th><th>Vertical</th><th>Product</th><th>Amount</th><th>Status</th><th>Age</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>${quoteRows}</tbody>
        </table>
      </div>
    </section>
    <section class="section">
      <h2>Customer Onboarding</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Customer</th><th>Country</th><th>Status</th><th>Tax</th><th>ACH</th><th>E-Sign</th><th>Credit</th><th>Actions</th></tr></thead>
          <tbody>${onboardingRows}</tbody>
        </table>
      </div>
      <div class="info-box"><strong>Gate:</strong> No order or shipment until onboarding = Approved. Interim approver: Demi.</div>
    </section>`;
}

export function renderOrders(): string {
  const { orders } = getState();
  const tickets = getFieldTickets();
  const { backlog } = getSummaryStats();

  const orderRows = orders
    .map((o) => {
      const inv = getState().invoices.find((i) => i.orderId === o.id);
      const docs = tickets.filter((t) => t.orderId === o.id);
      const docList = docs.map((d) => `<span class="doc-tag">${d.fileName}</span>`).join(' ') || '—';
      return `
    <tr>
      <td>${linkEntity('order', o.id, o.id)}</td>
      <td>${linkEntity('quote', o.quoteId, o.quoteId)}</td>
      <td>${o.customer}</td>
      <td>${formatCurrency(o.amount)}</td>
      <td><span class="badge ${statusClass(o.status)}">${statusLabel(o.status)}</span></td>
      <td>${o.fieldTicketsUploaded}/${o.fieldTicketsRequired}</td>
      <td class="doc-cell">${docList}</td>
      <td>${inv ? linkEntity('invoice', inv.id, inv.id) : '—'}</td>
      <td class="actions-cell">${renderOrderActions(o)}</td>
    </tr>
    ${o.holdReason ? `<tr class="sub-row"><td colspan="9"><span class="text-danger">Hold: ${o.holdReason}</span></td></tr>` : ''}`;
    })
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Order-to-Invoice</h1>
        <p class="subtitle">WS2 — Fulfillment, field tickets, auto-post invoicing</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary" data-action="open-upload-document">+ Upload Document</button>
        <div class="header-badge">Backlog: ${formatCurrency(backlog)}</div>
      </div>
    </header>
    <div class="flow-banner">
      <span>Order Submitted</span><span class="flow-arrow">→</span>
      <span>Fulfillment</span><span class="flow-arrow">→</span>
      <span>Field Tickets</span><span class="flow-arrow">→</span>
      <span>Generate Invoice</span><span class="flow-arrow">→</span>
      <span>Auto-Post / Exception</span>
    </div>
    <section class="section">
      <h2>Orders Pipeline</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Quote</th><th>Customer</th><th>Amount</th><th>Status</th><th>Tickets</th><th>Documents</th><th>Invoice</th><th>Actions</th></tr></thead>
          <tbody>${orderRows}</tbody>
        </table>
      </div>
      <div class="info-box"><strong>Rule:</strong> Invoices cannot post without required support documents on the account record.</div>
    </section>`;
}

export function renderInvoices(): string {
  const { invoices } = getState();

  const invoiceRows = invoices
    .map(
      (i) => `
    <tr>
      <td>${linkEntity('invoice', i.id, i.id)}</td>
      <td>${linkEntity('order', i.orderId, i.orderId)}</td>
      <td>${i.customer}</td>
      <td>${formatCurrency(i.amount)}</td>
      <td><span class="badge ${statusClass(i.status)}">${statusLabel(i.status)}</span>${i.autoPosted ? ' <span class="badge badge-success">Auto</span>' : ''}</td>
      <td>${i.issuedDate ? formatDate(i.issuedDate) : '—'}</td>
      <td>${i.revRecStatus ? statusLabel(i.revRecStatus) : '—'}</td>
      <td class="actions-cell">${renderInvoiceActions(i)}</td>
    </tr>
    ${i.holdReason ? `<tr class="sub-row"><td colspan="8"><span class="text-danger">Hold: ${i.holdReason}</span></td></tr>` : ''}`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Invoicing & Revenue Recognition</h1>
        <p class="subtitle">ASC 606 rev rec — auto-post clean orders, exception queue for holds</p>
      </div>
    </header>
    <section class="section">
      <h2>Invoice Queue</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Issued</th><th>Rev Rec</th><th>Actions</th></tr></thead>
          <tbody>${invoiceRows}</tbody>
        </table>
      </div>
      <div class="info-box"><strong>Target:</strong> Invoice issuance lag ≤ 5 days. Touchless auto-post for clean orders.</div>
    </section>`;
}

export function renderCollections(): string {
  const { arAccounts, invoices } = getState();
  const { totalAR, dso, cei } = getSummaryStats();
  const dunningLadder = getDunningLadder();

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

  const overdueInvoices = invoices
    .filter((i) => i.status === 'overdue' || i.status === 'sent')
    .map(
      (i) => `
    <tr>
      <td>${linkEntity('invoice', i.id, i.id)}</td>
      <td>${i.customer}</td>
      <td>${formatCurrency(i.amount)}</td>
      <td>${i.daysOutstanding ?? 0}d</td>
      <td>Stage ${i.dunningStage ?? 0}</td>
      <td class="actions-cell">${renderInvoiceActions(i)}</td>
    </tr>`
    )
    .join('');

  const dunningRows = dunningLadder
    .map((d) => `<tr><td>${d.days}+ days</td><td>${d.action}</td><td>${d.owner}</td></tr>`)
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Invoice-to-Cash</h1>
        <p class="subtitle">WS3 — Collections, dunning ladder, DSO management</p>
      </div>
      <div class="header-badge">Total AR: ${formatCurrency(totalAR)}</div>
    </header>
    <div class="stat-row">
      <div class="stat-card stat-info"><div class="stat-value">${dso} days</div><div class="stat-label">Live DSO</div></div>
      <div class="stat-card stat-neutral"><div class="stat-value">${cei}%</div><div class="stat-label">Collections Effectiveness</div></div>
      <div class="stat-card stat-warning"><div class="stat-value">Monthly</div><div class="stat-label">Statement Cadence</div></div>
    </div>
    <div class="flow-banner">
      <span>Invoice Sent</span><span class="flow-arrow">→</span>
      <span>Revenue Recognized</span><span class="flow-arrow">→</span>
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
      <h2>Open Invoices — Collections Actions</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Outstanding</th><th>Dunning</th><th>Actions</th></tr></thead>
          <tbody>${overdueInvoices}</tbody>
        </table>
      </div>
    </section>
    <section class="section">
      <h2>Dunning Ladder</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Days Past Due</th><th>Action</th><th>Owner</th></tr></thead>
          <tbody>${dunningRows}</tbody>
        </table>
      </div>
    </section>`;
}

export function renderCustomers(): string {
  const { customers } = getState();

  const rows = customers
    .map((c) => {
      const sync = [
        c.systemsSynced.salesforce ? 'SF' : '',
        c.systemsSynced.intacct ? 'Intacct' : '',
        c.systemsSynced.cloudCore ? 'CloudCore' : '',
      ]
        .filter(Boolean)
        .join(', ');
      return `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.vertical}</td>
      <td>${c.country}</td>
      <td><span class="badge ${statusClass(c.onboardingStatus)}">${statusLabel(c.onboardingStatus)}</span></td>
      <td>${c.fieldTicketsRequired} required</td>
      <td>${c.creditTier.replace('_', ' ')}</td>
      <td><span class="sync-tags">${sync}</span></td>
      <td>${c.notes || '—'}</td>
      <td class="actions-cell">${!getState().onboardings.find((o) => o.customerId === c.id) ? actionBtn('open-onboarding', c.id, 'Onboard', 'secondary') : ''}</td>
    </tr>`;
    })
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Customer Master</h1>
        <p class="subtitle">Single master record — reconciled across SF, Intacct, CloudCore</p>
      </div>
      ${pageActions(`<button class="btn btn-secondary" data-action="open-create-onboarding">+ New Onboarding</button>`)}
    </header>
    <section class="section">
      <h2>Accounts</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Vertical</th><th>Country</th><th>Onboarding</th><th>Field Tickets</th><th>Credit Tier</th><th>Systems</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="info-box"><strong>Policy:</strong> Locked, audited notes. No-delete policy enforced. Role-based access controls.</div>
    </section>`;
}

export function renderCatalog(): string {
  const rows = products
    .map(
      (p) => `
    <tr>
      <td><strong>${p.id}</strong></td>
      <td>${p.name}</td>
      <td>${p.vertical}</td>
      <td>${formatCurrency(p.unitPrice)}/${p.unit}</td>
      <td>${p.approvedBulkRate ? `$${p.approvedBulkRate} approved` : '—'}</td>
      <td>${p.requiresFieldTickets}</td>
    </tr>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Enterprise Product Catalog</h1>
        <p class="subtitle">CPQ product model — bundles, pricing rules, and approval workflows</p>
      </div>
    </header>
    <section class="section">
      <h2>Products & Pricing</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Product</th><th>Vertical</th><th>Price</th><th>Bulk Rate</th><th>Field Tickets</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="info-box"><strong>Pricing Rule:</strong> Starlink bulk changes require approval. System flags rates that deviate from approved $135/unit.</div>
    </section>`;
}

function renderRecoveryPlans(): string {
  const plans = getRecoveryPlans();
  return `
    <div class="recovery-grid">
      ${plans
        .map(
          (p) => `
        <div class="recovery-card ${p.status === 'completed' ? 'recovery-done' : ''}">
          <div class="recovery-header">
            <strong>${p.customer}</strong>
            <span class="badge ${p.status === 'completed' ? 'badge-success' : 'badge-warning'}">${statusLabel(p.status)}</span>
          </div>
          <p class="recovery-issue">${p.issue}</p>
          <p class="recovery-action">${p.action}</p>
          <p class="recovery-owner">Owner: ${p.owner} · ${linkEntity('invoice', p.invoiceId, p.invoiceId)}</p>
          ${p.status === 'active' ? `<div class="action-row">${actionBtn('execute-recovery', p.id, 'Execute Recovery', 'success')}</div>` : ''}
        </div>`
        )
        .join('')}
    </div>`;
}

export function renderBacklog(): string {
  const { invoices } = getState();
  const held = invoices.filter((i) => i.status === 'held' || (i.holdReason && i.status === 'draft'));
  const pareto = getBacklogSummary();

  const paretoRows = pareto
    .map(
      (p) => `
    <tr>
      <td>${HOLD_CATEGORY_LABELS[p.category]}</td>
      <td>${p.count}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td><div class="pareto-bar"><div class="pareto-fill" style="width:${Math.min(100, (p.amount / (pareto[0]?.amount || 1)) * 100)}%"></div></div></td>
    </tr>`
    )
    .join('');

  const heldRows = held
    .map(
      (i) => `
    <tr>
      <td>${linkEntity('invoice', i.id, i.id)}</td>
      <td>${i.customer}</td>
      <td>${formatCurrency(i.amount)}</td>
      <td>${i.holdCategory ? HOLD_CATEGORY_LABELS[i.holdCategory] : '—'}</td>
      <td>${i.holdReason ?? '—'}</td>
      <td class="actions-cell">${renderInvoiceActions(i)}</td>
    </tr>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Billing Backlog Tracker</h1>
        <p class="subtitle">WS2 — Tag held invoices by reason · Pareto top causes · Clear backlog</p>
      </div>
    </header>
    <section class="section">
      <h2>Pareto — Hold Reasons by $</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Hold Category</th><th>Count</th><th>Amount</th><th>Distribution</th></tr></thead>
          <tbody>${paretoRows || '<tr><td colspan="4">No held invoices</td></tr>'}</tbody>
        </table>
      </div>
    </section>
    <section class="section">
      <h2>Held / Draft Invoice Queue</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Category</th><th>Reason</th><th>Actions</th></tr></thead>
          <tbody>${heldRows}</tbody>
        </table>
      </div>
      <div class="info-box"><strong>Near-term fix:</strong> Mine and tag backlog by hold reason. Silver Bow recovery available on Dashboard.</div>
    </section>`;
}

export function renderDisputes(): string {
  const disputes = getDisputes();
  const rows = disputes
    .map(
      (d) => `
    <tr>
      <td><strong>${d.id}</strong></td>
      <td>${linkEntity('invoice', d.invoiceId, d.invoiceId)}</td>
      <td>${d.customer}</td>
      <td>${d.reason}</td>
      <td><span class="badge ${statusClass(d.status)}">${statusLabel(d.status)}</span></td>
      <td>${d.rootCause ?? '—'}</td>
      <td>${d.assignedTo}</td>
      <td class="actions-cell">
        <div class="action-row">
          ${d.status === 'open' ? actionBtn('investigate-dispute', d.id, 'Investigate', 'secondary') : ''}
          ${d.status !== 'resolved' ? actionBtn('resolve-dispute', d.id, 'Resolve', 'success') : ''}
        </div>
      </td>
    </tr>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Dispute Management</h1>
        <p class="subtitle">WS3 — Track billing disputes and root causes with Customer Success</p>
      </div>
      ${pageActions(`<button class="btn btn-primary" data-action="open-create-dispute">+ Open Dispute</button>`)}
    </header>
    <section class="section">
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Invoice</th><th>Customer</th><th>Reason</th><th>Status</th><th>Root Cause</th><th>Assigned</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

export function renderProgram(): string {
  const meta = getProgramMeta();
  const decisions = getOpenDecisions();
  const gateCards = getProgramGates()
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

  const wsCards = getWorkstreams()
    .map(
      (w) => `
    <div class="ws-card">
      <div class="ws-header"><h3>${w.name}</h3><span class="ws-phase">${w.phase}</span></div>
      <p class="ws-lead">Lead: ${w.lead}</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${w.progress}%"></div></div>
      <span class="progress-label">${w.progress}% complete</span>
      <ul class="ws-actions">${w.nearTermActions.map((a) => `<li>${a}</li>`).join('')}</ul>
    </div>`
    )
    .join('');

  const decisionCards = decisions
    .map(
      (d) => `
    <div class="gate-card gate-${d.status === 'decided' ? 'passed' : d.status === 'pending' ? 'current' : 'pending'}">
      <div class="gate-header">
        <span class="badge ${statusClass(d.status === 'decided' ? 'passed' : d.status === 'pending' ? 'current' : 'pending')}">${statusLabel(d.status === 'decided' ? 'passed' : d.status === 'pending' ? 'current' : 'pending')}</span>
        <span class="gate-when">${d.owner}</span>
      </div>
      <h3>${d.title}</h3>
      <p>${d.summary}</p>
    </div>`
    )
    .join('');

  return `
    <header class="page-header">
      <div>
        <h1>Program Governance</h1>
        <p class="subtitle">9-Month Timeline · Sponsor: ${meta.sponsor}</p>
      </div>
    </header>
    <section class="section"><h2>Decision Gates</h2><div class="gate-grid">${gateCards}</div></section>
    <section class="section"><h2>Open Decisions</h2><div class="gate-grid">${decisionCards}</div></section>
    <section class="section"><h2>Workstreams</h2><div class="ws-grid">${wsCards}</div></section>
    <section class="section">
      <h2>Platform Direction</h2>
      <p class="section-desc">This comparison supports planning and governance, so it lives here instead of the day-to-day dashboard.</p>
      ${renderArchitectureComparison()}
    </section>`;
}

export function renderModal(): string {
  const { modal, selectedId } = getState();
  if (modal === 'create-quote') return renderCreateQuoteModal();
  if (modal === 'create-onboarding') return renderCreateOnboardingModal(selectedId ?? undefined);
  if (modal === 'quote-detail') return renderDetailModal();
  if (modal === 'upload-document') return renderUploadDocumentModal(selectedId ?? undefined);
  if (modal === 'create-dispute') return renderCreateDisputeModal(selectedId ?? undefined);
  if (modal === 'tag-hold') return renderTagHoldModal(selectedId ?? undefined);
  return '';
}

const viewRenderers: Record<ViewId, () => string> = {
  dashboard: renderDashboard,
  quotes: renderQuotes,
  orders: renderOrders,
  invoices: renderInvoices,
  backlog: renderBacklog,
  collections: renderCollections,
  disputes: renderDisputes,
  customers: renderCustomers,
  catalog: renderCatalog,
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
  { id: 'backlog', label: 'Billing Backlog', icon: '◰' },
  { id: 'collections', label: 'Invoice-to-Cash', icon: '◆' },
  { id: 'disputes', label: 'Disputes', icon: '◬' },
  { id: 'customers', label: 'Customers', icon: '◑' },
  { id: 'catalog', label: 'Product Catalog', icon: '◧' },
  { id: 'program', label: 'Program', icon: '◇' },
];

export function renderShell(sidebar: string, view: ViewId): string {
  return `
    ${renderToasts()}
    <div class="layout">
      ${sidebar}
      <main class="main-content" id="main-content">
        ${renderView(view)}
      </main>
    </div>
    ${renderModal()}`;
}
