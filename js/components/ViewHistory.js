import { appState, clearHistory, deleteScanItem } from '../store.js';
import { escapeHtml, showToast } from '../utils.js';

export class ViewHistory extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    this.setupListeners();
    
    // Re-render table when history changes
    appState.subscribe(() => {
      // Only render if we are currently looking at history? 
      // It's safe to render the table in the background.
      this.renderHistoryTable();
    });
    
    // Initial render
    this.renderHistoryTable();
  }

  render() {
    this.innerHTML = `
      <section id="view-history" class="view-section" aria-labelledby="view-title">
        <div class="history-layout">
          <div class="card glass-card full-width-card">
            <div class="card-header history-header">
              <div class="history-controls">
                <div class="search-box-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" id="history-search" placeholder="Search saved scans by text or verdict...">
                </div>
                <div class="filter-dropdown-wrapper">
                  <label for="history-filter" class="visually-hidden">Filter by Score</label>
                  <select id="history-filter" aria-label="Filter history items">
                    <option value="all">All Scores</option>
                    <option value="high">High AI Chance (>70%)</option>
                    <option value="mixed">Mixed/Suspicious (30%-70%)</option>
                    <option value="low">Human Likely (<30%)</option>
                  </select>
                </div>
              </div>
              <button class="button danger btn-small" id="btn-clear-history">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Clear All History</span>
              </button>
            </div>
            
            <div class="card-body table-container">
              <table class="history-table" id="history-table">
                <thead>
                  <tr>
                    <th scope="col" style="width: 45%;">Excerpt</th>
                    <th scope="col" style="width: 15%;">Type</th>
                    <th scope="col" style="width: 15%;">Score</th>
                    <th scope="col" style="width: 15%;">Scanned At</th>
                    <th scope="col" style="width: 10%;">Actions</th>
                  </tr>
                </thead>
                <tbody id="history-table-body">
                  <!-- History items injected dynamically -->
                </tbody>
              </table>
              <div class="empty-state hidden" id="history-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <h3>No Scans in History</h3>
                <p>Start scanning files or snippets in the Content Scanner. Your scans will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  setupListeners() {
    this.searchInput = this.querySelector('#history-search');
    this.filterSelect = this.querySelector('#history-filter');
    const btnClearAll = this.querySelector('#btn-clear-history');

    this.searchInput.addEventListener('input', () => this.renderHistoryTable());
    this.filterSelect.addEventListener('change', () => this.renderHistoryTable());
    
    btnClearAll.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete ALL historical scans? This action is irreversible.')) {
        clearHistory();
        showToast('All scan history deleted.', 'info');
      }
    });
  }

  renderHistoryTable() {
    const search = this.searchInput.value.toLowerCase().trim();
    const filter = this.filterSelect.value;
    const tbody = this.querySelector('#history-table-body');
    const emptyState = this.querySelector('#history-empty-state');
    const table = this.querySelector('#history-table');
    
    tbody.innerHTML = '';
    
    const filtered = appState.history.filter(item => {
      const matchesSearch = item.text.toLowerCase().includes(search) || item.verdict.toLowerCase().includes(search);
      
      let matchesFilter = true;
      if (filter === 'high') matchesFilter = item.score > 70;
      else if (filter === 'mixed') matchesFilter = item.score >= 30 && item.score <= 70;
      else if (filter === 'low') matchesFilter = item.score < 30;
      
      return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
      table.classList.add('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    table.classList.remove('hidden');

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      
      const date = new Date(item.timestamp).toLocaleDateString(undefined, { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
      
      let scoreLvlClass = 'lvl-human';
      if (item.score > 70) scoreLvlClass = 'lvl-ai';
      else if (item.score >= 30) scoreLvlClass = 'lvl-mixed';

      tr.innerHTML = `
        <td>
          <div class="history-excerpt" title="${escapeHtml(item.text)}">${escapeHtml(item.excerpt)}</div>
        </td>
        <td>
          <span class="scan-type-badge ${item.mode === 'gemini' ? 'gemini' : 'local'}">
            ${item.mode === 'gemini' ? 'Gemini' : 'Local'}
          </span>
        </td>
        <td>
          <span class="score-badge ${scoreLvlClass}">${item.score}% AI</span>
        </td>
        <td>${date}</td>
        <td>
          <div class="history-actions">
            <button class="button secondary btn-small btn-view-report" data-id="${item.id}" title="View detailed report">
              Report
            </button>
            <button class="button danger btn-small btn-delete-history" data-id="${item.id}" title="Delete scan record">
              &times;
            </button>
          </div>
        </td>
      `;
      
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.dispatchEvent(new CustomEvent('load-scan', { detail: { item }, bubbles: true, composed: true }));
      });

      tr.querySelector('.btn-view-report').addEventListener('click', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-report', { detail: { scanItem: item }, bubbles: true, composed: true }));
      });

      tr.querySelector('.btn-delete-history').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this scan?')) {
          deleteScanItem(item.id);
        }
      });

      tbody.appendChild(tr);
    });
  }
}

customElements.define('view-history', ViewHistory);
