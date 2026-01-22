# Migration Guide: From React Components to OnlyOffice Plugin

This guide helps you migrate existing React-based contract analysis features to the OnlyOffice plugin architecture.

---

## 📋 Overview

### What You're Migrating From

- **React Components** with hooks (useState, useEffect)
- **Redux** for state management
- **React Router** for navigation
- **Modern React patterns** (functional components)

### What You're Migrating To

- **Vanilla JavaScript** (no frameworks)
- **Plain HTML/CSS**
- **Direct DOM manipulation**
- **Event listeners** instead of hooks
- **OnlyOffice Plugin API** for editor integration

---

## 🔄 Core Migration Patterns

### Pattern 1: React State → JavaScript Variables

**React Code:**
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

const handleClick = () => {
    setLoading(true);
    fetchData().then(result => {
        setData(result);
        setLoading(false);
    });
};
```

**Plugin Code:**
```javascript
let data = null;
let loading = false;

function handleClick() {
    loading = true;
    updateLoadingUI(true);
    
    fetchData().then(result => {
        data = result;
        updateDataUI(result);
        loading = false;
        updateLoadingUI(false);
    });
}

function updateLoadingUI(isLoading) {
    const btn = document.getElementById('action-btn');
    btn.disabled = isLoading;
    const loader = document.getElementById('loader');
    loader.style.display = isLoading ? 'block' : 'none';
}
```

### Pattern 2: React useEffect → DOM Ready Event

**React Code:**
```javascript
useEffect(() => {
    fetchInitialData();
}, []);

useEffect(() => {
    if (contractId) {
        loadContractData();
    }
}, [contractId]);
```

**Plugin Code:**
```javascript
// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeature);
} else {
    initFeature();
}

function initFeature() {
    fetchInitialData();
    
    // Watch for contractId changes
    const pluginData = window.getPluginData();
    if (pluginData.contractId) {
        loadContractData();
    }
}
```

### Pattern 3: React JSX → DOM Creation

**React Code:**
```javascript
return (
    <div className="container">
        <h3>{title}</h3>
        <button onClick={handleClick}>Click Me</button>
        {loading && <div className="loader">Loading...</div>}
        {data && <div className="result">{data}</div>}
    </div>
);
```

**Plugin Code:**
```javascript
// HTML already exists in index.html
// Just update content dynamically

function updateUI(title, data, isLoading) {
    const container = document.getElementById('feature-container');
    
    // Update title
    const titleEl = container.querySelector('h3');
    titleEl.textContent = title;
    
    // Update loading state
    const loader = document.getElementById('loader');
    loader.style.display = isLoading ? 'flex' : 'none';
    
    // Update result
    const resultEl = document.getElementById('result');
    if (data) {
        resultEl.innerHTML = formatData(data);
        resultEl.style.display = 'block';
    } else {
        resultEl.style.display = 'none';
    }
}
```

### Pattern 4: React Redux → Window/Module State

**React Code:**
```javascript
const summaryData = useSelector(state => state.aiChatReducer.summaryData);
dispatch(setSummaryData(newData));
```

**Plugin Code:**
```javascript
// Store in window or module scope
window.pluginState = {
    summaryData: null,
    obligations: null,
    // ... other state
};

// Update state
window.pluginState.summaryData = newData;
updateSummaryUI(newData);

// OR use module-level variables
let summaryData = null;

function updateSummary(data) {
    summaryData = data;
    updateSummaryUI(data);
}
```

### Pattern 5: React API Calls → Fetch with Plugin Helpers

**React Code:**
```javascript
const constants = require('../../../utility/constants/constant');
const accessToken = useSelector(state => state.authReducer.accessToken);
const contractId = props.contractId;

const url = `${constants.BASE_URL}${constants.GENERATE_SUMMARY_ONLYOFFICE}?contractId=${contractId}`;

fetch(url, {
    headers: {
        'x-auth-token': accessToken
    }
});
```

**Plugin Code:**
```javascript
const pluginData = window.getPluginData();
const backendUrl = window.getBackendUrl();
const accessToken = window.getAccessToken();
const contractId = window.getContractId();

const url = `${backendUrl}/ai-assistant/onlyoffice/generate-summary?contractId=${contractId}&userId=${pluginData.userId}&organizationId=${pluginData.organizationId}`;

fetch(url, {
    headers: {
        'x-auth-token': accessToken,
        'Content-Type': 'application/json',
        'accept-language': 'en-US,en;q=0.9'
    }
});
```

---

## 📝 Feature-by-Feature Migration

### 1. Ask AI / Chat Feature

**Original:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiChat/AiChat.js`

**Key Changes:**
- Replace React state with module variables
- Convert JSX message rendering to DOM manipulation
- Replace Redux actions with direct API calls

**Migration Example:**

```javascript
// React: useState for messages
const [messages, setMessages] = useState([]);

// Plugin: Module variable
let messages = [];

// React: JSX rendering
messages.map(msg => <div className="message">{msg.text}</div>)

// Plugin: DOM manipulation
function addMessage(text, sender) {
    const container = document.getElementById('chat-container');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.textContent = text;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}
```

**See:** `scripts/askAI.js` for complete implementation

---

### 2. Summary Feature

**Original:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiChat/Summary.js`

**Key Changes:**
- Streaming response handling (similar logic, different UI updates)
- Replace Redux dispatch with direct UI updates
- Convert React loading states to DOM manipulation

**Migration Example:**

```javascript
// React: Streaming with Redux
if (res.ok && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        dispatch(setSummaryData(accumulated));  // React update
    }
}

