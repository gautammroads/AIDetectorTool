# PromptLens AI | Content Detector & Writing Analytics

PromptLens AI is a modern, responsive, and beautiful single-page web application designed to analyze writing style and detect AI-generated content. It features both a local heuristic analyzer (which runs entirely client-side and offline) and an optional Cloud Deep Scan powered by Google's Gemini models.

## 🚀 Key Features

*   **Offline Linguistic Analysis**: Analyzes sentence length variation (burstiness), vocabulary richness (Type-Token Ratio TTR), AI cliché buzzwords (e.g. *delve*, *testament*, *tapestry*), and readability (Flesch Reading Ease index).
*   **Gemini Deep Scan**: Uses actual LLM modeling (via Google Gemini API) to perform deep semantic analysis and style forensics.
*   **Interactive Highlight Canvas**: Color-codes sentences based on AI likelihood. Click on any sentence to get specific parameters, diagnostic markers, and reason descriptions.
*   **Scan History Logs**: Automatically saves scanned documents, results, and metrics inside your browser's local storage. Search and filter previous scans.
*   **Aggregate Analytics Dashboard**: View charts tracking your overall AI classification distribution, total words processed, and average linguistic metrics.
*   **HTML5 Modal Reports**: Open comprehensive, clean report layouts suitable for printing or exporting.
*   **Beautiful UI**: Premium glassmorphic design supporting both Dark and Light theme preferences.
*   **File Drop Integration**: Load `.txt` and `.md` files by dragging and dropping them directly onto the scanner canvas.

## 📂 Project Structure

```
AIDectorTool/
├── index.html       # Application layout and structure (Semantic HTML5)
├── styles.css       # Premium glassmorphic stylesheets (CSS Variables / Responsive)
├── app.js           # Core analyzer algorithms and UI view managers
└── package.json     # Node scripts configuration (Fast local server start)
```

## 🛠️ Getting Started

To launch the web application locally:

1.  Clone or navigate into this workspace directory:
    ```bash
    cd /Users/gautamkumar/Documents/AIDectorTool
    ```

2.  Run the local development server:
    ```bash
    npm start
    ```
    This command will launch `http-server` via `npx` serving the static files.

3.  Open your browser and navigate to:
    [http://localhost:3000](http://localhost:3000)

## 🔑 Configure Cloud AI Scan (Optional)

1. Get a free developer API key from [Google AI Studio](https://aistudio.google.com/).
2. In PromptLens AI, navigate to the **Settings** view (gear icon in the sidebar).
3. Paste the key in the **Gemini Developer API Key** input and click **Save Settings**.
4. You can now use the **Gemini Deep Scan** tab inside the Content Scanner.
