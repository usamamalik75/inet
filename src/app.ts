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
import { getProduct, products } from './data/catalog';
import type { HoldReasonCategory, ViewId } from './types';
import { formatCurrency } from './utils';
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

  const itemsContainer = form.querySelector<HTMLDivElement>('#quote-line-items');
  const addItemBtn = form.querySelector<HTMLButtonElement>('#add-quote-item');
  const preview = form.querySelector<HTMLDivElement>('#quote-preview');
  if (!itemsContainer || !addItemBtn || !preview) return;
  const lineItemsRoot = itemsContainer;
  const previewEl = preview;

  const productOptions = products
    .map(
      (product) =>
        `<option value="${product.id}" data-price="${product.unitPrice}" data-name="${product.name}">${product.name} - ${formatCurrency(product.unitPrice)}/${product.unit}</option>`
    )
    .join('');

  function renderLineItemRow(index: number): string {
    return `
      <div class="quote-line-item" data-line-item>
        <div class="quote-line-item-header">
          <strong>Item ${index + 1}</strong>
          <button type="button" class="btn btn-secondary quote-line-remove" data-remove-line ${index === 0 ? 'disabled' : ''}>Remove</button>
        </div>
        <div class="form-row quote-line-grid">
          <label>Product<select name="productId" required data-line-product>${productOptions}</select></label>
          <label>Quantity<input type="number" name="quantity" value="1" min="1" required data-line-qty /></label>
          <label>Unit Price ($)<input type="number" name="unitPrice" step="0.01" required data-line-price /></label>
          <label>Discount %<input type="number" name="discountPct" value="0" min="0" max="50" data-line-discount /></label>
        </div>
        <div class="quote-line-subtotal" data-line-subtotal>Line total: $0</div>
      </div>`;
  }

  function syncLineItem(row: HTMLElement): void {
    const productSelect = row.querySelector<HTMLSelectElement>('[data-line-product]');
    const unitPriceInput = row.querySelector<HTMLInputElement>('[data-line-price]');
    const qtyInput = row.querySelector<HTMLInputElement>('[data-line-qty]');
    const discountInput = row.querySelector<HTMLInputElement>('[data-line-discount]');
    const subtotal = row.querySelector<HTMLDivElement>('[data-line-subtotal]');
    if (!productSelect || !unitPriceInput || !qtyInput || !discountInput || !subtotal) return;

    const option = productSelect.selectedOptions[0];
    if (option && (!unitPriceInput.value || document.activeElement === productSelect)) {
      unitPriceInput.value = option.dataset.price ?? '0';
    }

    const qty = Number(qtyInput.value || 0);
    const price = Number(unitPriceInput.value || 0);
    const discount = Number(discountInput.value || 0);
    const total = Math.round(qty * price * (1 - discount / 100));
    subtotal.textContent = `Line total: ${formatCurrency(total)}`;
  }

  function renumberLineItems(): void {
    lineItemsRoot.querySelectorAll<HTMLElement>('[data-line-item]').forEach((row, index, allRows) => {
      const title = row.querySelector('.quote-line-item-header strong');
      const removeBtn = row.querySelector<HTMLButtonElement>('[data-remove-line]');
      if (title) title.textContent = `Item ${index + 1}`;
      if (removeBtn) removeBtn.disabled = allRows.length === 1;
    });
  }

  function updatePreview(): void {
    let total = 0;
    lineItemsRoot.querySelectorAll<HTMLElement>('[data-line-item]').forEach((row) => {
      syncLineItem(row);
      const subtotalText = row.querySelector<HTMLDivElement>('[data-line-subtotal]')?.textContent ?? '';
      const numeric = Number(subtotalText.replace(/[^\d.-]/g, ''));
      total += Number.isFinite(numeric) ? numeric : 0;
    });
    previewEl.textContent = `Estimated total: ${formatCurrency(total)}`;
  }

  function addLineItem(): void {
    lineItemsRoot.insertAdjacentHTML('beforeend', renderLineItemRow(lineItemsRoot.children.length));
    const row = lineItemsRoot.lastElementChild as HTMLElement | null;
    if (!row) return;
    syncLineItem(row);
    renumberLineItems();
    updatePreview();
  }

  addItemBtn.addEventListener('click', () => addLineItem());

  lineItemsRoot.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLElement>('[data-line-item]');
    if (!row) return;
    if (target instanceof HTMLSelectElement && target.matches('[data-line-product]')) {
      const product = getProduct(target.value);
      const unitPriceInput = row.querySelector<HTMLInputElement>('[data-line-price]');
      if (product && unitPriceInput) {
        unitPriceInput.value = String(product.unitPrice);
      }
    }
    updatePreview();
  });

  lineItemsRoot.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-line-item]')) return;
    updatePreview();
  });

  lineItemsRoot.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches('[data-remove-line]')) return;
    const row = target.closest<HTMLElement>('[data-line-item]');
    if (!row) return;
    row.remove();
    renumberLineItems();
    updatePreview();
  });

  addLineItem();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const lineItems = Array.from(lineItemsRoot.querySelectorAll<HTMLElement>('[data-line-item]'))
      .map((row) => {
        const productSelect = row.querySelector<HTMLSelectElement>('[data-line-product]');
        const qtyInput = row.querySelector<HTMLInputElement>('[data-line-qty]');
        const unitPriceInput = row.querySelector<HTMLInputElement>('[data-line-price]');
        const discountInput = row.querySelector<HTMLInputElement>('[data-line-discount]');
        if (!productSelect || !qtyInput || !unitPriceInput || !discountInput) return null;
        const selected = productSelect.selectedOptions[0];
        return {
          productId: productSelect.value,
          productName: selected?.dataset.name ?? selected?.textContent ?? 'Product',
          quantity: Number(qtyInput.value),
          unitPrice: Number(unitPriceInput.value),
          discountPct: Number(discountInput.value),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    createQuote({
      customerId: fd.get('customerId') as string,
      vertical: fd.get('vertical') as string,
      lineItems,
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