// Plugin: Streaming with direct UI update
if (res.ok && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    const resultEl = document.getElementById('summary-result');
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        resultEl.innerHTML = formatSummary(accumulated);  // Direct DOM update
    }
}
```

**See:** `scripts/summary.js` for complete implementation

---

### 3. Obligations Feature

**Original:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiObligation.js`

**Key Changes:**
- HTML rendering (can use innerHTML directly)
- Replace Redux state with local variables
- Convert button handlers to event listeners

**Migration Notes:**
- Obligations often return HTML - can use `innerHTML` directly
- Copy functionality can use Clipboard API
- Regenerate follows same pattern as generate

**See:** `scripts/obligations.js` for complete implementation

---

### 4. Clauses Feature

**Original:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiClause.js`

**Key Changes:**
- Similar to Summary (streaming response)
- Formatting can be HTML strings
- Display updates via innerHTML

**See:** `scripts/clauses.js` for complete implementation

---

### 5. AI Playbook Feature

**Original:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiPlaybook.js`

**This is the most complex feature** because it includes:
- List view with filters
- Detail view
- Create/edit views
- Complex state management

**Migration Strategy:**

Start simple, then enhance:

1. **Phase 1: Basic execution**
   - Playbook selection dropdown
   - Run button
   - Results display

2. **Phase 2: Add list view**
   - Fetch playbook list
   - Display in table/list
   - Add selection

3. **Phase 3: Add filters**
   - Filter by status
   - Filter by type
   - Search functionality

4. **Phase 4: Add detail view**
   - Show playbook details
   - Run from detail view
   - Show results breakdown

**See:** `scripts/playbook.js` for basic implementation (Phase 1)

---

### 6. Approval Feature

**Original:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/ClauseApproval/ClauseApproval.js`

**Key Changes:**
- Workflow initiation
- Status display
- Approval matrix (can be simplified initially)

**Migration Notes:**
- Start with basic workflow start
- Add status tracking later
- Approval matrix can be a separate simplified view

**See:** `scripts/approval.js` for complete implementation

---

## 🔧 Helper Functions

### Create Reusable Helpers

Extract common patterns into helper functions:

```javascript
// API call helper
async function callBackendAPI(endpoint, data, method = 'GET') {
    const backendUrl = window.getBackendUrl();
    const accessToken = window.getAccessToken();
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': accessToken,
            'accept-language': 'en-US,en;q=0.9'
        }
    };
    
    if (method === 'POST' && data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${backendUrl}${endpoint}`, options);
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
}

// UI update helper
function updateResultContainer(containerId, content, isError = false) {
    const container = document.getElementById(containerId);
    if (isError) {
        container.innerHTML = `<div class="error-message">${content}</div>`;
    } else {
        container.innerHTML = content;
    }
    container.style.display = 'block';
}

// Loading state helper
function setLoadingState(buttonId, loadingContainerId, isLoading) {
    const btn = document.getElementById(buttonId);
    const loader = document.getElementById(loadingContainerId);
    
    if (btn) btn.disabled = isLoading;
    if (loader) loader.style.display = isLoading ? 'flex' : 'none';
}
```

---

## ✅ Migration Checklist

For each feature, ensure:

- [ ] API endpoints are correct and match backend
- [ ] Authentication tokens are passed correctly
- [ ] Error handling is implemented
- [ ] Loading states are shown/hidden
- [ ] UI updates correctly after API calls
- [ ] Streaming responses work (if applicable)
- [ ] User feedback is provided for errors
- [ ] Code is tested in OnlyOffice editor
- [ ] Browser console shows no errors

---

## 🚀 Post-Migration Steps

### 1. Testing

Test each feature:
- ✅ Basic functionality works
- ✅ API calls are correct
- ✅ Error handling works
- ✅ Loading states appear
- ✅ UI updates correctly

### 2. Edge Cases

Handle edge cases:
- Empty responses
- Network errors
- Invalid tokens
- Missing data
- Large responses

### 3. Performance

Optimize:
- Minimize DOM operations
- Cache API responses if appropriate
- Debounce user inputs
- Lazy load features if needed

### 4. User Experience

Enhance UX:
- Better error messages
- Loading animations
- Success feedback
- Helpful tooltips
- Keyboard shortcuts

---

## 💡 Tips & Best Practices

1. **Start Simple:** Get basic functionality working first
2. **Test Frequently:** Test after each feature migration
3. **Keep Code Clean:** Extract common patterns into helpers
4. **Document Changes:** Comment what you changed and why
5. **Match Original Behavior:** Try to replicate original functionality
6. **Use Browser DevTools:** Console and Network tabs are your friends
7. **Version Control:** Commit frequently during migration

---

## 📚 Reference: API Endpoints

| Feature | Endpoint | Method | Parameters |
|---------|----------|--------|------------|
| Ask AI | `/ai-assistant/ask-question` | POST | `question`, `documentContent`, `contractId`, etc. |
| Summary | `/ai-assistant/onlyoffice/generate-summary` | GET | `contractId`, `userId`, `organizationId` |
| Clauses | `/ai-assistant/onlyoffice/generate-AiClause` | GET | `contractId`, `userId`, `organizationId` |
| Obligations | `/ai-assistant/generate-obligation` | POST | `contractId`, `userId`, etc. |
| Playbook List | `/ai-assistant/global-playbooks` | GET | `contractId`, `userId`, etc. |
| Run Playbook | `/ai-assistant/run-playbook` | POST | `playbookId`, `contractId`, etc. |
| Start Approval | `/clause-approval/start-clause-approval-workflow` | POST | `contractId`, `userId`, etc. |

---

**Last Updated:** 2024
