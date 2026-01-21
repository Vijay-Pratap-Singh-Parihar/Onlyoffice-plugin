# Migration Guide: Moving Code from contract-frontend to OnlyOffice Plugin

This guide shows you how to convert your existing React components into vanilla JavaScript for the OnlyOffice plugin.

## 📋 Overview

Your current codebase uses:
- **React** components (`AiChat.js`, `AiPlaybook.js`, etc.)
- **Redux** for state management
- **React Router** for navigation
- **Modern React hooks** (useState, useEffect, etc.)

The plugin needs:
- **Vanilla JavaScript** (no React)
- **Plain HTML/CSS**
- **Direct DOM manipulation**
- **Event listeners** instead of React hooks

---

## 🔄 Migration Strategy

### Step 1: Identify Core Logic

For each feature, identify:
1. **API calls** - What endpoints are called?
2. **Data processing** - How is data transformed?
3. **UI updates** - What changes on screen?
4. **User interactions** - What buttons/clicks trigger actions?

### Step 2: Extract Business Logic

Separate the business logic from React-specific code:

**Before (React):**
```javascript
// From AiChat.js
const [loader, setLoader] = useState(false);
const [summaryData, setSummaryData] = useState('');

const handleGenerate = async () => {
  setLoader(true);
  const response = await fetch(url);
  const data = await response.json();
  setSummaryData(data.summary);
  setLoader(false);
};
```

**After (Plugin):**
```javascript
// In summary.js
let isLoading = false;
let summaryData = '';

async function handleGenerateSummary() {
  isLoading = true;
  updateLoadingUI(true);
  
  const response = await fetch(url);
  const data = await response.json();
  summaryData = data.summary;
  
  updateSummaryUI(data.summary);
  isLoading = false;
  updateLoadingUI(false);
}
```

---

## 📝 Feature-by-Feature Migration

### 1. Ask AI / Chat Feature

**Original Location:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiChat/AiChat.js`

**Key Components to Migrate:**
- Chat input handling
- Message display
- API calls to `/ai-assistant/ask-question`
- Streaming response handling (if applicable)

**Migration Steps:**

1. **Find the API endpoint:**
   ```javascript
   // Original
   const url = `${constants.BASE_URL}${constants.ASK_QUESTION}`;
   ```

2. **Convert to plugin format:**
   ```javascript
   // Plugin version
   const backendUrl = window.getBackendUrl();
   const url = `${backendUrl}/ai-assistant/ask-question`;
   ```

3. **Replace React state with variables:**
   ```javascript
   // Original: const [messages, setMessages] = useState([]);
   // Plugin: 
   let messages = [];
   ```

4. **Replace JSX with DOM manipulation:**
   ```javascript
   // Original JSX
   // <div className="chat-message">{message}</div>
   
   // Plugin version
   const messageDiv = document.createElement('div');
   messageDiv.className = 'chat-message';
   messageDiv.textContent = message;
   container.appendChild(messageDiv);
   ```

**Already Done:** See `scripts/askAI.js` for the migrated version.

---

### 2. Summary Feature

**Original Location:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiChat/Summary.js`

**Key Components:**
- Generate button click handler
- Streaming response handling
- Summary display formatting

**Migration Example:**

**Original React Code:**
```javascript
const handleRegenerate = async () => {
  setRegenerateLoader(true);
  const url = `${constants.BASE_URL}${constants.GENERATE_SUMMARY_ONLYOFFICE}?contractId=${id}...`;
  const res = await fetch(url, {
    headers: { 'x-auth-token': accessToken }
  });
  
  if (res.ok && res.body) {
    const reader = res.body.getReader();
    // ... streaming logic
    dispatch(setSummaryData(accumulated));
  }
};
```

**Plugin Version:**
```javascript
async function handleGenerateSummary() {
  const generateBtn = document.getElementById('generate-summary-btn');
  generateBtn.disabled = true;
  
  const pluginData = window.getPluginData();
  const url = `${window.getBackendUrl()}/ai-assistant/onlyoffice/generate-summary?contractId=${pluginData.contractId}...`;
  
  const res = await fetch(url, {
    headers: { 'x-auth-token': window.getAccessToken() }
  });
  
  if (res.ok && res.body) {
    const reader = res.body.getReader();
    // ... same streaming logic
    updateSummaryUI(accumulated);
  }
  
  generateBtn.disabled = false;
}
```

**Already Done:** See `scripts/summary.js` for the migrated version.

---

### 3. Obligations Feature

**Original Location:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiObligation.js`

**Key Components:**
- Obligation generation API call
- HTML rendering of obligations
- Copy/regenerate buttons

**Migration Notes:**
- The original uses Redux for state - replace with local variables
- HTML rendering can stay the same (just use `innerHTML` instead of JSX)
- Button handlers convert from React onClick to addEventListener

**Already Done:** See `scripts/obligations.js` for the migrated version.

---

### 4. Clauses Feature

**Original Location:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiClause.js`

