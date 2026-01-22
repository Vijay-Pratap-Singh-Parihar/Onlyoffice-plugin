# AI Contract Assistant Plugin - Complete Overview

## 🎯 Overview

The AI Contract Assistant plugin integrates AI-powered contract analysis features directly into the OnlyOffice editor. It provides a comprehensive suite of tools for analyzing, understanding, and managing contract documents.

---

## 🏗️ Architecture

### Plugin Structure

```
{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}/
├── config.json                    # Plugin metadata & configuration
├── index.html                     # Main plugin UI (panel)
├── scripts/
│   ├── main.js                   # Core plugin initialization
│   ├── askAI.js                  # Ask AI chat feature
│   ├── summary.js                # Summary generation
│   ├── obligations.js            # Obligations extraction
│   ├── clauses.js                # Clauses extraction
│   ├── playbook.js               # AI Playbook execution
│   └── approval.js               # Approval workflow
├── styles/
│   └── plugin.css                # Plugin styling
└── resources/
    ├── img/                      # SVG icons for buttons
    │   ├── icon.svg
    │   ├── ask-ai-icon.svg
    │   ├── summary-icon.svg
    │   ├── obligations-icon.svg
    │   ├── clauses-icon.svg
    │   ├── playbook-icon.svg
    │   └── approval-icon.svg
    ├── light/                    # PNG icons for light theme (optional)
    └── dark/                     # PNG icons for dark theme (optional)
```

---

## 🔌 Technical Details

### Plugin Configuration (`config.json`)

Key configuration properties:

```json
{
  "name": "AI Contract Assistant",
  "guid": "asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}",
  "version": "1.0.0",
  "minVersion": "8.2.0",
  "onlyofficeScheme": true,
  "group": {
    "name": "AI Contract Assistant",
    "rank": 1
  },
  "variations": [{
    "type": "panelRight",
    "url": "index.html",
    "EditorsSupport": ["word"],
    "icons": "resources/%theme-type%(light|dark)/icon%scale%(default).%extension%(png)"
  }]
}
```

**Important Properties:**
- **guid:** Unique plugin identifier (must match in backend config)
- **type:** `panelRight` - opens as right-side panel
- **url:** Entry point HTML file
- **minVersion:** Minimum OnlyOffice version required
- **onlyofficeScheme:** Enables OnlyOffice plugin scheme compliance

### OnlyOffice SDK Integration

The plugin uses OnlyOffice's local SDK files:

```html
<!-- In index.html -->
<script src="../v1/plugins.js"></script>
<script src="../v1/plugins-ui.js"></script>
<link rel="stylesheet" href="../v1/plugins.css">
```

**Why local files?**
- Ensures compatibility with OnlyOffice Desktop Editors
- Matches reference plugin implementation
- No dependency on external CDN

### Plugin Initialization

```javascript
// Plugin initialization
window.Asc.plugin.init = function() {
    // Parse initialization data
    const initData = window.Asc.plugin.info.initData;
    // Store plugin context (contractId, tokens, etc.)
    // Initialize UI components
    // Set up event listeners
};
```

### Button Handler

```javascript
// Handle toolbar button clicks
window.Asc.plugin.button = function(id) {
    // Map button IDs to tabs
    // Switch to appropriate feature tab
};
```

---

## 📊 Features

### 1. Ask AI

**Purpose:** Interactive chat interface for document Q&A

**Implementation:**
- File: `scripts/askAI.js`
- UI: Chat container with message history
- API: `POST /ai-assistant/ask-question`
- Features:
  - Real-time chat interface
  - Document context awareness
  - Message history within session
  - Loading states

**Data Flow:**
```
User Question → getDocumentContent() → API Call → Display Response
```

### 2. Summary

**Purpose:** Generate AI-powered document summaries

**Implementation:**
- File: `scripts/summary.js`
- UI: Generate button + result display
- API: `GET /ai-assistant/onlyoffice/generate-summary`
- Features:
  - One-click generation
  - Streaming response support
  - Formatted display with line breaks
  - Error handling

**Data Flow:**
```
Generate Click → API Call → Stream Response → Update UI
```

### 3. Obligations

**Purpose:** Extract and display contract obligations

**Implementation:**
- File: `scripts/obligations.js`
- UI: Extract button + result display
- API: `POST /ai-assistant/generate-obligation`
- Features:
  - HTML rendering support
  - Structured obligation display
  - Loading states

### 4. Clauses

**Purpose:** Extract key clauses from document

**Implementation:**
- File: `scripts/clauses.js`
- UI: Extract button + result display
- API: `GET /ai-assistant/onlyoffice/generate-AiClause`
- Features:
  - Streaming response
  - Formatted clause list
  - Real-time updates

### 5. AI Playbook

**Purpose:** Run custom AI playbooks for contract review

**Implementation:**
- File: `scripts/playbook.js`
- UI: Run button + result display
- API:
  - `GET /ai-assistant/global-playbooks` (list)
  - `POST /ai-assistant/run-playbook` (execute)
- Features:
  - Playbook selection
  - Streaming results
  - Status display

### 6. Approval

**Purpose:** Start approval workflow for contract

