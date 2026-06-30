import type { HoldReasonCategory, Invoice, KPI, Order, Quote } from '../types';

interface KpiState {
  quotes: Quote[];
  orders: Order[];
  invoices: Invoice[];
  kpis: KPI[];
}

export function updateInvoiceAging(invoices: Invoice[]): void {
  const now = new Date();
  invoices.forEach((inv) => {
    if (!inv.dueDate || inv.status === 'paid' || inv.status === 'held' || inv.status === 'draft') return;
    const due = new Date(inv.dueDate + 'T00:00:00');
    const days = Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86400000));
    inv.daysOutstanding = days;
    if (days > 0 && (inv.status === 'sent' || inv.status === 'posted')) {
      inv.status = 'overdue';
    }
  });
}

export function runAutomatedDunning(
  invoices: Invoice[],
  log: (msg: string, entityId: string) => void
): void {
  invoices.forEach((inv) => {
    const days = inv.daysOutstanding ?? 0;
    if (days < 60 || inv.status === 'paid' || inv.status === 'held' || inv.status === 'draft') return;
    let targetStage = 0;
    if (days >= 150) targetStage = 4;
    else if (days >= 120) targetStage = 3;
    else if (days >= 90) targetStage = 2;
    else if (days >= 60) targetStage = 1;
    const current = inv.dunningStage ?? 0;
    if (targetStage > current) {
      inv.dunningStage = targetStage;
      inv.status = 'overdue';
      const actions = ['', '60-day email + statement sent', 'Escalated to sales rep', 'Escalated to CFO', 'Write-off evaluation triggered'];
      log(`Auto-dunning: ${inv.customer} — ${actions[targetStage]}`, inv.id);
    }
  });
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000));
}

export function recalculateKpis(state: KpiState): void {
  const { quotes, orders, invoices, kpis } = state;

  const billingBacklog =
    invoices.filter((i) => i.status === 'held' || i.status === 'draft').reduce((s, i) => s + i.amount, 0) +
    orders.filter((o) => o.status === 'ready_to_bill').reduce((s, o) => s + o.amount, 0);

  const issued = invoices.filter((i) => i.issuedDate && i.orderSubmittedDate);
  const cycleTimes = issued.map((i) => daysBetween(i.orderSubmittedDate!, i.issuedDate!));
  const avgCycle = cycleTimes.length ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) : 45;

  const openInvoices = invoices.filter((i) => ['sent', 'overdue', 'posted'].includes(i.status));
  const totalOpen = openInvoices.reduce((s, i) => s + i.amount, 0);
  const dso =
    totalOpen > 0
      ? Math.round(openInvoices.reduce((s, i) => s + (i.daysOutstanding ?? 0) * i.amount, 0) / totalOpen)
      : 78;

  const ar90 = openInvoices.filter((i) => (i.daysOutstanding ?? 0) > 90);
  const pctOverdue90 = totalOpen > 0 ? Math.round((ar90.reduce((s, i) => s + i.amount, 0) / totalOpen) * 100) : 22;

  const posted = invoices.filter((i) => ['posted', 'sent', 'paid', 'overdue'].includes(i.status));
  const autoPosted = posted.filter((i) => i.autoPosted);
  const touchlessPct = posted.length ? Math.round((autoPosted.length / posted.length) * 100) : 12;

  const withErrors = quotes.filter((q) => q.status === 'stuck' || q.pricingError).length;
  const errorRate = quotes.length ? ((withErrors / quotes.length) * 100).toFixed(1) : '8.4';

  const activeQuotes = quotes.filter((q) => q.status !== 'converted');
  const avgTurnaround = activeQuotes.length
    ? Math.round(activeQuotes.reduce((s, q) => s + q.daysOpen, 0) / activeQuotes.length)
    : 12;

  const firstPass = invoices.filter((i) => i.status !== 'held' && !i.holdReason);
  const accuracy = invoices.length ? Math.round((firstPass.length / invoices.length) * 100) : 76;

  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const billed = invoices.filter((i) => i.status !== 'draft' && i.status !== 'held').reduce((s, i) => s + i.amount, 0);
  const cei = billed > 0 ? Math.round((paid / billed) * 100) : 65;

  const issuanceLags = issued.map((i) => daysBetween(i.orderSubmittedDate!, i.issuedDate!));
  const avgIssuanceLag = issuanceLags.length
    ? Math.round(issuanceLags.reduce((a, b) => a + b, 0) / issuanceLags.length)
    : 45;

  const updates: Record<string, { current: string; healthy: boolean; trend: KPI['trend'] }> = {
    'kpi-1': { current: `${avgTurnaround} days`, healthy: avgTurnaround <= 6, trend: avgTurnaround <= 12 ? 'down' : 'up' },
    'kpi-2': { current: `${errorRate}%`, healthy: parseFloat(errorRate) < 2, trend: parseFloat(errorRate) < 8.4 ? 'down' : 'up' },
    'kpi-3': { current: `${avgCycle} days`, healthy: avgCycle <= 2, trend: avgCycle < 45 ? 'down' : 'flat' },
    'kpi-4': { current: formatKpiCurrency(billingBacklog), healthy: billingBacklog < 50000, trend: billingBacklog < 284500 ? 'down' : 'up' },
    'kpi-5': { current: `${accuracy}%`, healthy: accuracy > 98, trend: accuracy > 76 ? 'up' : 'down' },
    'kpi-6': { current: `${dso} days`, healthy: dso <= 45, trend: dso < 78 ? 'down' : 'up' },
    'kpi-7': { current: `${pctOverdue90}%`, healthy: pctOverdue90 < 8, trend: pctOverdue90 < 22 ? 'down' : 'up' },
    'kpi-8': { current: `${touchlessPct}%`, healthy: touchlessPct > 80, trend: touchlessPct > 12 ? 'up' : 'flat' },
  };

  kpis.forEach((k) => {
    const u = updates[k.id];
    if (u) {
      k.current = u.current;
      k.healthy = u.healthy;
      k.trend = u.trend;
    }
  });

  // Cross-cutting issuance lag stored on kpi-3 area - add to summary via getSummaryStats
  (state as KpiState & { _issuanceLag?: number })._issuanceLag = avgIssuanceLag;
  (state as KpiState & { _cei?: number })._cei = cei;
}

function formatKpiCurrency(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return n === 0 ? '→ ~$0' : `$${n.toLocaleString()}`;
}

export function getBacklogByCategory(invoices: Invoice[]): { category: HoldReasonCategory; count: number; amount: number }[] {
  const held = invoices.filter((i) => i.status === 'held' || (i.status === 'draft' && i.holdReason));
  const map = new Map<HoldReasonCategory, { count: number; amount: number }>();
  held.forEach((i) => {
    const cat = i.holdCategory ?? 'other';
    const cur = map.get(cat) ?? { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += i.amount;
    map.set(cat, cur);
  });
  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.amount - a.amount);
}
