export const AI_CLICHES = [
  'delve', 'testament', 'tapestry', 'moreover', 'furthermore',
  'fostering', 'in conclusion', 'it is important to note', 'it is crucial to remember',
  'notable', 'indeed', 'underscores', 'elevate', 'pinnacle', 'demystify',
  'leverage', 'revolutionary', 'game-changer', 'paradigm shift', 'meticulously',
  'seamlessly', 'remains to be seen', 'not only... but also', 'beacon', 'solace',
  'in essence', 'ultimately', 'vital role', 'testament to', 'rich tapestry', 
  'by delving into', 'it is worth noting', 'comprehensive guide', 'pave the way'
];

export const MOCK_SCANS = [
  {
    id: "mock-1",
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    excerpt: "The old library was quiet, smelling of dust and aging paper. Sarah ran her fingers along the...",
    text: "The old library was quiet, smelling of dust and aging paper. Sarah ran her fingers along the leather bindings, feeling the history etched into the gold lettering. She had been searching for the ledger for weeks, chasing rumors through ancient diaries. Suddenly, her foot caught on an uneven floorboard. She stumbled, grabbing the nearest shelf to steady herself. A heavy tome dislodged from the top shelf, crashing to the floor and spilling a single yellowed letter from its pages. Her heart hammered in her chest as she knelt down to retrieve it. This was the key.",
    mode: "local",
    score: 8,
    verdict: "Human-written",
    explanation: "This text exhibits organic human characteristics, including high sentence length variation (burstiness) and rich vocabulary. Sentence lengths range from 5 to 22 words, showing a natural pacing. There are no corporate AI clichés, and the syntactic structures are diverse.",
    metrics: {
      burstiness: 12,
      diversity: 78,
      cliches: 0,
      readability: 82
    },
    sentenceEvaluations: [
      { index: 0, text: "The old library was quiet, smelling of dust and aging paper.", aiScore: 5, reason: "Natural rhythm" },
      { index: 1, text: "Sarah ran her fingers along the leather bindings, feeling the history etched into the gold lettering.", aiScore: 10, reason: "Descriptive human structure" },
      { index: 2, text: "She had been searching for the ledger for weeks, chasing rumors through ancient diaries.", aiScore: 8, reason: "Dynamic participle phrase" },
      { index: 3, text: "Suddenly, her foot caught on an uneven floorboard.", aiScore: 5, reason: "Action verb" },
      { index: 4, text: "She stumbled, grabbing the nearest shelf to steady herself.", aiScore: 12, reason: "Natural action" },
      { index: 5, text: "A heavy tome dislodged from the top shelf, crashing to the floor and spilling a single yellowed letter from its pages.", aiScore: 9, reason: "Complex structure" },
      { index: 6, text: "Her heart hammered in her chest as she knelt down to retrieve it.", aiScore: 6, reason: "Short, sensory description" },
      { index: 7, text: "This was the key.", aiScore: 5, reason: "Ultra-short human sentence" }
    ]
  },
  {
    id: "mock-2",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    excerpt: "In the rapidly evolving landscape of modern business, it is important to note that leverage...",
    text: "In the rapidly evolving landscape of modern business, it is important to note that leverage plays a vital role. Furthermore, organizations must delve into data analytics to foster growth and streamline operations meticulously. The rich tapestry of digital transformation underscores a paradigm shift in how we connect. Moreover, leveraging these technologies seamlessly will elevate operational efficiency, serving as a testament to organizational innovation and paving the way for future success.",
    mode: "local",
    score: 92,
    verdict: "AI-generated",
    explanation: "The scanned text shows extremely strong indicators of AI generation. It is heavily saturated with classic LLM buzzwords ('delve', 'tapestry', 'testament', 'seamlessly', 'moreover') and exhibits a highly uniform sentence length (average of 18 words per sentence with low variance). The pacing feels mechanical and formulaic.",
    metrics: {
      burstiness: 88,
      diversity: 32,
      cliches: 86,
      readability: 35
    },
    sentenceEvaluations: [
      { index: 0, text: "In the rapidly evolving landscape of modern business, it is important to note that leverage plays a vital role.", aiScore: 94, reason: "Contains AI markers: 'rapidly evolving landscape', 'it is important to note', 'vital role'" },
      { index: 1, text: "Furthermore, organizations must delve into data analytics to foster growth and streamline operations meticulously.", aiScore: 96, reason: "Contains clichés: 'Furthermore', 'delve', 'foster', 'meticulously'" },
      { index: 2, text: "The rich tapestry of digital transformation underscores a paradigm shift in how we connect.", aiScore: 95, reason: "Contains highly robotic markers: 'rich tapestry', 'underscores', 'paradigm shift'" },
      { index: 3, text: "Moreover, leveraging these technologies seamlessly will elevate operational efficiency, serving as a testament to organizational innovation and paving the way for future success.", aiScore: 92, reason: "Contains clichés: 'Moreover', 'leveraging', 'seamlessly', 'elevate', 'testament', 'paving the way'" }
    ]
  }
];

