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
        <div class="scanner-layout">
          <!-- Left Side: Input & Text View Area -->
          <div class="scanner-left-panel">
            <!-- Input State Card -->
            <div class="card glass-card" id="input-container-card">
              <div class="card-header">
                <div class="tab-selectors">
                  <button class="tab-select active" id="btn-mode-local">
                    <span>Linguistic Analysis</span>
                    <span class="badge">Offline</span>
                  </button>
                  <button class="tab-select" id="btn-mode-gemini">
                    <span>Gemini Deep Scan</span>
                    <span class="badge premium">Cloud AI</span>
                  </button>
                </div>
                <div class="file-upload-wrapper">
                  <label for="file-upload" class="upload-trigger-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span>Upload Doc</span>
                  </label>
                  <input type="file" id="file-upload" accept=".txt,.md" class="visually-hidden">
                </div>
              </div>
              
              <div class="card-body input-body-area">
                <div class="drag-drop-overlay" id="drag-overlay">
                  <div class="drag-overlay-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="pulse-animation"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <h3>Drop your document here</h3>
                    <p>Supports .txt and .md files</p>
                  </div>
                </div>

                <div class="textarea-wrapper">
                  <textarea id="text-input" placeholder="Paste your text here to analyze... (minimum 100 characters for optimal accuracy)" aria-label="Writing input for AI analysis"></textarea>
                  
                  <div class="textarea-spinner-overlay" id="scan-progress-overlay">
                    <div class="spinner-container">
                      <div class="glow-spinner"></div>
                      <p class="loading-status-text" id="scan-loading-text">Analyzing linguistic structures...</p>
                      <div class="loading-progress-bar-container">
                        <div class="loading-progress-bar-fill" id="scan-progress-bar"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer input-footer">
                <div class="word-stats">
                  <span id="char-count">0 characters</span>
                  <span class="dot-separator">•</span>
                  <span id="word-count">0 words</span>
                </div>
                <div class="action-buttons">
                  <button class="button secondary" id="btn-clear-text">Clear</button>
                  <button class="button primary" id="btn-analyze-text" disabled>
                    <span class="btn-text">Analyze Content</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Output Results Highlighting View -->
            <div class="card glass-card hidden" id="results-highlighting-card">
              <div class="card-header flex-header">
                <div class="title-with-icon">
                  <button class="icon-button back-arrow-btn" id="btn-back-to-input" aria-label="Go back to input text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  </button>
                  <div>
                    <h3>Highlighted Analysis</h3>
                    <p class="subtitle">Click colored sentences to review stylistic markers.</p>
                  </div>
                </div>
                <div class="highlight-legends">
                  <span class="legend-item"><span class="legend-dot ai"></span>AI Likely</span>
                  <span class="legend-item"><span class="legend-dot mixed"></span>Suspicious</span>
                  <span class="legend-item"><span class="legend-dot human"></span>Human</span>
                </div>
              </div>
              
              <div class="card-body scrollable-body">
                <div class="highlighted-text-content" id="highlighted-output-area"></div>
              </div>
              
              <div class="card-footer results-details-footer">
                <p class="footer-note" id="scan-timestamp">Scanned on Jul 19, 2026</p>
                <button class="button secondary btn-small" id="btn-export-report">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Side: Metrics Dashboard Panels -->
          <div class="scanner-right-panel">
            <!-- Score Gauge Widget -->
            <div class="card glass-card flex-card center-content" id="score-widget">
              <div class="card-body gauge-body">
                <div class="score-gauge-container">
                  <svg class="score-radial-svg" viewBox="0 0 120 120">
                    <!-- Background circle -->
                    <circle class="radial-track" cx="60" cy="60" r="50"></circle>
                    <!-- Foreground progress circle -->
                    <circle class="radial-progress-bar" id="score-radial-progress" cx="60" cy="60" r="50" transform="rotate(-90 60 60)"></circle>
                  </svg>
                  <div class="gauge-center-text">
                    <span class="gauge-score-value" id="gauge-score-pct">0%</span>
                    <span class="gauge-score-label">AI Probability</span>
                  </div>
                </div>
                <div class="verdict-banner" id="verdict-banner-badge">
                  <span id="verdict-text-summary">No content scanned</span>
                </div>
                <p class="gauge-explanation" id="gauge-explanation-desc">
                  Paste some content and click "Analyze Content" to start the metrics check.
                </p>
              </div>
            </div>

            <!-- Sentence Feedback Context Card -->
            <div class="card glass-card hidden" id="sentence-feedback-card">
              <div class="card-header">
                <h3>Sentence Detail</h3>
                <button class="close-card-btn" id="btn-close-sentence-card" aria-label="Close sentence details">×</button>
              </div>
              <div class="card-body">
                <p class="selected-sentence-text" id="feedback-sentence-text">Select a highlighted sentence to see detailed parameters.</p>
                <hr class="card-divider">
                <div class="sentence-metrics-breakdown">
                  <div class="sentence-meta-item">
                    <span class="meta-label">Sentence Score</span>
                    <span class="meta-value score-number" id="feedback-sentence-score">--</span>
                  </div>
                  <div class="sentence-meta-item">
                    <span class="meta-label">Length Parameters</span>
                    <span class="meta-value" id="feedback-sentence-length">--</span>
                  </div>
                  <div class="sentence-meta-item">
                    <span class="meta-label">Diagnostic Markers</span>
                    <span class="meta-value highlighted-list" id="feedback-sentence-markers">--</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Main Metrics Overview -->
            <div class="card glass-card" id="metrics-card">
              <div class="card-header">
                <h3>Linguistic Scorecard</h3>
              </div>
              <div class="card-body scorecard-grid">
                <!-- Metric Item: Burstiness -->
                <div class="metric-progress-item">
                  <div class="metric-label-row">
                    <span class="metric-title" id="metric-title-burstiness">Burstiness (Sentence Variance)</span>
                    <span class="metric-value-text" id="metric-val-burstiness">0.0</span>
                  </div>
                  <div class="metric-bar-container" title="Low variance indicates typical AI uniformity. High variance suggests human style.">
                    <div class="metric-bar-fill" id="metric-bar-burstiness" style="width: 0%"></div>
                  </div>
                  <span class="metric-description" id="metric-desc-burstiness">Uniform sentence length is a key AI marker.</span>
                </div>

                <!-- Metric Item: Lexical Diversity -->
                <div class="metric-progress-item">
                  <div class="metric-label-row">
                    <span class="metric-title" id="metric-title-diversity">Vocabulary Richness (TTR)</span>
                    <span class="metric-value-text" id="metric-val-diversity">0.00</span>
                  </div>
                  <div class="metric-bar-container" title="Lower lexical diversity points to repetitive structures typical of AI.">
                    <div class="metric-bar-fill" id="metric-bar-diversity" style="width: 0%"></div>
                  </div>
                  <span class="metric-description" id="metric-desc-diversity">Repetitive and simple language distributions.</span>
                </div>

                <!-- Metric Item: AI Clichés -->
                <div class="metric-progress-item">
                  <div class="metric-label-row">
                    <span class="metric-title" id="metric-title-cliches">AI Phrase Density</span>
                    <span class="metric-value-text" id="metric-val-cliches">0%</span>
                  </div>
                  <div class="metric-bar-container" title="Density of stereotypical words like 'delve', 'testament', 'tapestry'.">
                    <div class="metric-bar-fill" id="metric-bar-cliches" style="width: 0%"></div>
                  </div>
                  <span class="metric-description" id="metric-desc-cliches">Stereotypical transitions (e.g. 'delve', 'testament').</span>
                </div>

                <!-- Metric Item: Readability Index -->
                <div class="metric-progress-item">
                  <div class="metric-label-row">
                    <span class="metric-title" id="metric-title-readability">Flesch Reading Ease</span>
                    <span class="metric-value-text" id="metric-val-readability">0.0</span>
                  </div>
                  <div class="metric-bar-container" title="Calculates structural readability. Extremely high or low can indicate different origins.">
                    <div class="metric-bar-fill" id="metric-bar-readability" style="width: 0%"></div>
                  </div>
                  <span class="metric-description" id="metric-desc-readability">Readability difficulty index.</span>
                </div>
              </div>
            </div>
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
    const wordCount = (text.trim().match(/\b[\w'-]+\b/g) || []).length;
    
    this.querySelector('#char-count').textContent = `${text.length} characters`;
    this.querySelector('#word-count').textContent = `${wordCount} words`;
    
    this.querySelector('#btn-analyze-text').disabled = text.trim().length < 100;
  }

  resetGaugeAndScorecard() {
    const circle = this.querySelector('#score-radial-progress');
    if(circle) circle.style.strokeDashoffset = '314.159';
    
    const scorePct = this.querySelector('#gauge-score-pct');
    if(scorePct) scorePct.textContent = '0%';
    
    const badge = this.querySelector('#verdict-banner-badge');
    if(badge) {
      badge.className = 'verdict-banner';
      badge.querySelector('#verdict-text-summary').textContent = 'No content scanned';
    }
    
    const expl = this.querySelector('#gauge-explanation-desc');
    if(expl) expl.textContent = 'Paste some content and click "Analyze Content" to start the metrics check.';
    
    this.updateBar('#metric-bar-burstiness', '0%', '#metric-val-burstiness', '0.0');
    this.updateBar('#metric-bar-diversity', '0%', '#metric-val-diversity', '0.00');
    this.updateBar('#metric-bar-cliches', '0%', '#metric-val-cliches', '0%');
    this.updateBar('#metric-bar-readability', '0%', '#metric-val-readability', '0.0');
  }

  updateBar(barId, width, valId, val) {
    const bar = this.querySelector(barId);
    if(bar) bar.style.width = width;
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
      span.className = 'highlight-sentence';
      span.dataset.index = evalItem.index;
      
      if (evalItem.aiScore > 70) {
        span.classList.add('lvl-ai');
      } else if (evalItem.aiScore > 30) {
        span.classList.add('lvl-mixed');
      } else {
        span.classList.add('lvl-human');
      }
      
      span.addEventListener('click', () => {
        this.querySelectorAll('.highlight-sentence').forEach(s => s.classList.remove('selected'));
        span.classList.add('selected');
        this.showSentenceDetail(evalItem);
      });

      outputArea.appendChild(span);
    });

    this.renderScoreGauge(data.score, data.verdict);
    this.querySelector('#gauge-explanation-desc').textContent = data.explanation;
    this.renderScorecard(data.metrics);
    
    const dateStr = new Date(data.timestamp).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    this.querySelector('#scan-timestamp').textContent = `Scanned on ${dateStr}`;
  }

  renderScoreGauge(score, verdict) {
    const percentText = this.querySelector('#gauge-score-pct');
    const circle = this.querySelector('#score-radial-progress');
    const badge = this.querySelector('#verdict-banner-badge');
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
      circle.style.stroke = 'var(--color-ai)';
      badge.className = 'verdict-banner lvl-ai';
    } else if (score > 30) {
      circle.style.stroke = 'var(--color-mixed)';
      badge.className = 'verdict-banner lvl-mixed';
    } else {
      circle.style.stroke = 'var(--color-human)';
      badge.className = 'verdict-banner lvl-human';
    }
    
    verdictText.textContent = verdict;
  }

  renderScorecard(metrics) {
    const barBurst = this.querySelector('#metric-bar-burstiness');
    barBurst.style.width = `${metrics.burstiness}%`;
    this.querySelector('#metric-val-burstiness').textContent = `${(metrics.burstiness / 10).toFixed(1)}`;
    this.setMetricBarColor(barBurst, metrics.burstiness);

    const barDiv = this.querySelector('#metric-bar-diversity');
    barDiv.style.width = `${metrics.diversity}%`;
    this.querySelector('#metric-val-diversity').textContent = `${(metrics.diversity / 100).toFixed(2)}`;
    this.setMetricBarColor(barDiv, metrics.diversity);

    const barCliches = this.querySelector('#metric-bar-cliches');
    barCliches.style.width = `${metrics.cliches}%`;
    this.querySelector('#metric-val-cliches').textContent = `${metrics.cliches}%`;
    this.setMetricBarColor(barCliches, metrics.cliches);

    const barRead = this.querySelector('#metric-bar-readability');
    barRead.style.width = `${metrics.readability}%`;
    this.querySelector('#metric-val-readability').textContent = `${metrics.readability.toFixed(1)}`;
    this.setMetricBarColor(barRead, 100 - metrics.readability);
  }

  setMetricBarColor(element, value) {
    if (value > 70) {
      element.style.backgroundColor = 'var(--color-ai)';
    } else if (value > 30) {
      element.style.backgroundColor = 'var(--color-mixed)';
    } else {
      element.style.backgroundColor = 'var(--color-human)';
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
      scoreVal.style.color = 'var(--color-ai)';
      scoreVal.style.backgroundColor = 'var(--color-ai-bg)';
    } else if (evalItem.aiScore > 30) {
      scoreVal.style.color = 'var(--color-mixed)';
      scoreVal.style.backgroundColor = 'var(--color-mixed-bg)';
    } else {
      scoreVal.style.color = 'var(--color-human)';
      scoreVal.style.backgroundColor = 'var(--color-human-bg)';
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
