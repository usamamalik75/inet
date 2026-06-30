import type {
  ActivityLog,
  ARAccount,
  Customer,
  CustomerOnboarding,
  Dispute,
  FieldTicketDoc,
  Invoice,
  KPI,
  Order,
  Quote,
  RecoveryPlan,
} from '../types';

export const programMeta = {
  name: 'iNet Quotes-to-Cash (Q2C)',
  version: 'Custom Build Prototype — Connected End-to-End Flow',
  sponsor: 'Steve Manz, CFO',
  approach:
    'In-house platform replacing CloudCore. Unified Quote → Order → Invoice → Cash with built-in CPQ, onboarding, and collections.',
  currentMonth: 'M3',
  cloudCoreStatus: 'Active (parallel run planned M7–M8)',
};

export const initialCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Silver Bow Communications',
    vertical: 'Wireless ISP',
    country: 'US',
    onboardingStatus: 'approved',
    fieldTicketsRequired: 2,
    creditTier: 'standard',
    systemsSynced: { salesforce: true, intacct: true, cloudCore: true },
    notes: 'Unbilled since November — recovery plan active',
  },
  {
    id: 'CUST-002',
    name: 'Pecos Energy Services',
    vertical: 'Oil & Gas',
    country: 'US',
    onboardingStatus: 'pending_review',
    fieldTicketsRequired: 2,
    creditTier: 'high_value',
    systemsSynced: { salesforce: true, intacct: false, cloudCore: true },
    notes: 'Deposit required — high-value account',
  },
  {
    id: 'CUST-003',
    name: 'High Plains Wireless',
    vertical: 'Wireless ISP',
    country: 'US',
    onboardingStatus: 'none',
    fieldTicketsRequired: 1,
    creditTier: 'standard',
    systemsSynced: { salesforce: false, intacct: true, cloudCore: true },
    notes: 'Pricing discrepancy — Starlink bulk rate issue',
  },
  {
    id: 'CUST-004',
    name: 'Diamondback Midstream',
    vertical: 'Oil & Gas',
    country: 'US',
    onboardingStatus: 'approved',
    fieldTicketsRequired: 3,
    creditTier: 'standard',
    systemsSynced: { salesforce: true, intacct: true, cloudCore: false },
    notes: 'Recovery plan with Steve — active',
  },
  {
    id: 'CUST-005',
    name: 'Vital Connect LLC',
    vertical: 'Healthcare IoT',
    country: 'US',
    onboardingStatus: 'approved',
    fieldTicketsRequired: 1,
    creditTier: 'new',
    systemsSynced: { salesforce: true, intacct: true, cloudCore: true },
    notes: '',
  },
  {
    id: 'CUST-006',
    name: 'Exxon Permian Ops',
    vertical: 'Oil & Gas',
    country: 'US',
    onboardingStatus: 'approved',
    fieldTicketsRequired: 2,
    creditTier: 'high_value',
    systemsSynced: { salesforce: true, intacct: true, cloudCore: true },
    notes: 'Recovery plan — CFO review',
  },
  {
    id: 'CUST-007',
    name: 'Apache → Vinson Transition',
    vertical: 'Oil & Gas',
    country: 'US',
    onboardingStatus: 'incomplete',
    fieldTicketsRequired: 2,
    creditTier: 'standard',
    systemsSynced: { salesforce: false, intacct: true, cloudCore: true },
    notes: 'Missing support documentation',
  },
  {
    id: 'CUST-008',
    name: 'Permian Basin Logistics',
    vertical: 'Oil & Gas',
    country: 'US',
    onboardingStatus: 'approved',
    fieldTicketsRequired: 1,
    creditTier: 'standard',
    systemsSynced: { salesforce: true, intacct: true, cloudCore: true },
    notes: '150-day write-off evaluation pending',
  },
];

