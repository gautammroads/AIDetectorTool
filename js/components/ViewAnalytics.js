import { appState } from '../store.js';

export class ViewAnalytics extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    
    appState.subscribe(() => {
      this.updateAnalytics();
    });
    
    this.updateAnalytics();
  }

  render() {
    this.innerHTML = `
      <section id="view-analytics" class="view-section" aria-labelledby="view-title">
        <div class="analytics-layout">
          <!-- Row 1: High Level Stats Cards -->
          <div class="analytics-stats-grid">
            <div class="card glass-card stat-card">
              <div class="stat-icon-wrapper human">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div class="stat-content">
                <span class="stat-num" id="stat-total-scans">0</span>
                <span class="stat-label">Total Documents Scanned</span>
              </div>
            </div>
            <div class="card glass-card stat-card">
              <div class="stat-icon-wrapper ai">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div class="stat-content">
                <span class="stat-num" id="stat-avg-ai-score">0%</span>
                <span class="stat-label">Average AI Probability</span>
              </div>
            </div>
            <div class="card glass-card stat-card">
              <div class="stat-icon-wrapper mixed">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div class="stat-content">
                <span class="stat-num" id="stat-total-words">0</span>
                <span class="stat-label">Total Words Processed</span>
              </div>
            </div>
          </div>

          <!-- Row 2: Distribution Chart & Lexical Summary -->
          <div class="analytics-panels-grid">
            <!-- Grid element: Scan Distribution Chart -->
            <div class="card glass-card">
              <div class="card-header">
                <h3>AI Content Distribution</h3>
                <p class="subtitle">Classification share of historical scans</p>
              </div>
              <div class="card-body flex-row-responsive">
                <!-- Bar chart display -->
                <div class="distribution-bars-container" id="distribution-chart-container">
                  <!-- Dynamic Bars injected here -->
                </div>
                <div class="distribution-legend">
                  <div class="dist-legend-item">
                    <span class="legend-color-box badge-green"></span>
                    <span class="legend-text-label">Human Likely (<30%):</span>
                    <span class="legend-val-num" id="dist-count-human">0</span>
                  </div>
                  <div class="dist-legend-item">
                    <span class="legend-color-box badge-amber"></span>
                    <span class="legend-text-label">Mixed/Suspicious (30%-70%):</span>
                    <span class="legend-val-num" id="dist-count-mixed">0</span>
                  </div>
                  <div class="dist-legend-item">
                    <span class="legend-color-box badge-red"></span>
                    <span class="legend-text-label">AI Likely (>70%):</span>
                    <span class="legend-val-num" id="dist-count-ai">0</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grid element: Vocabulary & Readability Breakdown -->
            <div class="card glass-card">
              <div class="card-header">
                <h3>Style Benchmarks</h3>
                <p class="subtitle">Average linguistic metrics across your scans</p>
              </div>
              <div class="card-body styled-stat-list">
                <div class="benchmark-row">
                  <div class="benchmark-header">
                    <span class="benchmark-title">Lexical Diversity (Type-Token Ratio)</span>
                    <span class="benchmark-val" id="bench-ttr">0.00</span>
                  </div>
                  <p class="benchmark-desc">Average ratio of unique words to total words. Higher ratios signal complex, human-like vocabulary variation.</p>
                </div>
                
                <div class="benchmark-row">
                  <div class="benchmark-header">
                    <span class="benchmark-title">Sentence Standard Deviation</span>
                    <span class="benchmark-val" id="bench-stddev">0.0 w/s</span>
                  </div>
                  <p class="benchmark-desc">Variance in sentence lengths. AI generates highly uniform sizes; humans vary sentence styles dynamically.</p>
                </div>

                <div class="benchmark-row">
                  <div class="benchmark-header">
                    <span class="benchmark-title">AI Buzzword Occurrence</span>
                    <span class="benchmark-val" id="bench-cliches">0.0%</span>
                  </div>
                  <p class="benchmark-desc">Frequency percentage of AI stereotypical transition words (e.g. 'delve', 'moreover') in scanned texts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  updateAnalytics() {
    const totalScans = appState.history.length;
    
    this.querySelector('#stat-total-scans').textContent = totalScans;
    
    if (totalScans === 0) {
      this.querySelector('#stat-avg-ai-score').textContent = '0%';
      this.querySelector('#stat-total-words').textContent = '0';
      this.querySelector('#bench-ttr').textContent = '0.00';
      this.querySelector('#bench-stddev').textContent = '0.0 w/s';
      this.querySelector('#bench-cliches').textContent = '0.0%';
      
      this.querySelector('#distribution-chart-container').innerHTML = '';
      this.querySelector('#dist-count-human').textContent = '0';
      this.querySelector('#dist-count-mixed').textContent = '0';
      this.querySelector('#dist-count-ai').textContent = '0';
      return;
    }
    
    let totalScore = 0;
    let totalWords = 0;
    let totalTTR = 0;
    let totalBurstiness = 0;
    let totalCliches = 0;
    
    let countHuman = 0;
    let countMixed = 0;
    let countAI = 0;

    appState.history.forEach(item => {
      totalScore += item.score;
      
      const wCount = (item.text.match(/\b[\w'-]+\b/g) || []).length;
      totalWords += wCount;
      
      const ttrEst = 0.72 - (item.metrics.diversity / 100) * 0.24;
      totalTTR += ttrEst;
      
      const stdDevEst = 8.5 - (item.metrics.burstiness / 100) * 6.5;
      totalBurstiness += stdDevEst;
      
      const densityEst = (item.metrics.cliches / 100) * 1.4;
      totalCliches += densityEst;
      
      if (item.score > 70) countAI++;
      else if (item.score >= 30) countMixed++;
      else countHuman++;
    });

    const avgAIScore = Math.round(totalScore / totalScans);
    this.querySelector('#stat-avg-ai-score').textContent = `${avgAIScore}%`;
    this.querySelector('#stat-total-words').textContent = totalWords.toLocaleString();
    this.querySelector('#bench-ttr').textContent = (totalTTR / totalScans).toFixed(2);
    this.querySelector('#bench-stddev').textContent = `${(totalBurstiness / totalScans).toFixed(1)} words`;
    this.querySelector('#bench-cliches').textContent = `${(totalCliches / totalScans).toFixed(1)}%`;

    this.querySelector('#dist-count-human').textContent = countHuman;
    this.querySelector('#dist-count-mixed').textContent = countMixed;
    this.querySelector('#dist-count-ai').textContent = countAI;

    const chartContainer = this.querySelector('#distribution-chart-container');
    chartContainer.innerHTML = '';

    const classes = [
      { label: 'Human', val: countHuman, colorClass: 'human' },
      { label: 'Mixed', val: countMixed, colorClass: 'mixed' },
      { label: 'AI Likely', val: countAI, colorClass: 'ai' }
    ];

    classes.forEach(c => {
      const col = document.createElement('div');
      col.className = 'dist-bar-column';
      const pctShare = totalScans > 0 ? (c.val / totalScans) * 100 : 0;
      
      col.innerHTML = `
        <div class="dist-bar-fill ${c.colorClass}" style="height: ${Math.max(4, pctShare)}%">
          <span class="dist-bar-val">${c.val}</span>
        </div>
        <span class="dist-bar-label">${c.label}</span>
      `;
      
      chartContainer.appendChild(col);
    });
  }
}

customElements.define('view-analytics', ViewAnalytics);
