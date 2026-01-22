# Implementation Guide - Matching MS Editor UI/UX

This guide provides detailed instructions for implementing all features in the OnlyOffice plugin to match the MS Editor addins UI/UX exactly.

---

## 🎨 Design System Reference

### Color Palette (Matching MS Editor)

```css
/* Primary Colors */
--primary-blue: #2667ff;
--primary-blue-hover: #1a4fd9;
--primary-blue-light: #2667ff1a;

/* Text Colors */
--text-primary: #212529;
--text-secondary: #495057;
--text-muted: #6c757d;

/* Background Colors */
--bg-white: #ffffff;
--bg-light: #f8f9fa;
--bg-hover: #f8f9ff;
--bg-gray: #e9ecef;

/* Border Colors */
--border-light: #e9ecef;
--border-medium: #80808036;

/* Status Colors */
--success: #28a745;
--warning: #ffc107;
--danger: #dc3545;
--info: #2667ff;

/* Badge Colors (for Playbook status) */
--badge-favourable: #28a745;
--badge-risky: #dc3545;
--badge-missing: #6c757d;
```

### Typography

```css
/* Headings */
h1: 18px, bold, #212529
h2: 16px, bold, #212529
h3: 14px, bold, #212529
h4: 13px, bold, #212529

/* Body Text */
body: 12-14px, regular, #495057
small: 11px, regular, #6c757d

/* Font Stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

---

## 📦 Feature Implementation

### Feature 1: Summary

**MS Editor Component:** `Summary.js`

#### UI Structure

```
┌─────────────────────────────────┐
│  ← Back  Summary          ⚙️   │ ← Sticky Header
├─────────────────────────────────┤
│                                 │
│  [Generate Summary Button]      │ ← If no data
│                                 │
│  OR                             │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Summary Text              │ │ ← Scrollable Content
│  │ ...                       │ │
│  └───────────────────────────┘ │
│                                 │
│  [Copy] [Regenerate]            │ ← Action Buttons
└─────────────────────────────────┘
```

#### Implementation

**HTML Structure (index.html):**

```html
<!-- Summary Tab -->
<div id="summary-tab" class="tab-content">
    <div class="feature-header sticky-header">
        <button class="back-button" onclick="switchToMainTabs()">
            <svg>...</svg> <!-- ArrowLeft icon -->
        </button>
        <h2 class="feature-title">Summary</h2>
    </div>
    
    <div class="feature-content">
        <!-- Empty State -->
        <div id="summary-empty" class="empty-state">
            <button id="generate-summary-btn" class="action-button primary">
                Generate Summary
            </button>
        </div>
        
        <!-- Loading State -->
        <div id="summary-loading" class="loading-state" style="display: none;">
            <div class="loader"></div>
            <p class="loading-text">Generating summary...</p>
        </div>
        
        <!-- Content State -->
        <div id="summary-content" class="content-state" style="display: none;">
            <div class="summary-text" id="summary-text"></div>
            <div class="action-buttons">
                <button class="icon-button" onclick="copySummary()">
                    <svg>...</svg> Copy
                </button>
                <button class="icon-button" onclick="regenerateSummary()">
                    <svg>...</svg> Regenerate
                </button>
            </div>
        </div>
        
        <!-- Error State -->
        <div id="summary-error" class="error-state" style="display: none;">
            <div class="error-message"></div>
        </div>
    </div>
