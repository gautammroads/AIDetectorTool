import { appState, switchView } from './store.js';
import './components/AppSidebar.js';
import './components/AppHeader.js';
import './components/ViewScanner.js';
import './components/ViewHistory.js';
import './components/ViewAnalytics.js';
import './components/ViewSettings.js';
import './components/ReportModal.js';

class AppMain {
  constructor() {
    this.init();
  }

  init() {
    // Listen for navigation events
    window.addEventListener('navigate', (e) => {
      if (e.detail && e.detail.view) {
        this.navigateTo(e.detail.view);
      }
    });

    // Sub to app state changes for view changes
    appState.subscribe(() => this.updateViewVisibility());
    
    // Initial view
    this.updateViewVisibility();
    
    // Dispatch initial title update
    window.dispatchEvent(new CustomEvent('navigate-view', { 
      detail: { view: appState.currentView },
      bubbles: true, 
      composed: true 
    }));
  }

  navigateTo(viewId) {
    switchView(viewId);
    window.dispatchEvent(new CustomEvent('navigate-view', { 
      detail: { view: viewId },
      bubbles: true, 
      composed: true 
    }));
  }

  updateViewVisibility() {
    const currentView = appState.currentView;
    const views = document.querySelectorAll('.view-section');
    
    views.forEach(view => {
      if (view.id === currentView) {
        view.classList.add('active');
        view.classList.remove('hidden'); // Optional utility if we change from active to hidden
      } else {
        view.classList.remove('active');
        view.classList.add('hidden'); // Ensure it is hidden
      }
    });
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  new AppMain();
});
