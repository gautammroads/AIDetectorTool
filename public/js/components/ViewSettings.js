import { appState, saveApiKey, updateSensitivity, resetApplication } from '../store.js';
import { showToast } from '../utils.js';

export class ViewSettings extends HTMLElement {
  connectedCallback() {
    this.style.display = 'contents';
    this.render();
    this.setupListeners();
    this.populateForm();
  }

  render() {
    this.innerHTML = `
      <section id="view-settings" class="view-section" aria-labelledby="view-title">
        <div class="settings-layout">
          <div class="settings-grid">
            
            <!-- Column 1: API Configuration -->
            <div class="card glass-card">
              <div class="card-header">
                <div class="header-icon-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="accent-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  <h3>Google Gemini Configuration</h3>
                </div>
                <p class="subtitle">Equip your scanner with Cloud AI. Deep scan uses an actual LLM to evaluate the text for AI patterns.</p>
              </div>
              <div class="card-body">
                <form id="settings-api-form" novalidate>
                  <div class="form-group">
                    <label for="settings-api-key">Gemini Developer API Key</label>
                    <div class="password-input-wrapper">
                      <input type="password" id="settings-api-key" placeholder="AIzaSy..." autocomplete="off" aria-describedby="api-help-text">
                      <button type="button" class="btn-toggle-password" id="btn-toggle-api-key" aria-label="Show API Key">
                        <!-- Eye icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-show"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <!-- Eye off icon -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-hide hidden"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      </button>
                    </div>
                    <span id="api-help-text" class="form-help-text">
                      Your key is stored 100% locally in your browser's LocalStorage. Get a free API Key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
                    </span>
                  </div>

                  <div class="form-actions-inline">
                    <button type="button" class="button secondary" id="btn-test-api-key" disabled>Test Key</button>
                    <button type="submit" class="button primary" id="btn-save-api-settings">Save Settings</button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Column 2: Detector Sensitivity & Database Settings -->
            <div class="card glass-card">
              <div class="card-header">
                <div class="header-icon-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="accent-icon"><polygon points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <h3>Scanner Sensitivity Adjustments</h3>
                </div>
                <p class="subtitle">Tune local detection parameters. Stricter settings lower the threshold for flagging AI features.</p>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label for="settings-sensitivity">Detection Mode</label>
                  <div class="radio-card-grid">
                    <label class="radio-card" for="sens-lax">
                      <input type="radio" id="sens-lax" name="detector-sensitivity" value="lax">
                      <div class="radio-card-content">
                        <span class="title">Lax</span>
                        <span class="desc">Requires high levels of uniform sentence structure and vocabulary repitition to trigger warnings.</span>
                      </div>
                    </label>
                    <label class="radio-card" for="sens-balanced">
                      <input type="radio" id="sens-balanced" name="detector-sensitivity" value="balanced" checked>
                      <div class="radio-card-content">
                        <span class="title">Balanced (Default)</span>
                        <span class="desc">Standard rules optimized for common essays, blog posts, and copy-writing.</span>
                      </div>
                    </label>
                    <label class="radio-card" for="sens-strict">
                      <input type="radio" id="sens-strict" name="detector-sensitivity" value="strict">
                      <div class="radio-card-content">
                        <span class="title">Strict</span>
                        <span class="desc">Aggressively flags minimal sentence uniformity or common stylistic AI markers.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <hr class="card-divider">
                
                <div class="form-group">
                  <span class="field-heading">Troubleshooting / Clean Database</span>
                  <p class="field-subheading-text">Permanently deletes all stored scan data and resets settings back to default configurations.</p>
                  <button class="button danger btn-small" id="btn-reset-app">Reset Entire Application</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  }

  setupListeners() {
    this.apiKeyInput = this.querySelector('#settings-api-key');
    const apiForm = this.querySelector('#settings-api-form');
    const btnToggleKey = this.querySelector('#btn-toggle-api-key');
    const btnTestKey = this.querySelector('#btn-test-api-key');
    
    // Toggle Visibility
    btnToggleKey.addEventListener('click', () => {
      const type = this.apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
      this.apiKeyInput.setAttribute('type', type);
      const iconShow = btnToggleKey.querySelector('.icon-show');
      const iconHide = btnToggleKey.querySelector('.icon-hide');
      if (type === 'text') {
        iconShow.classList.add('hidden');
        iconHide.classList.remove('hidden');
      } else {
        iconShow.classList.remove('hidden');
        iconHide.classList.add('hidden');
      }
    });

    // Input monitoring to enable Test button
    this.apiKeyInput.addEventListener('input', () => {
      btnTestKey.disabled = this.apiKeyInput.value.trim() === '';
    });

    // Submit form
    apiForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = this.apiKeyInput.value.trim();
      saveApiKey(val);
      showToast('API Key saved successfully.', 'success');
    });

    // Test Key
    btnTestKey.addEventListener('click', async () => {
      const val = this.apiKeyInput.value.trim();
      if (!val) return;
      btnTestKey.textContent = 'Testing...';
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${val}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Hello, reply with OK" }] }] })
        });
        if (response.ok) {
          showToast('API Key verified successfully!', 'success');
          saveApiKey(val);
        } else {
          showToast('Invalid API Key. Google returned an error.', 'error');
        }
      } catch (e) {
        showToast('Network error while testing API Key.', 'error');
      } finally {
        btnTestKey.textContent = 'Test Key';
      }
    });

    // Sensitivity Radios
    const radios = this.querySelectorAll('input[name="detector-sensitivity"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          updateSensitivity(e.target.value);
          showToast(`Sensitivity updated to ${e.target.value}.`, 'info');
        }
      });
    });

    // Reset app
    this.querySelector('#btn-reset-app').addEventListener('click', () => {
      if (confirm('WARNING: This will delete ALL history and clear your API key. Proceed?')) {
        resetApplication();
        this.apiKeyInput.value = '';
        btnTestKey.disabled = true;
        this.querySelector('#sens-balanced').checked = true;
        showToast('Application reset.', 'success');
      }
    });
  }

  populateForm() {
    if (appState.settings.apiKey) {
      this.apiKeyInput.value = appState.settings.apiKey;
      this.querySelector('#btn-test-api-key').disabled = false;
    }
    const sens = appState.settings.sensitivity || 'balanced';
    const radio = this.querySelector(`#sens-${sens}`);
    if (radio) {
      radio.checked = true;
    }
  }
}

customElements.define('view-settings', ViewSettings);