**Key Components:**
- Clause extraction API call
- Streaming response handling
- Clause display formatting

**Migration Notes:**
- Similar to Summary - streaming response handling
- Display formatting can be HTML strings

**Already Done:** See `scripts/clauses.js` for the migrated version.

---

### 5. AI Playbook Feature

**Original Location:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/AiPlaybook.js`

**Key Components:**
- Playbook list fetching
- Playbook execution
- Results display with badges/status
- Filter functionality

**Migration Complexity:** ⚠️ **More Complex**

This is the most complex feature because it has:
- Multiple views (list, detail, create)
- Complex state management
- Filtering logic
- Streaming responses

**Migration Strategy:**

1. **Simplify the UI** - Start with a basic version:
   - Show playbook list
   - Run selected playbook
   - Display results

2. **Gradually add features:**
   - Add filtering
   - Add detail view
   - Add create functionality

3. **Convert state management:**
   ```javascript
   // Original: Multiple useState hooks
   const [playbooks, setPlaybooks] = useState([]);
   const [selectedPlaybook, setSelectedPlaybook] = useState(null);
   
   // Plugin: Use objects
   const playbookState = {
     playbooks: [],
     selectedPlaybook: null,
     filters: { status: 'all' }
   };
   ```

**Partially Done:** See `scripts/playbook.js` for a basic version. You may need to enhance it based on your specific requirements.

---

### 6. Approval Feature

**Original Location:** `src/views/pages/external_user/OnlyOfficePage/SidePanel/ClauseApproval/ClauseApproval.js`

**Key Components:**
- Approval workflow initiation
- Approval status display
- Approval matrix

**Migration Notes:**
- Start with basic workflow initiation
- Add status display later
- Approval matrix can be a separate view

**Already Done:** See `scripts/approval.js` for the migrated version.

---

## 🔧 Common Patterns

### Pattern 1: React State → Vanilla JS Variables

**Before:**
```javascript
const [data, setData] = useState(null);
setData(newData);
```

**After:**
```javascript
let data = null;
data = newData;
updateUI(); // Manually update UI
```

### Pattern 2: React useEffect → Event Listeners

**Before:**
```javascript
useEffect(() => {
  fetchData();
}, [dependency]);
```

**After:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
  fetchData();
});

// Or for button clicks
button.addEventListener('click', fetchData);
```

### Pattern 3: React JSX → DOM Manipulation

**Before:**
```javascript
return (
  <div className="container">
    <button onClick={handleClick}>Click</button>
    <div>{data}</div>
  </div>
);
```

**After:**
```javascript
const container = document.createElement('div');
container.className = 'container';

const button = document.createElement('button');
button.textContent = 'Click';
button.addEventListener('click', handleClick);
container.appendChild(button);

const dataDiv = document.createElement('div');
dataDiv.textContent = data;
container.appendChild(dataDiv);
```

### Pattern 4: React Redux → Local State

**Before:**
```javascript
const data = useSelector(state => state.aiChatReducer.summaryData);
dispatch(setSummaryData(newData));
```

**After:**
```javascript
// Store in window or module-level variable
window.pluginState = {
  summaryData: null
};

// Update
window.pluginState.summaryData = newData;
updateUI();
```

---

## 📦 API Endpoints Reference

Here are the API endpoints used in your codebase that you'll need in the plugin:

| Feature | Endpoint | Method | Notes |
|---------|----------|--------|-------|
| Ask AI | `/ai-assistant/ask-question` | POST | Requires question + document content |
| Summary | `/ai-assistant/onlyoffice/generate-summary` | GET | Streaming response |
| Clauses | `/ai-assistant/onlyoffice/generate-AiClause` | GET | Streaming response |
| Obligations | `/ai-assistant/generate-obligation` | POST | Returns HTML |
| Playbook List | `/ai-assistant/global-playbooks` | GET | Get available playbooks |
| Run Playbook | `/ai-assistant/run-playbook` | POST | Streaming response |
| Start Approval | `/clause-approval/start-clause-approval-workflow` | POST | Initiate workflow |

---

## ✅ Migration Checklist

For each feature, ensure:

- [ ] API endpoints are correct
- [ ] Authentication tokens are passed
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] UI updates correctly
- [ ] Streaming responses work (if applicable)
- [ ] User feedback is provided
- [ ] Code is tested

---

## 🚀 Next Steps After Migration

1. **Test each feature** individually
2. **Handle edge cases** (empty responses, errors, etc.)
3. **Improve UI/UX** based on testing
4. **Add loading animations**
5. **Add error messages**
6. **Optimize performance**

---

## 💡 Tips

1. **Start Simple** - Get basic functionality working first
2. **Test Frequently** - Test after each feature migration
3. **Keep It Simple** - Don't overcomplicate the plugin code
4. **Reuse Logic** - Extract common functions (API calls, UI updates)
5. **Document Changes** - Note what you changed and why

---

**Good luck with your migration! 🎉**
