import { appState, saveScanToHistory, setScanMode, setScannedData, AI_CLICHES } from '../store.js';
import { showToast, delay } from '../utils.js';
import { analyzeTextLocally, analyzeTextWithGemini } from '../scanner-logic.js';

export class ViewScanner extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    this.setupListeners();
    
    // Subscribe to state to update scanner mode visually if needed
    appState.subscribe(() => this.updateStateVisually());
  }

  render() {
    this.innerHTML = `
      <section id="view-scanner" class="view-section active" aria-labelledby="view-title">
        <div class="scanner-layout redesigned">
          <!-- Left Side: AI Detection Report (Dashboard) -->
          <div class="scanner-left-panel ai-report-panel">
            <div class="card glass-card report-card" id="metrics-card">
              <div class="card-header">
                <h3>AI Detection Report</h3>
              </div>
              <div class="card-body report-body">
                <!-- Overall Probability Gauge -->
                <div class="score-gauge-container minimalist">
                  <svg class="score-radial-svg" viewBox="0 0 120 120">
                    <circle class="radial-track" cx="60" cy="60" r="50"></circle>
                    <circle class="radial-progress-bar" id="score-radial-progress" cx="60" cy="60" r="50" transform="rotate(-90 60 60)"></circle>
                  </svg>
                  <div class="gauge-center-text">
                    <span class="gauge-score-value" id="gauge-score-pct">0%</span>
                  </div>
                  <div class="gauge-side-text">
                    <span class="gauge-score-label">Overall</span>
                    <span class="gauge-score-sublabel" id="verdict-text-summary">No data</span>
                  </div>
                </div>
                
                <!-- Sentence Analysis Chart -->
                <div class="chart-container">
                  <h4>Sentence Analysis</h4>
                  <div class="chart-wrapper">
                    <canvas id="sentenceChart"></canvas>
                  </div>
                </div>
                
                <!-- Probability trend Chart -->
                <div class="chart-container">
                  <h4>Probability trend</h4>
                  <div class="chart-wrapper">
                    <canvas id="trendChart"></canvas>
                  </div>
                </div>
                
                <!-- Simple Metrics List -->
                <div class="simple-metrics-list">
                  <div class="metric-row">
                    <span class="metric-label">Readability Score</span>
                    <span class="metric-val" id="metric-val-readability">--</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Vocabulary Richness</span>
                    <span class="metric-val" id="metric-val-diversity">--</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Flow & Tone</span>
                    <span class="metric-val">Professional</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Plagiarism</span>
                    <span class="metric-val">3%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sentence Feedback Context Card (Hidden initially) -->
            <div class="card glass-card hidden report-card" id="sentence-feedback-card">
              <div class="card-header flex-header">
                <h3>Sentence Detail</h3>
                <button class="icon-button close-card-btn" id="btn-close-sentence-card" aria-label="Close sentence details">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div class="card-body">
                <p class="selected-sentence-text" id="feedback-sentence-text">Select a highlighted sentence to see detailed parameters.</p>
                <hr class="card-divider" style="margin: 16px 0; border-color: rgba(255,255,255,0.05);">
                <div class="sentence-metrics-breakdown" style="display: flex; flex-direction: column; gap: 16px;">
                  <div class="sentence-meta-item">
                    <span class="meta-label" style="font-size: 0.8rem; color: var(--text-muted);">Sentence Score</span><br>
                    <span class="meta-value score-number" id="feedback-sentence-score" style="font-size: 1.2rem; font-weight: 700;">--</span>
                  </div>
                  <div class="sentence-meta-item">
                    <span class="meta-label" style="font-size: 0.8rem; color: var(--text-muted);">Length Parameters</span><br>
                    <span class="meta-value" id="feedback-sentence-length" style="font-weight: 600;">--</span>
                  </div>
                  <div class="sentence-meta-item">
                    <span class="meta-label" style="font-size: 0.8rem; color: var(--text-muted);">Diagnostic Markers</span><br>
                    <span class="meta-value highlighted-list" id="feedback-sentence-markers" style="font-weight: 600; display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px;">--</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Side: Document View -->
          <div class="scanner-right-panel document-panel">
            <div class="card glass-card document-card">
              <div class="card-header flex-header doc-header">
                <span class="doc-title" id="doc-title-display">Document: Untitled.txt</span>
                <div class="scan-mode-toggle">
                  <button id="btn-mode-local" class="mode-btn active" title="Use fast local heuristic analysis">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                    Local
                  </button>
                  <button id="btn-mode-gemini" class="mode-btn" title="Use Gemini Deep Scan for accurate results">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19c-1.5 0-3-.5-4.5-1.5-1.5 1-3 1.5-4.5 1.5-3 0-5.5-2.5-5.5-5.5 0-1.5.5-3 1.5-4.5C3.5 7.5 3 6 3 4.5 3 3 4.5 3 6 4.5c1.5-1 3-1.5 4.5-1.5 3 0 5.5 2.5 5.5 5.5 0 1.5-.5 3-1.5 4.5C15.5 14.5 16 16 16 17.5c0 1.5-1.5 1.5-3 0 1.5 1 3 1.5 4.5 1.5z"></path></svg>
                    Gemini
                  </button>
                </div>
              </div>
              
              <!-- Editor Input Mode -->
              <div class="card-body input-body-area" id="input-container-card">
                <div class="textarea-wrapper">
                  <textarea id="text-input" placeholder="Paste your text here to analyze..." aria-label="Writing input for AI analysis"></textarea>
                  
                  <div class="textarea-spinner-overlay" id="scan-progress-overlay">
                    <div class="spinner-container">
                      <div class="glow-spinner"></div>
                      <p class="loading-status-text" id="scan-loading-text">Analyzing...</p>
                      <div class="loading-progress-bar-container">
                        <div class="loading-progress-bar-fill" id="scan-progress-bar"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Highlight Mode -->
              <div class="card-body scrollable-body hidden" id="results-highlighting-card">
                <div class="highlighted-text-content redesigned-highlights" id="highlighted-output-area"></div>
              </div>
              
              <div class="card-footer document-footer">
                <div class="footer-left">
                  <button class="button btn-small-neon" id="btn-analyze-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                    <span>Rescan</span>
                  </button>
                </div>
                <div class="footer-right">
                  <button class="button secondary btn-small" id="btn-export-report">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Download Report</span>
                  </button>
                  <button class="button primary btn-small-white" id="btn-clear-text">
                    <span>New Analysis</span>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Hidden inputs needed for existing logic -->
            <input type="file" id="file-upload" accept=".txt,.md" class="visually-hidden">
            <div id="drag-overlay" class="visually-hidden"></div>
            <div id="char-count" class="visually-hidden"></div>
            <div id="word-count" class="visually-hidden"></div>
            <div id="btn-back-to-input" class="visually-hidden"></div>
            <div id="scan-timestamp" class="visually-hidden"></div>
          </div>
        </div>
      </section>
    `;
  }

  setupListeners() {
    this.textInput = this.querySelector('#text-input');
    const btnClear = this.querySelector('#btn-clear-text');
    const btnAnalyze = this.querySelector('#btn-analyze-text');
    
    this.textInput.addEventListener('input', () => this.validateInputLength());
    
    btnClear.addEventListener('click', () => {
      this.textInput.value = '';
      this.querySelector('#results-highlighting-card').classList.add('hidden');
      this.querySelector('#input-container-card').classList.remove('hidden');
      this.resetGaugeAndScorecard();
      this.validateInputLength();
      showToast('Text cleared', 'info');
    });

    const btnModeLocal = this.querySelector('#btn-mode-local');
    const btnModeGemini = this.querySelector('#btn-mode-gemini');
    
    btnModeLocal.addEventListener('click', () => {
      setScanMode('local');
      btnModeLocal.classList.add('active');
      btnModeGemini.classList.remove('active');
      showToast('Switched to local analysis mode (offline)', 'info');
    });
    
    btnModeGemini.addEventListener('click', () => {
      if (!appState.settings.apiKey) {
        showToast('Gemini API key missing. Switched to Settings tab.', 'error');
        this.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'view-settings' }, bubbles: true, composed: true }));
        return;
      }
      setScanMode('gemini');
      btnModeGemini.classList.add('active');
      btnModeLocal.classList.remove('active');
      showToast('Switched to Gemini Deep Scan mode (cloud)', 'info');
    });

    const dragOverlay = this.querySelector('#drag-overlay');
    
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (appState.currentView === 'view-scanner') {
        dragOverlay.classList.add('active');
      }
    });

    dragOverlay.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragOverlay.classList.remove('active');
    });

    dragOverlay.addEventListener('drop', (e) => {
      e.preventDefault();
      dragOverlay.classList.remove('active');
      
      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.textInput.value = event.target.result;
            this.validateInputLength();
            showToast(`Loaded file: ${file.name}`, 'success');
          };
          reader.readAsText(file);
        } else {
          showToast('Invalid file format. Please upload .txt or .md files.', 'error');
        }
      }
    });

    const fileUpload = this.querySelector('#file-upload');
    fileUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.textInput.value = event.target.result;
          this.validateInputLength();
          showToast(`Loaded file: ${file.name}`, 'success');
          fileUpload.value = '';
        };
        reader.readAsText(file);
      }
    });

    btnAnalyze.addEventListener('click', () => {
      const text = this.textInput.value.trim();
      if (text.length < 100) {
        showToast('Text must be at least 100 characters for analysis.', 'error');
        return;
      }
      this.runScanner(text);
    });

    this.querySelector('#btn-back-to-input').addEventListener('click', () => {
      this.querySelector('#results-highlighting-card').classList.add('hidden');
      this.querySelector('#input-container-card').classList.remove('hidden');
      this.querySelector('#sentence-feedback-card').classList.add('hidden');
      this.querySelector('#metrics-card').classList.remove('hidden');
      this.resetGaugeAndScorecard();
    });

    this.querySelector('#btn-close-sentence-card').addEventListener('click', () => {
      this.querySelector('#sentence-feedback-card').classList.add('hidden');
      this.querySelector('#metrics-card').classList.remove('hidden');
      this.querySelectorAll('.highlight-sentence').forEach(span => {
        span.classList.remove('selected');
      });
    });

    this.querySelector('#btn-export-report').addEventListener('click', () => {
      if (appState.scannedData) {
        this.dispatchEvent(new CustomEvent('open-report', { detail: { scanItem: appState.scannedData }, bubbles: true, composed: true }));
      }
    });

    // Provide a way to load external data (from history)
    window.addEventListener('load-scan', (e) => {
      const item = e.detail.item;
      this.textInput.value = item.text;
      this.validateInputLength();
      
      setScanMode(item.mode);
      if (item.mode === 'gemini') {
        btnModeGemini.classList.add('active');
        btnModeLocal.classList.remove('active');
      } else {
        btnModeLocal.classList.add('active');
        btnModeGemini.classList.remove('active');
      }
      
      this.displayScannerResults(item);
      showToast('Loaded scan from history.', 'success');
    });
  }

  updateStateVisually() {
    // Sync mode if changed from somewhere else
    const btnModeLocal = this.querySelector('#btn-mode-local');
    const btnModeGemini = this.querySelector('#btn-mode-gemini');
    if (appState.scanMode === 'gemini') {
      btnModeGemini?.classList.add('active');
      btnModeLocal?.classList.remove('active');
    } else {
      btnModeLocal?.classList.add('active');
      btnModeGemini?.classList.remove('active');
    }
  }

  validateInputLength() {
    const text = this.textInput.value;
    this.querySelector('#btn-analyze-text').disabled = text.trim().length < 50;
  }

  resetGaugeAndScorecard() {
    const circle = this.querySelector('#score-radial-progress');
    if(circle) circle.style.strokeDashoffset = '314.159';
    
    const scorePct = this.querySelector('#gauge-score-pct');
    if(scorePct) scorePct.textContent = '0%';
    
    const verdictText = this.querySelector('#verdict-text-summary');
    if(verdictText) verdictText.textContent = 'No data';
    
    this.updateBar('#metric-val-diversity', '0.00');
    this.updateBar('#metric-val-readability', '0.0');
    
    if (this.sentenceChartInstance) {
      this.sentenceChartInstance.destroy();
    }
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
    }
  }

  updateBar(valId, val) {
    const txt = this.querySelector(valId);
    if(txt) txt.textContent = val;
  }

  async runScanner(text) {
    const overlay = this.querySelector('#scan-progress-overlay');
    const progressBar = this.querySelector('#scan-progress-bar');
    const statusText = this.querySelector('#scan-loading-text');
    
    overlay.classList.add('active');
    progressBar.style.width = '0%';
    
    if (appState.scanMode === 'local') {
      statusText.textContent = 'Tokenizing text sentences...';
      await delay(300);
      progressBar.style.width = '30%';
      
      statusText.textContent = 'Measuring standard sentence burstiness...';
      await delay(300);
      progressBar.style.width = '65%';
      
      statusText.textContent = 'Calculating Zipf-law TTR vocabulary coefficients...';
      await delay(250);
      progressBar.style.width = '90%';
      
      try {
        const results = analyzeTextLocally(text);
        progressBar.style.width = '100%';
        await delay(150);
        
        overlay.classList.remove('active');
        this.displayScannerResults(results);
        saveScanToHistory(results);
        showToast('Linguistic analysis complete!', 'success');
      } catch (err) {
        overlay.classList.remove('active');
        showToast('Error during local scan: ' + err.message, 'error');
      }
    } else {
      statusText.textContent = 'Constructing payload queries...';
      progressBar.style.width = '15%';
      await delay(200);
      
      statusText.textContent = 'Connecting to Google Gemini API servers...';
      progressBar.style.width = '40%';
      
      try {
        const results = await analyzeTextWithGemini(text, (status, pct) => {
          statusText.textContent = status;
          progressBar.style.width = `${pct}%`;
        });
        
        progressBar.style.width = '100%';
        overlay.classList.remove('active');
        this.displayScannerResults(results);
        saveScanToHistory(results);
        showToast('Gemini deep scan complete!', 'success');
      } catch (err) {
        overlay.classList.remove('active');
        showToast(err.message, 'error');
      }
    }
  }

  displayScannerResults(data) {
    setScannedData(data);
    
    this.querySelector('#input-container-card').classList.add('hidden');
    this.querySelector('#results-highlighting-card').classList.remove('hidden');

    const outputArea = this.querySelector('#highlighted-output-area');
    outputArea.innerHTML = '';
    
    data.sentenceEvaluations.forEach(evalItem => {
      const span = document.createElement('span');
      span.textContent = evalItem.text + ' ';
      span.className = 'highlight-sentence redesigned-span';
      span.dataset.index = evalItem.index;
      
      if (evalItem.aiScore > 70) {
        span.classList.add('lvl-ai-neon');
      } else if (evalItem.aiScore > 30) {
        span.classList.add('lvl-mixed-neon');
      } else {
        span.classList.add('lvl-human-neon');
      }
      
      span.addEventListener('click', () => {
        console.log("Sentence clicked!", evalItem.text);
        this.querySelectorAll('.highlight-sentence').forEach(s => s.classList.remove('selected'));
        span.classList.add('selected');
        this.showSentenceDetail(evalItem);
      });
      
      outputArea.appendChild(span);
    });

    this.renderScoreGauge(data.score, data.verdict);
    this.renderScorecard(data.metrics);
    this.renderCharts();
  }

  renderScoreGauge(score, verdict) {
    const percentText = this.querySelector('#gauge-score-pct');
    const circle = this.querySelector('#score-radial-progress');
    const verdictText = this.querySelector('#verdict-text-summary');
    
    let currentVal = 0;
    const targetVal = score;
    const speed = 15;
    
    const interval = setInterval(() => {
      if (currentVal >= targetVal) {
        percentText.textContent = `${targetVal}%`;
        clearInterval(interval);
      } else {
        currentVal++;
        percentText.textContent = `${currentVal}%`;
      }
    }, speed);
    
    const offset = 314.159 - (314.159 * score) / 100;
    circle.style.strokeDashoffset = offset;
    
    if (score > 70) {
      circle.style.stroke = 'var(--color-ai-neon)';
    } else if (score > 30) {
      circle.style.stroke = 'var(--color-mixed-neon)';
    } else {
      circle.style.stroke = 'var(--color-human-neon)';
    }
    
    verdictText.textContent = 'High Probability';
    if (score < 30) verdictText.textContent = 'Human Written';
    if (score >= 30 && score <= 70) verdictText.textContent = 'Mixed Content';
  }

  renderScorecard(metrics) {
    this.updateBar('#metric-val-diversity', `High - ${(metrics.diversity).toFixed(0)}%`);
    
    let readStatus = "Good";
    if (metrics.readability < 40) readStatus = "Hard";
    if (metrics.readability > 80) readStatus = "Easy";
    this.updateBar('#metric-val-readability', `${metrics.readability.toFixed(0)} - ${readStatus}`);
  }

  renderCharts() {
    if (this.sentenceChartInstance) this.sentenceChartInstance.destroy();
    if (this.trendChartInstance) this.trendChartInstance.destroy();
    
    const ctxSentence = this.querySelector('#sentenceChart');
    const ctxTrend = this.querySelector('#trendChart');
    
    if (ctxSentence && window.Chart) {
      this.sentenceChartInstance = new Chart(ctxSentence, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: '#22d3ee',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
          }
        }
      });
    }

    if (ctxTrend && window.Chart) {
      this.trendChartInstance = new Chart(ctxTrend, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            data: [10, 40, 35, 75, 50, 90],
            borderColor: '#a78bfa',
            borderWidth: 2,
            pointBackgroundColor: '#a78bfa',
            pointRadius: 3,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
          }
        }
      });
    }
  }

  showSentenceDetail(evalItem) {
    this.querySelector('#metrics-card').classList.add('hidden');
    const detailCard = this.querySelector('#sentence-feedback-card');
    detailCard.classList.remove('hidden');
    
    this.querySelector('#feedback-sentence-text').textContent = `"${evalItem.text}"`;
    
    const scoreVal = this.querySelector('#feedback-sentence-score');
    scoreVal.textContent = `${evalItem.aiScore}% AI`;
    
    if (evalItem.aiScore > 70) {
      scoreVal.style.color = 'var(--color-ai-neon)';
      scoreVal.style.backgroundColor = 'transparent';
    } else if (evalItem.aiScore > 30) {
      scoreVal.style.color = 'var(--color-mixed-neon)';
      scoreVal.style.backgroundColor = 'transparent';
    } else {
      scoreVal.style.color = 'var(--color-human-neon)';
      scoreVal.style.backgroundColor = 'transparent';
    }
    
    const wordCount = (evalItem.text.match(/\b[\w'-]+\b/g) || []).length;
    this.querySelector('#feedback-sentence-length').textContent = `${wordCount} words`;
    
    const markersContainer = this.querySelector('#feedback-sentence-markers');
    markersContainer.innerHTML = '';
    
    let tags = [];
    AI_CLICHES.forEach(cliche => {
      if (evalItem.text.toLowerCase().includes(cliche)) {
        tags.push(cliche);
      }
    });
    
    const passiveVoicePattern = /\b(am|is|are|was|were|be|been|being)\b\s+\w+ed\b/i;
    if (passiveVoicePattern.test(evalItem.text)) {
      tags.push('passive voice');
    }

    if (tags.length === 0) {
      markersContainer.textContent = 'None detected';
    } else {
      tags.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'marker-tag';
        badge.textContent = tag;
        markersContainer.appendChild(badge);
      });
    }
  }
}

customElements.define('view-scanner', ViewScanner);
