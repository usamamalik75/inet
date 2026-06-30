import type { Product } from '../types';

export const VERTICALS = ['Wireless ISP', 'Oil & Gas', 'Healthcare IoT', 'Enterprise'] as const;

export const products: Product[] = [
  {
    id: 'PRD-001',
    name: 'Starlink Enterprise Bulk',
    vertical: 'Wireless ISP',
    unitPrice: 135,
    unit: 'unit',
    requiresFieldTickets: 2,
    approvedBulkRate: 135,
  },
  {
    id: 'PRD-002',
    name: 'Starlink Residential Bulk',
    vertical: 'Wireless ISP',
    unitPrice: 135,
    unit: 'unit',
    requiresFieldTickets: 1,
    approvedBulkRate: 135,
  },
  {
    id: 'PRD-003',
    name: 'IIoT Monitoring + Field Support',
    vertical: 'Oil & Gas',
    unitPrice: 142000,
    unit: 'site',
    requiresFieldTickets: 2,
  },
  {
    id: 'PRD-004',
    name: 'Managed Network + SLA',
    vertical: 'Oil & Gas',
    unitPrice: 218400,
    unit: 'contract',
    requiresFieldTickets: 3,
  },
  {
    id: 'PRD-005',
    name: 'Cellular Backup + Monitoring',
    vertical: 'Healthcare IoT',
    unitPrice: 56400,
    unit: 'site',
    requiresFieldTickets: 1,
  },
  {
    id: 'PRD-006',
    name: 'Field Support Package',
    vertical: 'Enterprise',
    unitPrice: 8500,
    unit: 'ticket',
    requiresFieldTickets: 0,
  },
];

export const APPROVER = 'Demi (interim)';

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function validateQuotePrice(productId: string, unitPrice: number): string | undefined {
  const product = getProduct(productId);
  if (!product) return 'Unknown product';
  if (product.approvedBulkRate && unitPrice !== product.approvedBulkRate) {
    return `Bulk rate $${unitPrice} vs approved $${product.approvedBulkRate}/${product.unit}`;
  }
  return undefined;
}
