import type { Product } from '../types';

export const VERTICALS = ['Oil & Gas', 'Mining', 'Maritime', 'Utilities'] as const;

export const products: Product[] = [
  {
    id: 'PRD-001',
    name: 'Continuum Starlink Data Pool',
    family: 'Continuum',
    vertical: 'Oil & Gas',
    unitPrice: 135,
    unit: 'terminal',
    requiresFieldTickets: 2,
    approvedBulkRate: 135,
  },
  {
    id: 'PRD-002',
    name: 'Continuum Private LTE Site Bundle',
    family: 'Continuum',
    vertical: 'Mining',
    unitPrice: 135,
    unit: 'sim',
    requiresFieldTickets: 2,
    approvedBulkRate: 135,
  },
  {
    id: 'PRD-003',
    name: 'Sentinel Managed OT Security',
    family: 'Sentinel',
    vertical: 'Oil & Gas',
    unitPrice: 142000,
    unit: 'site',
    requiresFieldTickets: 2,
  },
  {
    id: 'PRD-004',
    name: 'Continuum Managed Network + SLA',
    family: 'Continuum',
    vertical: 'Maritime',
    unitPrice: 218400,
    unit: 'contract',
    requiresFieldTickets: 3,
  },
  {
    id: 'PRD-005',
    name: 'Nexora Edge Monitoring',
    family: 'Nexora',
    vertical: 'Utilities',
    unitPrice: 56400,
    unit: 'site',
    requiresFieldTickets: 1,
  },
  {
    id: 'PRD-006',
    name: 'Sentinel CCTV + Edge Firewall',
    family: 'Sentinel',
    vertical: 'Maritime',
    unitPrice: 8500,
    unit: 'kit',
    requiresFieldTickets: 1,
  },
  {
    id: 'PRD-007',
    name: 'Nexora Predictive Analytics',
    family: 'Nexora',
    vertical: 'Mining',
    unitPrice: 126000,
    unit: 'subscription',
    requiresFieldTickets: 1,
  },
  {
    id: 'PRD-008',
    name: 'Continuum SD-WAN + Field Deployment',
    family: 'Continuum',
    vertical: 'Utilities',
    unitPrice: 135,
    unit: 'router',
    requiresFieldTickets: 1,
    approvedBulkRate: 135,
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