export const appState = {
  currentView: 'view-scanner',
  scanMode: 'local',
  scannedData: null,
  history: [],
  settings: {
    apiKey: '',
    sensitivity: 'balanced'
  },
  subscribers: [],
  
  subscribe(callback) {
    this.subscribers.push(callback);
  },
  
  notify() {
    this.subscribers.forEach(cb => cb());
  }
};

export function loadSettings() {
  appState.settings.apiKey = localStorage.getItem('promptlens_apikey') || '';
  appState.settings.sensitivity = localStorage.getItem('promptlens_sensitivity') || 'balanced';
}

export function saveSettings(apiKey, sensitivity) {
  appState.settings.apiKey = apiKey;
  appState.settings.sensitivity = sensitivity;
  localStorage.setItem('promptlens_apikey', apiKey);
  localStorage.setItem('promptlens_sensitivity', sensitivity);
  appState.notify();
}

export function loadHistory() {
  const stored = localStorage.getItem('promptlens_history');
  if (stored) {
    appState.history = JSON.parse(stored);
  } else {
    appState.history = [...MOCK_SCANS];
    localStorage.setItem('promptlens_history', JSON.stringify(appState.history));
  }
}

export function saveScanToHistory(results) {
  appState.history.unshift(results);
  localStorage.setItem('promptlens_history', JSON.stringify(appState.history));
  appState.notify();
}

export function clearHistory() {
  appState.history = [];
  localStorage.setItem('promptlens_history', JSON.stringify([]));
  appState.notify();
}

export function deleteScanItem(id) {
  appState.history = appState.history.filter(item => item.id !== id);
  localStorage.setItem('promptlens_history', JSON.stringify(appState.history));
  appState.notify();
}

export function resetApp() {
  localStorage.clear();
  appState.history = [...MOCK_SCANS];
  localStorage.setItem('promptlens_history', JSON.stringify(appState.history));
  appState.settings.apiKey = '';
  appState.settings.sensitivity = 'balanced';
  appState.notify();
}

export function setScanMode(mode) {
  appState.scanMode = mode;
  appState.notify();
}

export function setScannedData(data) {
  appState.scannedData = data;
  appState.notify();
}

export function switchView(view) {
  appState.currentView = view;
  appState.notify();
}

export function saveApiKey(apiKey) {
  appState.settings.apiKey = apiKey;
  localStorage.setItem('promptlens_apikey', apiKey);
  appState.notify();
}

export function updateSensitivity(sensitivity) {
  appState.settings.sensitivity = sensitivity;
  localStorage.setItem('promptlens_sensitivity', sensitivity);
  appState.notify();
}

export function resetApplication() {
  resetApp();
}

// Auto-initialize state on module load
loadSettings();
loadHistory();
