export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function statusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'badge-neutral',
    pending_approval: 'badge-warning',
    approved: 'badge-success',
    stuck: 'badge-danger',
    converted: 'badge-info',
    new: 'badge-neutral',
    submitted: 'badge-info',
    fulfillment: 'badge-warning',
    ready_to_bill: 'badge-success',
    held: 'badge-danger',
    posted: 'badge-info',
    sent: 'badge-success',
    overdue: 'badge-danger',
    paid: 'badge-success',
    incomplete: 'badge-danger',
    pending_review: 'badge-warning',
    rejected: 'badge-danger',
    pending: 'badge-neutral',
    passed: 'badge-success',
    current: 'badge-warning',
    investigating: 'badge-warning',
    resolved: 'badge-success',
    none: 'badge-neutral',
    recognized: 'badge-success',
  };
  return map[status] ?? 'badge-neutral';
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function el(tag: string, className?: string, html?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}