export const initialKpis: KPI[] = [
  { id: 'kpi-1', stage: 'Quote-to-Order', owner: 'Hector Maytorena', metric: 'Quote turnaround time', baseline: '12 days', target: '≤ 6 days', current: '8 days', trend: 'down', healthy: true },
  { id: 'kpi-2', stage: 'Quote-to-Order', owner: 'Hector Maytorena', metric: 'Quote/order error rate', baseline: '8.4%', target: '< 2%', current: '3.1%', trend: 'down', healthy: false },
  { id: 'kpi-3', stage: 'Order-to-Invoice', owner: 'Stan Hughey', metric: 'Order-to-invoice cycle time', baseline: '45 days', target: '≤ 2 days', current: '18 days', trend: 'down', healthy: false },
  { id: 'kpi-4', stage: 'Order-to-Invoice', owner: 'Stan Hughey', metric: 'Billing backlog (unbilled $)', baseline: '$284,500', target: '→ ~$0', current: '$92,300', trend: 'down', healthy: false },
  { id: 'kpi-5', stage: 'Order-to-Invoice', owner: 'Stan Hughey', metric: 'Invoice first-pass accuracy', baseline: '76%', target: '> 98%', current: '89%', trend: 'up', healthy: false },
  { id: 'kpi-6', stage: 'Invoice-to-Cash', owner: 'Steve Manz', metric: 'DSO', baseline: '78 days', target: '≤ 45 days', current: '71 days', trend: 'down', healthy: false },
  { id: 'kpi-7', stage: 'Invoice-to-Cash', owner: 'Steve Manz', metric: '% AR overdue > 90 days', baseline: '22%', target: '< 8%', current: '17%', trend: 'down', healthy: false },
  { id: 'kpi-8', stage: 'Cross-cutting', owner: 'PMO', metric: 'Touchless / auto-posted invoices', baseline: '12%', target: '> 80%', current: '34%', trend: 'up', healthy: false },
];

export const initialQuotes: Quote[] = [
  { id: 'Q-2026-0142', customerId: 'CUST-001', customer: 'Silver Bow Communications', vertical: 'Wireless ISP', productId: 'PRD-001', product: 'Starlink Enterprise Bulk (500 units)', quantity: 500, unitPrice: 135, amount: 67500, status: 'converted', createdDate: '2026-01-15', daysOpen: 45, approver: 'Demi (interim)' },
  { id: 'Q-2026-0187', customerId: 'CUST-002', customer: 'Pecos Energy Services', vertical: 'Oil & Gas', productId: 'PRD-003', product: 'IIoT Monitoring + Field Support', quantity: 1, unitPrice: 142000, amount: 142000, status: 'pending_approval', createdDate: '2026-05-28', daysOpen: 4, approver: 'Demi (interim)' },
  { id: 'Q-2026-0191', customerId: 'CUST-003', customer: 'High Plains Wireless', vertical: 'Wireless ISP', productId: 'PRD-002', product: 'Starlink Residential Bulk', quantity: 250, unitPrice: 155, amount: 38750, status: 'stuck', createdDate: '2026-03-02', daysOpen: 91, pricingError: 'Bulk rate $155 vs approved $135/unit' },
  { id: 'Q-2026-0198', customerId: 'CUST-004', customer: 'Diamondback Midstream', vertical: 'Oil & Gas', productId: 'PRD-004', product: 'Managed Network + SLA', quantity: 1, unitPrice: 218400, amount: 218400, status: 'converted', createdDate: '2026-05-10', daysOpen: 2, approver: 'Demi (interim)' },
  { id: 'Q-2026-0203', customerId: 'CUST-005', customer: 'Vital Connect LLC', vertical: 'Healthcare IoT', productId: 'PRD-005', product: 'Cellular Backup + Monitoring', quantity: 1, unitPrice: 56400, amount: 56400, status: 'converted', createdDate: '2026-06-01', daysOpen: 1, approver: 'Demi (interim)' },
];

export const initialOnboardings: CustomerOnboarding[] = [
  { id: 'ONB-0041', customerId: 'CUST-002', customer: 'Pecos Energy Services', country: 'US', status: 'pending_review', creditCheck: 'deposit_required', taxValidated: true, achConfirmed: false, signed: true, approver: 'Demi (interim)', submittedDate: '2026-05-29', taxId: '84-1234567' },
  { id: 'ONB-0038', customerId: 'CUST-007', customer: 'Apache → Vinson Transition', country: 'US', status: 'incomplete', creditCheck: 'pending', taxValidated: false, achConfirmed: false, signed: false, approver: 'Demi (interim)', submittedDate: '2026-05-20' },
  { id: 'ONB-0035', customerId: 'CUST-006', customer: 'Exxon Permian Ops', country: 'US', status: 'approved', creditCheck: 'passed', taxValidated: true, achConfirmed: true, signed: true, approver: 'Demi (interim)', submittedDate: '2026-04-12', taxId: '13-1234567' },
];

