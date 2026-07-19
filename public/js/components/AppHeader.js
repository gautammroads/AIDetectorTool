import { showToast } from '../utils.js';
import { appState } from '../store.js';

export class AppHeader extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    this.initTheme();
    this.setupListeners();
    
    // Listen for navigation events to update titles
    window.addEventListener('navigate-view', (e) => this.updateTitle(e.detail.view));
  }

  render() {
    this.innerHTML = `
      <header class="app-header">
        <div class="header-title-container">
          <h1 id="view-title">Content Scanner</h1>
          <p id="view-subtitle" class="header-subtitle">Analyze text patterns to identify AI-generated content.</p>
        </div>
        <div class="header-actions">
          <button id="theme-toggle" class="icon-button" aria-label="Toggle Light/Dark Theme">
            <!-- Sun Icon (shown in dark theme) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <!-- Moon Icon (shown in light theme) -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </button>
        </div>
      </header>
    `;
  }

  initTheme() {
    const storedTheme = localStorage.getItem('promptlens_theme') || 'dark';
    
    if (storedTheme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }

  setupListeners() {
    const themeToggle = this.querySelector('#theme-toggle');
    themeToggle.addEventListener('click', () => {
      if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('promptlens_theme', 'light');
        showToast('Theme switched to light mode', 'info');
      } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('promptlens_theme', 'dark');
        showToast('Theme switched to dark mode', 'info');
      }
    });
  }

  updateTitle(viewId) {
    const viewTitle = this.querySelector('#view-title');
    const viewSubtitle = this.querySelector('#view-subtitle');

    const routeDetails = {
      'view-scanner': {
        title: 'Content Scanner',
        subtitle: 'Analyze text patterns to identify AI-generated content.'
      },
      'view-history': {
        title: 'Scan History',
        subtitle: 'Review your previously analyzed text files and reports.'
      },
      'view-analytics': {
        title: 'Linguistic Analytics',
        subtitle: 'Aggregated stylistic markers and metrics across all document scans.'
      },
      'view-settings': {
        title: 'Settings',
        subtitle: 'Manage Gemini Cloud API configuration and detector sensitivity levels.'
      }
    };

    const details = routeDetails[viewId];
    if (details && viewTitle && viewSubtitle) {
      viewTitle.textContent = details.title;
      viewSubtitle.textContent = details.subtitle;
    }
  }
}

customElements.define('app-header', AppHeader);
