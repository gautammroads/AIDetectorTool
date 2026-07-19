import { escapeHtml } from '../utils.js';

export class ReportModal extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    this.setupListeners();
    
    window.addEventListener('open-report', (e) => this.openModal(e.detail.scanItem));
  }

  render() {
    this.innerHTML = `
      <!-- Detail Dialog Report Modal (native html <dialog>) -->
      <dialog class="modal-dialog glass-modal" id="modal-report-details" aria-labelledby="modal-report-title">
        <div class="modal-content">
          <header class="modal-header">
            <h2 id="modal-report-title">Scan Analysis Report</h2>
            <button class="close-modal-btn" id="btn-close-report-modal" aria-label="Close report details">&times;</button>
          </header>
          <div class="modal-body" id="modal-report-body">
            <!-- Dynmically filled in JS -->
          </div>
          <footer class="modal-footer">
            <button class="button secondary" id="btn-print-report">Print Report</button>
            <button class="button primary" id="btn-close-report-modal-footer">Close</button>
          </footer>
        </div>
      </dialog>
    `;
  }

  setupListeners() {
    this.dialog = this.querySelector('#modal-report-details');
    const btnClose1 = this.querySelector('#btn-close-report-modal');
    const btnClose2 = this.querySelector('#btn-close-report-modal-footer');
    const btnPrint = this.querySelector('#btn-print-report');

    const closeModal = () => this.dialog.close();
    
    btnClose1.addEventListener('click', closeModal);
    btnClose2.addEventListener('click', closeModal);
    
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        closeModal();
      }
    });

    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  openModal(data) {
    if (!data) return;

    const body = this.querySelector('#modal-report-body');
    const dateStr = new Date(data.timestamp).toLocaleString();

    let verdictClass = 'human';
    if (data.score > 70) verdictClass = 'ai';
    else if (data.score >= 30) verdictClass = 'mixed';

    body.innerHTML = `
      <div class="report-header-info">
        <div class="report-main-score">
          <span class="report-score-val ${verdictClass}">${data.score}%</span>
          <span class="report-score-label">AI Probability</span>
        </div>
        <div class="report-meta">
          <p><strong>Verdict:</strong> ${escapeHtml(data.verdict)}</p>
          <p><strong>Mode:</strong> ${data.mode === 'gemini' ? 'Gemini Deep Scan' : 'Local Heuristics'}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
        </div>
      </div>
      
      <h3>Summary</h3>
      <p>${escapeHtml(data.explanation)}</p>
      
      <div class="report-metrics-grid">
        <div class="report-metric">
          <span class="lbl">Burstiness</span>
          <span class="val">${(data.metrics.burstiness / 10).toFixed(1)}</span>
        </div>
        <div class="report-metric">
          <span class="lbl">Lexical Diversity</span>
          <span class="val">${(data.metrics.diversity / 100).toFixed(2)}</span>
        </div>
        <div class="report-metric">
          <span class="lbl">AI Phrase Density</span>
          <span class="val">${data.metrics.cliches}%</span>
        </div>
      </div>

      <hr class="card-divider" />
      
      <h3>Original Text Analyzed</h3>
      <div class="report-text-block">
        ${escapeHtml(data.text)}
      </div>
    `;

    this.dialog.showModal();
  }
}

customElements.define('report-modal', ReportModal);