export const initialOrders: Order[] = [
  { id: 'ORD-8821', quoteId: 'Q-2026-0142', customerId: 'CUST-001', customer: 'Silver Bow Communications', amount: 67500, status: 'ready_to_bill', submittedDate: '2025-11-18', fieldTicketsRequired: 2, fieldTicketsUploaded: 2 },
  { id: 'ORD-8904', quoteId: 'Q-2026-0198', customerId: 'CUST-004', customer: 'Diamondback Midstream', amount: 218400, status: 'fulfillment', submittedDate: '2026-05-12', fieldTicketsRequired: 3, fieldTicketsUploaded: 1, holdReason: 'Missing field ticket #FT-2291' },
  { id: 'ORD-8910', quoteId: 'Q-2026-0187', customerId: 'CUST-002', customer: 'Pecos Energy Services', amount: 142000, status: 'held', submittedDate: '2026-05-30', fieldTicketsRequired: 2, fieldTicketsUploaded: 0, holdReason: 'Customer onboarding not approved' },
  { id: 'ORD-8876', quoteId: 'Q-2026-0203', customerId: 'CUST-005', customer: 'Vital Connect LLC', amount: 56400, status: 'ready_to_bill', submittedDate: '2026-05-22', fieldTicketsRequired: 1, fieldTicketsUploaded: 1 },
  { id: 'ORD-8855', quoteId: 'Q-2026-0191', customerId: 'CUST-003', customer: 'High Plains Wireless', amount: 38750, status: 'held', submittedDate: '2026-04-05', fieldTicketsRequired: 1, fieldTicketsUploaded: 0, holdReason: 'Pricing discrepancy unresolved' },
];

export const initialInvoices: Invoice[] = [
  { id: 'INV-44021', orderId: 'ORD-8821', customerId: 'CUST-001', customer: 'Silver Bow Communications', amount: 67500, status: 'held', holdReason: 'Unbilled since November — recovery in progress', holdCategory: 'unbilled_recovery', orderSubmittedDate: '2025-11-18' },
  { id: 'INV-44102', orderId: 'ORD-8876', customerId: 'CUST-005', customer: 'Vital Connect LLC', amount: 56400, status: 'posted', issuedDate: '2026-05-28', dueDate: '2026-06-27', daysOutstanding: 4, dunningStage: 0, revRecStatus: 'recognized', autoPosted: true, orderSubmittedDate: '2026-05-22' },
  { id: 'INV-43988', orderId: 'ORD-8840', customerId: 'CUST-006', customer: 'Exxon Permian Ops', amount: 312000, status: 'overdue', issuedDate: '2026-02-15', dueDate: '2026-03-17', daysOutstanding: 106, dunningStage: 3, revRecStatus: 'recognized', orderSubmittedDate: '2026-01-10' },
  { id: 'INV-44055', orderId: 'ORD-8862', customerId: 'CUST-004', customer: 'Diamondback Midstream', amount: 186200, status: 'sent', issuedDate: '2026-05-01', dueDate: '2026-05-31', daysOutstanding: 31, dunningStage: 0, revRecStatus: 'recognized', autoPosted: true, orderSubmittedDate: '2026-04-28' },
  { id: 'INV-44012', orderId: 'ORD-8850', customerId: 'CUST-007', customer: 'Apache → Vinson', amount: 94500, status: 'held', holdReason: 'Missing support documentation', holdCategory: 'support_docs', orderSubmittedDate: '2026-05-15' },
  { id: 'INV-43970', orderId: 'ORD-8831', customerId: 'CUST-008', customer: 'Permian Basin Logistics', amount: 42800, status: 'overdue', issuedDate: '2026-01-20', dueDate: '2026-02-19', daysOutstanding: 132, dunningStage: 4, revRecStatus: 'recognized', orderSubmittedDate: '2026-01-05' },
];

export const initialFieldTickets: FieldTicketDoc[] = [
  { id: 'FT-2280', orderId: 'ORD-8821', customerId: 'CUST-001', customer: 'Silver Bow Communications', fileName: 'SilverBow-Install-Report.pdf', docType: 'Install Report', uploadedDate: '2025-11-20', uploadedBy: 'Field Ops' },
  { id: 'FT-2281', orderId: 'ORD-8821', customerId: 'CUST-001', customer: 'Silver Bow Communications', fileName: 'SilverBow-Signoff.pdf', docType: 'Customer Sign-off', uploadedDate: '2025-11-22', uploadedBy: 'Field Ops' },
  { id: 'FT-2290', orderId: 'ORD-8904', customerId: 'CUST-004', customer: 'Diamondback Midstream', fileName: 'DBM-Site-Survey.pdf', docType: 'Site Survey', uploadedDate: '2026-05-18', uploadedBy: 'Field Ops' },
  { id: 'FT-2288', orderId: 'ORD-8876', customerId: 'CUST-005', customer: 'Vital Connect LLC', fileName: 'Vital-Deployment.pdf', docType: 'Deployment Record', uploadedDate: '2026-05-24', uploadedBy: 'Field Ops' },
];

