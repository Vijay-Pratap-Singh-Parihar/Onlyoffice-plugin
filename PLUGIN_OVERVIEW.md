# AI Contract Assistant Plugin - Overview

## 🎯 Purpose

This OnlyOffice plugin brings AI-powered contract analysis features directly into the OnlyOffice editor, including:
- **Ask AI** - Chat with your document
- **Summary** - Generate AI summaries
- **Obligations** - Extract obligations
- **Clauses** - Extract key clauses
- **AI Playbook** - Run custom AI playbooks
- **Approval** - Approval workflow

## 🏗️ Architecture

### Plugin Structure
```
ai-contract-plugin/
├── config.json          # Plugin metadata & configuration
├── index.html           # Main UI (tabbed interface)
├── scripts/             # Feature modules
│   ├── main.js         # Plugin initialization & OnlyOffice API
│   ├── askAI.js        # Ask AI chat functionality
│   ├── summary.js      # Summary generation
│   ├── obligations.js  # Obligations extraction
│   ├── clauses.js      # Clauses extraction
│   ├── playbook.js     # AI Playbook execution
│   └── approval.js     # Approval workflow
├── styles/
│   └── plugin.css      # Plugin styling
└── resources/
    └── img/            # Plugin icons
```

### How It Works

1. **Plugin Loads** → OnlyOffice loads `config.json`
2. **User Clicks Button** → OnlyOffice calls `window.Asc.plugin.button(id)`
3. **Tab Switches** → JavaScript shows/hides tab content
4. **User Triggers Action** → Feature module makes API call
5. **Results Display** → UI updates with response

### Data Flow

```
User Action
    ↓
Plugin JavaScript (askAI.js, summary.js, etc.)
    ↓
Backend API (your contract-backend)
    ↓
AI Service / Database
    ↓
Response
    ↓
Plugin UI Update
```

## 🔌 Integration Points

### Backend Integration

The plugin needs these from your backend:

1. **Plugin Configuration** (in `onlyOfficeService.js`):
   ```javascript
   plugins: {
       autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
       pluginsData: [{
           url: `${ONLYOFFICE_SERVER_URL}/plugins/ai-contract-plugin/config.json`,
           initData: JSON.stringify({
               contractId: contractId,
               accessToken: accessToken,
               userId: userId,
               organizationId: organizationId,
               backendUrl: BACKEND_URL + '/api'
           })
       }]
   }
   ```

2. **API Endpoints** (already exist in your backend):
   - `/ai-assistant/ask-question`
   - `/ai-assistant/onlyoffice/generate-summary`
   - `/ai-assistant/onlyoffice/generate-AiClause`
   - `/ai-assistant/generate-obligation`
   - `/ai-assistant/run-playbook`
   - `/clause-approval/start-clause-approval-workflow`

### Frontend Integration

The plugin is **separate** from your React frontend:
- No React dependencies
- No Redux dependencies
- Standalone HTML/CSS/JS
- Communicates via API only

## 📋 Features Breakdown

### 1. Ask AI
- **File:** `scripts/askAI.js`
- **UI:** Chat interface with input field
- **API:** POST `/ai-assistant/ask-question`
- **Features:**
  - Real-time chat
  - Document context awareness
  - Message history in session

### 2. Summary
- **File:** `scripts/summary.js`
- **UI:** Generate button + result display
- **API:** GET `/ai-assistant/onlyoffice/generate-summary`
- **Features:**
  - Streaming response support
  - One-click generation
  - Formatted display

### 3. Obligations
- **File:** `scripts/obligations.js`
- **UI:** Extract button + result display
- **API:** POST `/ai-assistant/generate-obligation`
- **Features:**
  - HTML rendering support
  - Structured display

### 4. Clauses
- **File:** `scripts/clauses.js`
- **UI:** Extract button + result display
- **API:** GET `/ai-assistant/onlyoffice/generate-AiClause`
- **Features:**
  - Streaming response
  - Formatted clause list

### 5. AI Playbook
- **File:** `scripts/playbook.js`
- **UI:** Run button + result display
- **API:** 
  - GET `/ai-assistant/global-playbooks` (list)
  - POST `/ai-assistant/run-playbook` (execute)
- **Features:**
  - Playbook selection (basic)
  - Streaming results
  - Status display

### 6. Approval
- **File:** `scripts/approval.js`
- **UI:** Start button + status display
- **API:** POST `/clause-approval/start-clause-approval-workflow`
- **Features:**
  - Workflow initiation
  - Status feedback

## 🔧 Configuration

### Plugin GUID
- **Current:** `asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}`
- **Note:** This should be unique. Generate a new UUID if needed.

### Plugin Type
- **Type:** `panelRight` (right-side panel)
- **Editors:** Word documents only (`["word"]`)
- **Can be changed to:** `panelLeft`, `window`, `background`

### Icons Required
- Main icon: `resources/img/icon.png`
- Button icons: `ask-ai-icon.png`, `summary-icon.png`, etc.
- **Size:** 32x32 or 64x64 pixels recommended

## 🚀 Deployment

### Development
1. Local server: `npx http-server -p 8080 --cors`
2. Install via console: `Asc.editor.installDeveloperPlugin("http://localhost:8080/config.json")`

### Production
1. Copy to Document Server: `/var/www/onlyoffice/documentserver/sdkjs-plugins/`
2. Set permissions: `chown -R onlyoffice:onlyoffice`
3. Restart service: `supervisorctl restart ds:docservice`
4. Enable in Plugin Manager

## 📊 Current Status

✅ **Complete:**
- Plugin structure
- All 6 feature modules
- Basic UI/UX
- API integration code
- Error handling
- Tab navigation

⚠️ **Needs Work:**
- Icon images (placeholders needed)
- Enhanced UI/UX (can be improved)
- Advanced Playbook features (list view, detail view)
- Better error messages
- Loading animations

## 🔄 Future Enhancements

1. **UI Improvements**
   - Better loading states
   - Animations
   - Dark mode support
   - Responsive design

2. **Feature Enhancements**
   - Playbook list/detail views
   - Approval status tracking
   - History/previous results
   - Export functionality

3. **Performance**
   - Caching
   - Optimized API calls
   - Better streaming handling

4. **User Experience**
   - Keyboard shortcuts
   - Tooltips
   - Help documentation
   - Settings panel

## 📚 Documentation

- **README.md** - Complete guide
- **QUICK_START.md** - Fast setup
- **MIGRATION_GUIDE.md** - Code migration
- **START_HERE.md** - Navigation guide

## 🆘 Support

If you encounter issues:
1. Check browser console
2. Check OnlyOffice logs
3. Verify API endpoints
4. Review plugin configuration
5. Ask your team for help

---

**Plugin Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Ready for Testing & Customization