**Implementation:**
- File: `scripts/approval.js`
- UI: Start button + status display
- API: `POST /clause-approval/start-clause-approval-workflow`
- Features:
  - Workflow initiation
  - Status feedback
  - Error handling

---

## 🔄 Data Flow

### Plugin Initialization Flow

```
1. OnlyOffice loads config.json
   ↓
2. OnlyOffice loads index.html
   ↓
3. index.html loads SDK files (plugins.js, plugins-ui.js)
   ↓
4. Scripts load in order (main.js, then feature scripts)
   ↓
5. window.Asc.plugin.init() called
   ↓
6. Plugin parses initData from backend
   ↓
7. Plugin stores context (contractId, tokens, etc.)
   ↓
8. UI initializes (tabs, buttons, etc.)
   ↓
9. Plugin ready for user interaction
```

### User Action Flow

```
1. User clicks feature button
   ↓
2. window.Asc.plugin.button(id) called
   ↓
3. Tab switches to feature
   ↓
4. User triggers action (e.g., "Generate Summary")
   ↓
5. Feature script makes API call
   ↓
6. Backend processes request
   ↓
7. Response received (or streamed)
   ↓
8. UI updates with results
```

---

## 🔐 Authentication & Security

### Authentication Flow

1. **Backend passes access token** via `initData`
2. **Plugin stores token** in `window.pluginData`
3. **All API calls include token** in `x-auth-token` header
4. **Backend validates token** for each request

### Data Passing

```javascript
// Backend configuration
initData: JSON.stringify({
    contractId: contractId,
    accessToken: accessToken,
    userId: userId,
    organizationId: organizationId,
    backendUrl: BACKEND_URL + '/api'
})

// Plugin access
const pluginData = window.getPluginData();
const token = window.getAccessToken();
```

---

## 🎨 UI/UX Design

### Design System

- **Primary Color:** `#2667ff` (blue)
- **Font:** System fonts (Helvetica Neue, Segoe UI, etc.)
- **Layout:** Tabbed interface with right-side panel
- **Responsive:** Adapts to panel width

### Component Structure

```
#plugin-container
├── .plugin-tabs (tab navigation)
│   ├── .tab-button.active
│   └── .tab-button
└── .plugin-content (content area)
    └── .tab-content.active
        └── .feature-container
            ├── h3 (feature title)
            ├── .feature-description
            ├── .action-button
            ├── .loading-container
            └── .result-container
```

---

## 🔧 API Integration

### Helper Functions

The plugin provides these helper functions:

```javascript
// Get plugin data
window.getPluginData()
// Returns: { contractId, accessToken, userId, organizationId, backendUrl }

// Get backend URL
window.getBackendUrl()
// Returns: Backend API base URL

// Get access token
window.getAccessToken()
// Returns: Authentication token

// Get contract ID
window.getContractId()
// Returns: Current contract ID

// Get document content (via OnlyOffice API)
window.getDocumentContent()
// Returns: Promise<string>

// Get selected text (via OnlyOffice API)
window.getSelectedText()
// Returns: Promise<string>
```

### OnlyOffice API Methods

The plugin uses these OnlyOffice plugin API methods:

```javascript
// Execute OnlyOffice editor method
window.Asc.plugin.executeMethod(methodName, params, successCallback, errorCallback)

// Common methods:
// - GetDocumentContent() - Get document text
// - GetSelectedText() - Get selected text
// - InsertText() - Insert text at cursor
```

---

## 📦 Deployment

### Development

1. **Local server:** `npx http-server -p 8080 --cors`
2. **Backend config:** Point to `http://localhost:8080/config.json`
3. **Test in browser:** Open OnlyOffice editor

### Production

1. **Copy to Document Server:**
   ```bash
   sudo cp -r {9DC93CDB-B576-4F0C-B55E-FCC9C48DD007} \
        /var/www/onlyoffice/documentserver/sdkjs-plugins/
   ```

2. **Set permissions:**
   ```bash
   sudo chown -R onlyoffice:onlyoffice \
        /var/www/onlyoffice/documentserver/sdkjs-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}
   ```

3. **Restart Document Server:**
   ```bash
   sudo supervisorctl restart ds:docservice
   ```

4. **Update backend config:** Point to production plugin URL

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Export results to file
- [ ] History/previous results
- [ ] Advanced playbook UI
- [ ] Real-time collaboration features

### Performance Optimizations

- [ ] Response caching
- [ ] Lazy loading of features
- [ ] Optimized API calls
- [ ] Better streaming handling

---

## 📚 Related Documentation

- **QUICK_START.md** - Get started in 5 minutes
- **TROUBLESHOOTING.md** - Common issues and solutions
- **MIGRATION_GUIDE.md** - Migrating from React components

---

## 🔗 External Resources

- [OnlyOffice Plugin API Documentation](https://api.onlyoffice.com/pluginapi/)
- [OnlyOffice Plugin Development Guide](https://api.onlyoffice.com/docs/plugin-and-macros/)
- [OnlyOffice GitHub Examples](https://github.com/ONLYOFFICE/sdkjs-plugins)

---

**Plugin Version:** 1.0.0  
**OnlyOffice Min Version:** 8.2.0  
**Status:** Production Ready
