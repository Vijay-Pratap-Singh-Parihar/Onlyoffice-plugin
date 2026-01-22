# Troubleshooting Guide - AI Contract Assistant Plugin

This guide covers common issues and their solutions when working with the AI Contract Assistant plugin.

---

## 🔍 Common Issues

### Issue 1: Plugin Not Appearing in Editor

**Symptoms:**
- Plugin doesn't show up in OnlyOffice editor
- No right-side panel visible
- Plugin Manager doesn't show the plugin

**Solutions:**

#### 1.1 Check Plugin URL is Accessible

```bash
# Test in browser or terminal
curl http://localhost:8080/config.json

# Should return valid JSON
# If connection refused, server isn't running
```

**Fix:**
- Start local server: `npx http-server -p 8080 --cors`
- Verify port 8080 isn't in use
- Check firewall settings

#### 1.2 Verify Backend Configuration

Check your `onlyOfficeService.js`:

```javascript
plugins: {
    autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],  // GUID must match
    pluginsData: [
        {
            url: "http://localhost:8080/config.json",  // Must be accessible
            initData: JSON.stringify({...})
        }
    ]
}
```

**Common Mistakes:**
- Wrong GUID format
- Missing `autostart` array
- Incorrect URL
- URL not accessible from editor

#### 1.3 Check Browser Console

Open browser console (F12) and look for:

```
✅ Good: "AI Contract Assistant Plugin initialized"
❌ Bad: CORS errors, 404 errors, JSON parse errors
```

**If you see errors:**
- CORS error → Server needs `--cors` flag
- 404 error → Check plugin URL path
- JSON error → Validate config.json syntax

#### 1.4 Verify config.json is Valid

```bash
# Validate JSON syntax
cat config.json | python -m json.tool

# OR use online validator
# https://jsonlint.com/
```

**Common JSON Issues:**
- Trailing commas
- Missing quotes
- Invalid escape characters
- Missing required fields

---

### Issue 2: Plugin Loads But Features Don't Work

**Symptoms:**
- Plugin panel appears
- Buttons are visible
- Clicking features shows errors or nothing happens

**Solutions:**

#### 2.1 Check Browser Console for Errors

Open console (F12) and check:

```javascript
// Check plugin data is loaded
console.log(window.pluginData);
// Should show: { contractId, accessToken, userId, ... }

// Check helper functions exist
console.log(typeof window.getBackendUrl);  // Should be "function"
console.log(typeof window.getAccessToken); // Should be "function"
```

#### 2.2 Verify API Endpoints

Check Network tab (F12 → Network):

**Expected API Calls:**
- `POST /ai-assistant/ask-question`
- `GET /ai-assistant/onlyoffice/generate-summary`
- `POST /ai-assistant/generate-obligation`
- etc.

**Common Issues:**
- 401 Unauthorized → Invalid or missing access token
- 404 Not Found → Wrong endpoint URL
- CORS error → Backend CORS not configured
- 500 Server Error → Backend issue

**Fix:**
```javascript
// Check token is being passed
const token = window.getAccessToken();
console.log('Token:', token);  // Should not be empty

// Check backend URL
const backendUrl = window.getBackendUrl();
console.log('Backend URL:', backendUrl);  // Should be correct
```

#### 2.3 Verify initData is Passed Correctly

In your backend configuration:

```javascript
initData: JSON.stringify({
    contractId: contractId,           // Required
    accessToken: accessToken,         // Required
    userId: userId,                   // Required
    organizationId: organizationId,   // Required
    backendUrl: BACKEND_URL + '/api'  // Required
})
```

**Check in plugin:**
```javascript
// In browser console
const data = window.getPluginData();
console.log('Contract ID:', data.contractId);
console.log('Backend URL:', data.backendUrl);
```

#### 2.4 Test API Endpoints Directly

Use curl or Postman to test:

```bash
# Test summary endpoint
curl -X GET \
  "http://your-backend/api/ai-assistant/onlyoffice/generate-summary?contractId=123&userId=456&organizationId=789" \
  -H "x-auth-token: YOUR_TOKEN"
```

If this fails, the issue is with your backend, not the plugin.

---

### Issue 3: CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:8080/config.json' from origin '...' 
has been blocked by CORS policy
```

**Solution:**

#### 3.1 Enable CORS on Local Server

```bash
# http-server with CORS
npx http-server -p 8080 --cors

# Python (with CORS)
python -m http.server 8080
# Note: Python server doesn't support CORS by default
# Use http-server or add CORS headers manually
```

#### 3.2 Configure CORS on Backend

Your backend API must allow requests from OnlyOffice editor origin:

```javascript
// Example Express.js CORS configuration
app.use(cors({
    origin: ['http://your-onlyoffice-server.com', 'http://localhost:*'],
    credentials: true
}));
```

---

### Issue 4: Icons Not Displaying

**Symptoms:**
- Plugin works but icons show as broken images
- Missing icons in toolbar

**Solutions:**

#### 4.1 Check Icon File Paths

In `config.json`, verify icon paths:

```json
{
  "iconPath": "resources/img/icon.svg",  // Must match actual file location
  "buttons": [{
    "iconPath": "resources/img/ask-ai-icon.svg"
  }]
}
```

#### 4.2 Verify Files Exist

```bash
# Check if icon files exist
ls -la resources/img/