</div>
```

**JavaScript Implementation (summary.js):**

```javascript
// Summary Feature Module
(function(window) {
    'use strict';

    let summaryData = null;
    let isLoading = false;

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSummary);
    } else {
        initSummary();
    }

    function initSummary() {
        const generateBtn = document.getElementById('generate-summary-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateSummary);
        }
        
        // Check if we have cached summary
        checkExistingSummary();
    }

    async function handleGenerateSummary() {
        if (isLoading) return;
        
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        
        // Show loading
        showLoadingState();
        
        isLoading = true;
        
        try {
            const url = `${backendUrl}/ai-assistant/onlyoffice/stream-generate-summary?contractId=${pluginData.contractId}&userId=${pluginData.userId}&organizationId=${pluginData.organizationId}`;
            
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to generate summary: ${response.status}`);
            }
            
            // Handle streaming response
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';
                
                const summaryTextEl = document.getElementById('summary-text');
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    accumulated += decoder.decode(value, { stream: true });
                    
                    // Update UI with streaming text
                    summaryTextEl.innerHTML = formatSummaryText(accumulated);
                    summaryTextEl.scrollTop = summaryTextEl.scrollHeight;
                }
                
                summaryData = accumulated;
                showContentState();
            } else {
                const data = await response.json();
                summaryData = data.summary || data.data || '';
                document.getElementById('summary-text').innerHTML = formatSummaryText(summaryData);
                showContentState();
            }
        } catch (error) {
            console.error('Summary generation error:', error);
            showErrorState(error.message);
        } finally {
            isLoading = false;
        }
    }

    function showLoadingState() {
        document.getElementById('summary-empty').style.display = 'none';
        document.getElementById('summary-content').style.display = 'none';
        document.getElementById('summary-error').style.display = 'none';
        document.getElementById('summary-loading').style.display = 'flex';
    }

    function showContentState() {
        document.getElementById('summary-empty').style.display = 'none';
        document.getElementById('summary-loading').style.display = 'none';
        document.getElementById('summary-error').style.display = 'none';
        document.getElementById('summary-content').style.display = 'block';
    }

    function showErrorState(message) {
        document.getElementById('summary-empty').style.display = 'none';
        document.getElementById('summary-loading').style.display = 'none';
        document.getElementById('summary-content').style.display = 'none';
        const errorEl = document.getElementById('summary-error');
        errorEl.style.display = 'block';
        errorEl.querySelector('.error-message').textContent = message;
    }

    function formatSummaryText(text) {
        // Format text with proper line breaks and paragraphs
        return text
            .split('\n\n')
            .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    function copySummary() {
        if (summaryData) {
            navigator.clipboard.writeText(summaryData).then(() => {
                showToast('Summary copied to clipboard');
            });
        }
    }

    async function regenerateSummary() {
        await handleGenerateSummary();
    }

    async function checkExistingSummary() {
        // Check if summary exists in backend
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        
        try {
            const url = `${backendUrl}/ai-assistant/fetch-Summary-Clause?contractId=${pluginData.contractId}`;
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.summary) {
                    summaryData = data.summary;
                    document.getElementById('summary-text').innerHTML = formatSummaryText(summaryData);
                    showContentState();
                }
            }
        } catch (error) {
            console.error('Error checking existing summary:', error);
        }
    }

    function showToast(message) {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Expose functions
    window.copySummary = copySummary;
    window.regenerateSummary = regenerateSummary;

})(window);
```

**CSS Styling (styles/plugin.css):**

```css
/* Summary Feature Styles */
.feature-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid #80808036;
}

.feature-title {
    font-size: 18px;
    font-weight: bold;
    color: #212529;
    margin: 0;
}

.back-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
}

.back-button:hover {
    background-color: #e9ecef;
}

.feature-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
}

.action-button {
    background-color: #2667ff;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.action-button:hover {
    background-color: #1a4fd9;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;
}

.loader {
    width: 40px;
    height: 40px;
    border: 4px solid #e9ecef;
    border-top-color: #2667ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 16px;
    font-weight: bold;
    color: #333;
}

.content-state {
    display: flex;
    flex-direction: column;
}

.summary-text {
    padding: 16px;
    font-size: 12px;
    line-height: 1.6;
    color: #495057;
}

.summary-text h2 {
    font-size: 14px;
    margin: 0 0 8px 0;
}

.summary-text h3 {
    font-size: 13px;
    margin: 0 0 8px 0;
}

.action-buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 8px 16px;
    background-color: #fff;
    border-top: 1px solid #e9ecef;
}

.icon-button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    color: #495057;
}

.icon-button:hover {
    background-color: #f8f9fa;
}
```

---

### Feature 2: Chat / Ask AI

**MS Editor Component:** `Chat.js`

#### UI Structure

```
┌─────────────────────────────────┐
│  ← Back  Ask AI           ⚙️   │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐ │
│  │ User: Question?           │ │ ← Message List
│  │ AI: Answer...             │ │   (Scrollable)
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Type your question...     │ │ ← Input Area
│  │ [Send]                    │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

#### Implementation Highlights

- Chat history loading
- Message bubbles (user vs AI)
- Streaming responses
- Document sync before asking
- Copy message functionality

**Key Functions:**
- `loadChatHistory()` - Load previous conversations
- `sendMessage()` - Send question with document context
- `syncDocument()` - Sync document before chat
- `formatMessage()` - Format messages with markdown support

---

### Feature 3: Clauses

**MS Editor Component:** `Clauses.js`

#### Implementation Similar to Summary

- Generate/Extract button
- Streaming response
- Copy/Regenerate actions
- Cached data check

---

### Feature 4: Obligations

**MS Editor Component:** `Obligation.js`

#### Special Considerations

- HTML rendering support (obligations often contain HTML)
- Structured display with tables/lists
- Copy functionality

---

### Feature 5: AI Playbook

**MS Editor Component:** `AiPlaybook.js` (Most Complex)

#### UI Structure

```
┌─────────────────────────────────┐
│  ← Back  AI Playbook            │
├─────────────────────────────────┤
│  [New Guide]                    │
│                                 │
│  Filter: [All ▼]                │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Playbook Name             │ │
│  │ Status badges             │ │
│  │ [Run]                     │ │
│  └───────────────────────────┘ │
│  ┌───────────────────────────┐ │
│  │ Another Playbook          │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

#### Key Features to Implement

1. **Playbook List View**
   - List all available playbooks
   - Filter by status (All, Favourable, Risky, Missing)
   - Run button for each

2. **Playbook Detail View**
   - Show all rules/guidelines
   - Status for each rule
   - Run from detail view

3. **Create Playbook View**
   - Form to create new playbook
   - Rule builder
   - AI-assisted generation

4. **Run Playbook**
   - Progress indicator
   - Streaming results
   - Status badges

---

### Feature 6: Approval

**MS Editor Component:** `ClauseApproval.js`

#### Key Features

- Start approval workflow
- View approval status
- Approval matrix download
- Reminder functionality

---

### Feature 7: Library

**MS Editor Component:** `Library.js`

#### Key Features

- Browse clause library
- Search functionality
- Favorite marking
- Sub-clause details

---

## 🔄 API Endpoints Mapping

All endpoints match your contract-backend:

| Feature | Endpoint | Method | Notes |
|---------|----------|--------|-------|
| Summary | `/ai-assistant/onlyoffice/stream-generate-summary` | GET | Streaming |
| Summary (Fetch) | `/ai-assistant/fetch-Summary-Clause` | GET | Get existing |
| Clauses | `/ai-assistant/onlyoffice/stream-generate-AiClause` | GET | Streaming |
| Clauses (Fetch) | `/ai-assistant/fetch-Summary-Clause` | GET | Get existing |
| Obligations | `/ai-assistant/onlyoffice/stream-generate-obligation` | GET | Streaming |
| Obligations (Fetch) | `/ai-assistant/fetch-obligation` | GET | Get existing |
| Chat History | `/ai-assistant/chat-history` | GET | Get history |
| Ask Question | `/ai-assistant/ask-question` | POST | Send question |
| Sync Document | `/ai-assistant/onlyoffice/sync-document` | POST | Sync doc |
| Playbook List | `/ai-assistant/global-playbooks` | GET | List playbooks |
| Run Playbook | `/ai-assistant/run-playbook-stream` | GET | Streaming |
| Playbook History | `/ai-assistant/playbook-history` | GET | Get history |
| Create Playbook | `/ai-assistant/editor-create-playbook` | POST | Create |
| Delete Playbook | `/ai-assistant/delete-aiPlaybook-rules` | POST | Delete |
| Update Playbook | `/ai-assistant/update-playbook-fields` | POST | Update |
| Generate Playbook | `/ai-assistant/generate-playbook-with-ai` | POST | AI generate |
| Library List | `/clause-library/clause-list` | GET | List clauses |
| Sub-clause List | `/clause-library/sub-clause-list` | GET | List sub-clauses |
| Sub-clause Details | `/clause-library/sub-clause-details/:id` | GET | Get details |
| Mark Favorite | `/clause-library/mark-favourite` | POST | Mark favorite |
| Approval List | `/clause-approval/clause-approvals-list/:contractId` | GET | List |
| Approval Details | `/clause-approval/clause-approval-details` | GET | Get details |
| Start Approval | `/clause-approval/start-clause-approval-workflow` | POST | Start |
| Approval Reminder | `/clause-approval/approval-reminder` | POST | Send reminder |
| Approval Matrix | `/clause-approval/get-approval-matrix-url/:contractId` | GET | Download |

---

## 🎨 Component Patterns

### Pattern 1: Loading States

```javascript
function showLoadingState() {
    hideAllStates();
    document.getElementById('loading-state').style.display = 'flex';
}
```

### Pattern 2: Error Handling

```javascript
function showError(message) {
    const errorEl = document.getElementById('error-state');
    errorEl.querySelector('.error-message').textContent = message;
    errorEl.style.display = 'block';
}
```

### Pattern 3: Streaming Response

```javascript
async function handleStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        accumulated += decoder.decode(value, { stream: true });
        updateUI(accumulated);
    }
}
```

---

## 📝 Next Steps

1. Implement each feature following the patterns above
2. Match colors and styling from MS Editor
3. Test all API endpoints
4. Implement permission checks
5. Add error handling
6. Test streaming responses
7. Add loading states
8. Implement copy/regenerate actions

---

**See individual feature files in `scripts/` directory for complete implementations.**
