import { programMeta } from './data/mockData';
import type { ViewId } from './types';
import { navItems, renderView } from './views/renderViews';

let currentView: ViewId = 'dashboard';

function renderSidebar(): string {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">iN</div>
        <div class="brand-text">
          <strong>iNet Q2C</strong>
          <span>Custom Platform</span>
        </div>
      </div>
      <nav class="nav">
        ${navItems
          .map(
            (item) => `
          <button class="nav-item ${currentView === item.id ? 'active' : ''}" data-view="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            ${item.label}
          </button>`
          )
          .join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="footer-label">Approach</div>
        <p>${programMeta.approach}</p>
        <div class="footer-meta">${programMeta.version}</div>
      </div>
    </aside>`;
}

function renderApp(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `
    <div class="layout">
      ${renderSidebar()}
      <main class="main-content" id="main-content">
        ${renderView(currentView)}
      </main>
    </div>`;

  app.querySelectorAll<HTMLButtonElement>('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view as ViewId;
      if (view && view !== currentView) {
        currentView = view;
        renderApp();
      }
    });
  });
}

export function initApp(): void {
  renderApp();
}