# Should show:
# - icon.svg
# - ask-ai-icon.svg
# - summary-icon.svg
# - etc.
```

#### 4.3 Check File Permissions

```bash
# Make sure files are readable
chmod 644 resources/img/*.svg
```

#### 4.4 Use PNG Icons (Alternative)

If SVG icons don't work, convert to PNG:

1. Create `resources/light/` and `resources/dark/` directories
2. Place PNG icons with naming pattern: `icon@1.25x.png`, etc.
3. Update `config.json` icons pattern (already configured)

---

### Issue 5: Plugin Works Locally But Not in Production

**Symptoms:**
- Plugin works on localhost
- Doesn't work on Document Server
- Production deployment issues

**Solutions:**

#### 5.1 Check File Permissions

```bash
# On Document Server
sudo chown -R onlyoffice:onlyoffice \
     /var/www/onlyoffice/documentserver/sdkjs-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}

sudo chmod -R 755 \
     /var/www/onlyoffice/documentserver/sdkjs-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}
```

#### 5.2 Restart Document Server

```bash
# Restart service
sudo supervisorctl restart ds:docservice

# OR
sudo systemctl restart ds-docservice

# Verify service status
sudo supervisorctl status ds:docservice
```

#### 5.3 Check Server Logs

```bash
# Check Document Server logs
tail -f /var/log/onlyoffice/documentserver/docservice/out.log

# Look for plugin-related errors
grep -i "plugin\|error" /var/log/onlyoffice/documentserver/docservice/out.log
```

#### 5.4 Verify Production URL

In production backend config:

```javascript
plugins: {
    pluginsData: [{
        url: `${process.env.ONLYOFFICE_SERVER_URL}/plugins/ai-contract/config.json`
        // Must match actual plugin location on server
    }]
}
```

**Test URL:**
```bash
curl https://your-onlyoffice-server.com/plugins/ai-contract/config.json
```

---

### Issue 6: OnlyOffice API Methods Not Available

**Error:**
```
Cannot read properties of undefined (reading 'executeMethod')
```

**Solution:**

The plugin uses OnlyOffice plugin API which is only available when:
1. Plugin is loaded by OnlyOffice
2. Plugin is initialized properly
3. Using correct API methods

**Check:**
```javascript
// In browser console (within plugin context)
console.log(typeof window.Asc);           // Should be "object"
console.log(typeof window.Asc.plugin);    // Should be "object"
console.log(typeof window.Asc.plugin.executeMethod); // Should be "function"
```

**Fix:**
- Ensure SDK files are loaded: `../v1/plugins.js`
- Check plugin initialization in `main.js`
- Verify OnlyOffice version meets minimum requirement (8.2.0)

---

### Issue 7: Document Content Not Retrieved

**Symptoms:**
- Features work but can't access document text
- `getDocumentContent()` returns empty

**Solution:**

The OnlyOffice plugin API has limited methods. Document content retrieval depends on OnlyOffice version:

```javascript
// Current implementation uses:
window.Asc.plugin.executeMethod("GetDocumentContent", [], 
    function(data) {
        // Handle response
    },
    function(error) {
        // Fallback if method not available
    }
);
```

**Alternative Approaches:**
1. Pass document content from backend via `initData`
2. Use document selection API (works for selected text)
3. Request document from backend API separately

---

## 🔍 Debug Checklist

Use this checklist to systematically debug issues:

### Initial Checks

- [ ] Local server is running
- [ ] config.json is accessible via URL
- [ ] config.json has valid JSON syntax
- [ ] Backend configuration includes plugin URL
- [ ] Plugin GUID matches in config.json and backend

### Plugin Loading

- [ ] Plugin appears in Plugin Manager
- [ ] Plugin is enabled
- [ ] Browser console shows initialization message
- [ ] No JavaScript errors in console
- [ ] No CORS errors

### Feature Functionality

- [ ] Plugin panel is visible
- [ ] Tab navigation works
- [ ] Feature buttons are clickable
- [ ] API calls appear in Network tab
- [ ] API calls include authentication headers
- [ ] API responses are received

### Data & Configuration

- [ ] `window.pluginData` is populated
- [ ] Access token is present and valid
- [ ] Backend URL is correct
- [ ] Contract ID is present
- [ ] Helper functions are available

---

## 🛠️ Diagnostic Scripts

### Quick Diagnostic

Run this in browser console:

```javascript
console.log('=== Plugin Diagnostic ===');
console.log('1. Plugin data:', window.pluginData);
console.log('2. Backend URL:', window.getBackendUrl());
console.log('3. Access token:', window.getAccessToken() ? 'Present' : 'Missing');
console.log('4. Contract ID:', window.getContractId());
console.log('5. OnlyOffice API:', typeof window.Asc);
console.log('6. Plugin API:', typeof window.Asc?.plugin);
console.log('=== End Diagnostic ===');
```

### Test API Connectivity

```javascript
// Test backend connectivity
fetch(window.getBackendUrl() + '/health', {
    headers: {
        'x-auth-token': window.getAccessToken()
    }
})
.then(r => console.log('Backend reachable:', r.ok))
.catch(e => console.error('Backend error:', e));
```

---

## 📞 Getting Help

### Information to Provide

When asking for help, include:

1. **Error Messages:**
   - Browser console errors
   - Network tab errors
   - Server logs

2. **Configuration:**
   - Plugin URL
   - Backend configuration snippet
   - OnlyOffice version

3. **Environment:**
   - Local development or production
   - Browser and version
   - Operating system

4. **Steps to Reproduce:**
   - What you did
   - What you expected
   - What actually happened

### Resources

- **OnlyOffice Plugin API:** https://api.onlyoffice.com/pluginapi/
- **OnlyOffice Documentation:** https://api.onlyoffice.com/docs/
- **Plugin Examples:** https://github.com/ONLYOFFICE/sdkjs-plugins

---

**Last Updated:** 2024