export const initialDisputes: Dispute[] = [
  { id: 'DSP-001', invoiceId: 'INV-43988', customerId: 'CUST-006', customer: 'Exxon Permian Ops', reason: 'Billing amount does not match contract rate', status: 'investigating', rootCause: 'Pricing mismatch on IIoT line items', openedDate: '2026-03-20', assignedTo: 'Customer Success' },
  { id: 'DSP-002', invoiceId: 'INV-44055', customerId: 'CUST-004', customer: 'Diamondback Midstream', reason: 'Duplicate charge on managed network SLA', status: 'open', openedDate: '2026-06-01', assignedTo: 'Hector Maytorena' },
];

export const initialRecoveryPlans: RecoveryPlan[] = [
  { id: 'REC-001', customerId: 'CUST-001', customer: 'Silver Bow Communications', invoiceId: 'INV-44021', issue: 'Unbilled since November 2025', status: 'active', owner: 'Steve Manz', action: 'Release hold → Post → Send invoice' },
  { id: 'REC-002', customerId: 'CUST-006', customer: 'Exxon Permian Ops', invoiceId: 'INV-43988', issue: 'DSO 106 days — recovery plan with CFO', status: 'active', owner: 'Steve Manz', action: 'Resolve dispute → Escalate dunning → Payment plan' },
  { id: 'REC-003', customerId: 'CUST-004', customer: 'Diamondback Midstream', invoiceId: 'INV-44055', issue: 'Open dispute on SLA charges', status: 'active', owner: 'Demi', action: 'Investigate dispute → Reissue if needed' },
  { id: 'REC-004', customerId: 'CUST-007', customer: 'Apache → Vinson Transition', invoiceId: 'INV-44012', issue: 'Missing support docs blocking invoice', status: 'active', owner: 'Stan Hughey', action: 'Upload docs → Release hold → Post' },
];

export const initialAR: ARAccount[] = [
  { customerId: 'CUST-006', customer: 'Exxon Permian Ops', balance: 624000, current: 0, days30: 0, days60: 312000, days90: 312000, days120Plus: 0, lastContact: '2026-05-15', dunningStage: 3 },
  { customerId: 'CUST-004', customer: 'Diamondback Midstream', balance: 404600, current: 186200, days30: 218400, days60: 0, days90: 0, days120Plus: 0, lastContact: '2026-06-01', dunningStage: 0 },
  { customerId: 'CUST-001', customer: 'Silver Bow Communications', balance: 67500, current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 67500, lastContact: '2026-05-20', dunningStage: 4 },
  { customerId: 'CUST-007', customer: 'Apache → Vinson', balance: 189000, current: 94500, days30: 94500, days60: 0, days90: 0, days120Plus: 0, lastContact: '2026-05-28', dunningStage: 1 },
  { customerId: 'CUST-008', customer: 'Permian Basin Logistics', balance: 42800, current: 0, days30: 0, days60: 0, days90: 0, days120Plus: 42800, lastContact: '2026-04-10', dunningStage: 4 },
];

export const initialActivity: ActivityLog[] = [
  { id: 'ACT-1', timestamp: '2026-06-01 09:00', message: 'Program Gate 1 in progress — to-be processes under review', entityType: 'quote', entityId: 'Q-2026-0203' },
  { id: 'ACT-2', timestamp: '2026-05-30 14:22', message: 'Order ORD-8910 held — Pecos onboarding not approved', entityType: 'order', entityId: 'ORD-8910' },
  { id: 'ACT-3', timestamp: '2026-05-28 11:05', message: 'Quote Q-2026-0187 submitted for approval', entityType: 'quote', entityId: 'Q-2026-0187' },
];

