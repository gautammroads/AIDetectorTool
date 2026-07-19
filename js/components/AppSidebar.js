import { appState } from '../store.js';

export class AppSidebar extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    this.setupListeners();
    
    // Subscribe to state changes to update the API badge
    appState.subscribe(() => this.updateApiBadge());
    this.updateApiBadge(); // Initial state
  }

  render() {
    this.innerHTML = `
      <aside class="sidebar" aria-label="Main Navigation">
        <div class="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span class="logo-text">promptlens-ai</span>
        </div>
        
        <nav class="sidebar-nav">
          <button class="nav-item active" id="nav-btn-scanner" data-view="view-scanner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8H4v-8"/><path d="M15 12V7c0-2-1.5-3-3-3s-3 1-3 3v5"/></svg>
            <span>Scanner</span>
          </button>
          <button class="nav-item" id="nav-btn-history" data-view="view-history">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            <span>Scan History</span>
          </button>
          <button class="nav-item" id="nav-btn-analytics" data-view="view-analytics">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Analytics</span>
          </button>
          <button class="nav-item" id="nav-btn-settings" data-view="view-settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Settings</span>
          </button>
        </nav>
        
        <div class="sidebar-footer">
          <div class="api-status-badge offline" id="sidebar-api-badge">
            <span class="status-dot"></span>
            <span class="status-text">Local Mode</span>
          </div>
        </div>
      </aside>
    `;
  }

  setupListeners() {
    const navButtons = this.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.view;
        // Dispatch custom event for routing
        this.dispatchEvent(new CustomEvent('navigate', { 
          detail: { view: targetView },
          bubbles: true, 
          composed: true 
        }));
        
        // Update active class
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  updateApiBadge() {
    const badge = this.querySelector('#sidebar-api-badge');
    const statusText = badge.querySelector('.status-text');
    
    if (appState.settings.apiKey) {
      badge.className = "api-status-badge connected";
      statusText.textContent = "Gemini Scanner Ready";
    } else {
      badge.className = "api-status-badge offline";
      statusText.textContent = "Local Heuristics Mode";
    }
  }
}

customElements.define('app-sidebar', AppSidebar);
