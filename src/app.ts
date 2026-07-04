import {
  advanceOrderFulfillment,
  approveOnboarding,
  approveQuote,
  closeModal,
  convertQuoteToOrder,
  createDispute,
  createOnboarding,
  createQuote,
  escalateDunning,
  executeRecovery,
  fixQuotePricing,
  generateInvoice,
  getProgramMeta,
  getState,
  investigateDispute,
  openModal,
  postInvoice,
  recordPayment,
  refreshQuoteAges,
  releaseInvoiceHold,
  releaseOrderHold,
  resolveDispute,
  sendInvoice,
  setView,
  submitQuoteForApproval,
  subscribe,
  tagInvoiceHold,
  uploadFieldTicket,
} from './store';
import type { HoldReasonCategory, ViewId } from './types';
import { navItems, renderShell } from './views/renderViews';

const MODAL_ACTIONS = [
  'open-create-quote',
  'open-create-onboarding',
  'open-onboarding',
  'open-upload-document',
  'open-create-dispute',
  'close-modal',
];

function renderSidebar(): string {
  const { currentView } = getState();
  const meta = getProgramMeta();
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">iN</div>
        <div class="brand-text">
          <strong>iNet Q2C</strong>
          <span>Salesforce + Intacct Spine</span>
        </div>
      </div>
      <nav class="nav">
        ${navItems
          .map(
            (item) => `
          <button class="nav-item ${currentView === item.id ? 'active' : ''}" data-nav-view="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            ${item.label}
          </button>`
          )
          .join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="footer-label">Flow</div>
        <p>Quote -> Order -> Invoice -> Cash</p>
        <div class="footer-meta">${meta.version}</div>
      </div>
    </aside>`;
}

function renderApp(): void {
  refreshQuoteAges();
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  const { currentView } = getState();
  app.innerHTML = renderShell(renderSidebar(), currentView);
  bindEvents(app);
  setupQuoteForm();
  setupUploadForm();
  setupDisputeForm();
  setupTagHoldForm();
}

function bindEvents(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-nav-view]').forEach((el) => {
    el.addEventListener('click', () => {
      const view = el.dataset.navView as ViewId;
      if (view) setView(view);
    });
  });

  root.querySelectorAll<HTMLElement>('[data-nav-entity]').forEach((el) => {
    el.addEventListener('click', () => {
      const type = el.dataset.navEntity;
      const id = el.dataset.entityId;
      if (!type || !id) return;
      navigateToEntity(type, id);
    });
  });

  root.querySelectorAll<HTMLElement>('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const action = el.dataset.action;
      const id = el.dataset.id;
      if (!action) return;
      if (action === 'close-modal') {
        closeModal();
        return;
      }
      handleAction(action, id, e);
    });
  });

  const onboardingForm = root.querySelector<HTMLFormElement>('#create-onboarding-form');
  onboardingForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(onboardingForm);
    createOnboarding({
      customerId: fd.get('customerId') as string,
      country: fd.get('country') as string,
      taxId: fd.get('taxId') as string,
      achConfirmed: fd.get('achConfirmed') === 'on',
      signed: fd.get('signed') === 'on',
    });
  });
}

function navigateToEntity(type: string, id: string): void {
  if (type === 'quote') {
    setView('quotes');
    openModal('quote-detail', id);
  } else if (type === 'order') {
    setView('orders');
  } else if (type === 'invoice') {
    setView('invoices');
  }
}

function handleAction(action: string, id?: string, e?: Event): void {
  if (!id && !MODAL_ACTIONS.includes(action)) return;

  switch (action) {
    case 'open-create-quote':
      openModal('create-quote');
      break;
    case 'open-create-onboarding':
      openModal('create-onboarding', id);
      break;
    case 'open-onboarding':
      openModal('create-onboarding', id);
      break;
    case 'open-upload-document':
      openModal('upload-document', id);
      break;
    case 'open-create-dispute':
      openModal('create-dispute', id);
      break;
    case 'open-tag-hold':
      openModal('tag-hold', id);
      break;
    case 'submit-quote':
      submitQuoteForApproval(id!);
      break;
    case 'approve-quote':
      approveQuote(id!);
      break;
    case 'fix-pricing':
      fixQuotePricing(id!);
      break;
    case 'convert-order':
      convertQuoteToOrder(id!);
      break;
    case 'approve-onboarding':
      approveOnboarding(id!);
      break;
    case 'advance-order':
      advanceOrderFulfillment(id!);
      break;
    case 'upload-ticket':
      uploadFieldTicket(id!);
      break;
    case 'release-order':
      releaseOrderHold(id!);
      break;
    case 'generate-invoice':
      generateInvoice(id!);
      break;
    case 'post-invoice':
      postInvoice(id!);
      break;
    case 'release-invoice':
      releaseInvoiceHold(id!);
      break;
    case 'send-invoice':
      sendInvoice(id!);
      break;
    case 'escalate-dunning':
      escalateDunning(id!);
      break;
    case 'record-payment':
      recordPayment(id!);
      break;
    case 'execute-recovery':
      executeRecovery(id!);
      break;
    case 'investigate-dispute':
      investigateDispute(id!, 'Billing discrepancy under review with contract team');
      break;
    case 'resolve-dispute':
      resolveDispute(id!);
      break;
  }
  e?.stopPropagation();
}

function setupQuoteForm(): void {
  const form = document.querySelector<HTMLFormElement>('#create-quote-form');
  if (!form) return;

  const productSelect = form.querySelector<HTMLSelectElement>('#product-select');
  const unitPriceInput = form.querySelector<HTMLInputElement>('#unit-price');
  const preview = form.querySelector<HTMLDivElement>('#quote-preview');
  const qtyInput = form.querySelector<HTMLInputElement>('input[name="quantity"]');
  const discountInput = form.querySelector<HTMLInputElement>('input[name="discountPct"]');

  function updatePreview(): void {
    const qty = Number(qtyInput?.value ?? 1);
    const price = Number(unitPriceInput?.value ?? 0);
    const disc = Number(discountInput?.value ?? 0);
    const total = Math.round(qty * price * (1 - disc / 100));
    if (preview) preview.textContent = `Estimated total: $${total.toLocaleString()}`;
  }

  productSelect?.addEventListener('change', () => {
    const opt = productSelect.selectedOptions[0];
    if (unitPriceInput && opt) unitPriceInput.value = opt.dataset.price ?? '0';
    const vertical = form.querySelector<HTMLSelectElement>('select[name="vertical"]');
    if (vertical && opt?.dataset.vertical) vertical.value = opt.dataset.vertical;
    updatePreview();
  });

  unitPriceInput?.addEventListener('input', updatePreview);
  qtyInput?.addEventListener('input', updatePreview);
  discountInput?.addEventListener('input', updatePreview);

  if (productSelect && unitPriceInput) {
    const opt = productSelect.selectedOptions[0];
    unitPriceInput.value = opt?.dataset.price ?? '135';
    updatePreview();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const productId = fd.get('productId') as string;
    const opt = productSelect?.selectedOptions[0];
    createQuote({
      customerId: fd.get('customerId') as string,
      productId,
      productName: opt?.dataset.name ?? 'Product',
      vertical: fd.get('vertical') as string,
      quantity: Number(fd.get('quantity')),
      unitPrice: Number(fd.get('unitPrice')),
      discountPct: Number(fd.get('discountPct')),
    });
  });
}

function setupUploadForm(): void {
  const form = document.querySelector<HTMLFormElement>('#upload-document-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    uploadFieldTicket(
      fd.get('orderId') as string,
      fd.get('fileName') as string,
      fd.get('docType') as string
    );
    closeModal();
  });
}

function setupDisputeForm(): void {
  const form = document.querySelector<HTMLFormElement>('#create-dispute-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    createDispute(fd.get('invoiceId') as string, fd.get('reason') as string);
  });
}

function setupTagHoldForm(): void {
  const form = document.querySelector<HTMLFormElement>('#tag-hold-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    tagInvoiceHold(fd.get('invoiceId') as string, fd.get('category') as HoldReasonCategory);
    closeModal();
  });
}

export function initApp(): void {
  subscribe(renderApp);
  renderApp();
}