export const dunningLadder = [
  { days: 60, action: 'Automated email + monthly statement', owner: 'AR System' },
  { days: 90, action: 'Escalate to assigned sales rep', owner: 'Customer Success' },
  { days: 120, action: 'Escalate to CFO for review', owner: 'Steve Manz' },
  { days: 150, action: 'Write-off evaluation', owner: 'Controller + CFO' },
];

export const programGates = [
  { id: 'gate-0', name: 'Gate 0 — Mobilize & Assess', when: 'End M1', status: 'passed' as const, owner: 'Steve Manz', criteria: ['Baselines captured', 'Charter approved', 'Near-term fix track underway', 'Custom platform scope confirmed'] },
  { id: 'gate-1', name: 'Gate 1 — Design & Blueprint', when: 'End M3', status: 'current' as const, owner: 'Steering Committee', criteria: ['To-be processes signed off', 'KPI targets locked', 'Data model & API design approved', 'Budget confirmed'] },
  { id: 'gate-2', name: 'Gate 2 — Build Complete', when: 'End M6.5', status: 'pending' as const, owner: 'Stan Hughey', criteria: ['CPQ module configured', 'Invoicing engine built', 'End-to-end integration demonstrated', 'No open critical defects'] },
  { id: 'gate-3', name: 'Gate 3/4 — Cutover Authorization', when: 'End M8.5', status: 'pending' as const, owner: 'Steve Manz', criteria: ['UAT passed', 'Parallel run reconciled', 'Cutover & rollback plan approved', 'Training complete'] },
  { id: 'gate-5', name: 'Gate 5 — CloudCore Decommission', when: 'End M9', status: 'pending' as const, owner: 'Steve + Stan', criteria: ['Cutover stable', 'DSO trend positive', 'CloudCore safe to retire'] },
];

export const workstreams = [
  { id: 'ws1', name: 'WS1 — Quote-to-Order', lead: 'Hector Maytorena', phase: 'Design (M2–M3.5)', progress: 65, nearTermActions: ['Approval-gate backup named (Demi interim)', 'Pricing-change checklist implemented', 'Aged quote queue review assigned'] },
  { id: 'ws2', name: 'WS2 — Order-to-Invoice', lead: 'Stan Hughey', phase: 'Design (M2–M3.5)', progress: 55, nearTermActions: ['Draft/held backlog tagged by hold reason', 'Silver Bow unbilled recovery in progress', 'Per-customer support doc requirements documented'] },
  { id: 'ws3', name: 'WS3 — Invoice-to-Cash', lead: 'Steve Manz', phase: 'Near-term fixes active', progress: 40, nearTermActions: ['Dunning ladder enforced in custom AR module', 'Weekly AR aging review standing', 'Exxon / Diamondback / Apache recovery plans active'] },
  { id: 'ws4', name: 'WS4 — Platform & Data Migration', lead: 'Stan Hughey', phase: 'Architecture (M2–M3)', progress: 30, nearTermActions: ['Customer master reconciliation across 3 systems', 'No-delete-notes policy issued', 'CloudCore access restricted by role'] },
  { id: 'ws5', name: 'WS5 — Change Management & Training', lead: 'PMO', phase: 'Mobilize (M1–M3)', progress: 25, nearTermActions: ['Question Routing Map published', 'Onboarding SOP drafted from Tracy checklist', 'Role-based training plan in development'] },
];

export const architectureComparison = {
  thirdParty: {
    label: 'Document Plan (Third-Party)',
    systems: ['Salesforce Communications Cloud (CPQ + Order Mgmt)', 'Sage Intacct (Invoicing + Rev Rec)', 'FormAssembly (Onboarding forms)', 'Avalara (Tax)', 'DocuSign (E-signature)', 'SI Partner ($600–850k implementation)'],
    pros: ['Faster time-to-market with mature products', 'Out-of-box CPQ and integrations'],
    cons: ['High licensing + SI costs', 'Vendor lock-in', 'Configure-only constraints'],
  },
  custom: {
    label: 'Custom Build (This Prototype)',
    systems: ['iNet Q2C Platform — TypeScript UI', 'Unified data layer (single system of record)', 'Built-in CPQ, Order Mgmt, Invoicing, AR', 'Native onboarding, tax calc, e-sign modules', 'In-house dev team (no SI partner)'],
    pros: ['Full control over process & data', 'No per-seat licensing', 'Tailored to iNet verticals'],
    cons: ['Longer build timeline', 'Ongoing maintenance burden', 'Must build ASC 606, dunning, etc.'],
  },
};
