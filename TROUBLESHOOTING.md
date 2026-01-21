# Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Cannot read properties of undefined (reading 'installDeveloperPlugin')"

**Error Message:**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'installDeveloperPlugin')
```

**Cause:**
The OnlyOffice API (`Asc.editor`) is not available yet. This happens when:
- The editor hasn't finished loading
- You're running the command in the wrong context (parent page vs editor iframe)
- The API method name is different in your OnlyOffice version

**Solutions:**

#### Solution 1: Wait for Editor to Load (Recommended)

```javascript
// Wait for editor to fully initialize
setTimeout(function() {
    if (typeof Asc !== 'undefined' && Asc.editor && Asc.editor.installDeveloperPlugin) {
        Asc.editor.installDeveloperPlugin("http://localhost:8080/config.json");
        console.log('✅ Plugin installed!');
    } else {
        console.error('❌ API still not available. Try Solution 2.');
    }
}, 5000); // Wait 5 seconds
```

#### Solution 2: Use Direct Backend Configuration (Best Practice)

Instead of using developer mode, configure the plugin directly in your backend:

```javascript
// In your onlyOfficeService.js
editorConfig: {
    plugins: {
        autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
        pluginsData: [
            "http://localhost:8080/config.json"  // Your plugin URL
        ]
    }
}
```

This is more reliable and doesn't require manual installation.

#### Solution 3: Check Editor Context

Make sure you're in the editor iframe, not the parent page:

```javascript
// Check current context
console.log('Current URL:', window.location.href);
// Should be something like: http://documentserver/...

// If you're in parent page, you need to access the iframe
const editorFrame = document.querySelector('iframe[src*="documentserver"]');
if (editorFrame) {
    // Access the iframe's window
    const editorWindow = editorFrame.contentWindow;
    // Then try: editorWindow.Asc.editor.installDeveloperPlugin(...)
}
```

#### Solution 4: Use Helper Script

Use the provided `install-plugin.js` script:

1. Open browser console
2. Copy and paste the entire content of `install-plugin.js`
3. Press Enter
4. The script will check API availability and retry if needed

---

### Issue 2: Plugin Not Appearing After Installation

**Symptoms:**
- Installation seems successful
- But plugin doesn't appear in Plugin Manager
- No plugin panel visible

**Solutions:**

1. **Check Plugin Manager:**
   - Go to Plugins → Plugin Manager
   - Look for "AI Contract Assistant"
   - Make sure it's enabled

2. **Check Browser Console:**
   - Look for errors
   - Check for: "AI Contract Assistant Plugin initialized"
   - Verify config.json is accessible

3. **Verify config.json is accessible:**
   ```bash
   # Test in browser
   curl http://localhost:8080/config.json
   # Should return valid JSON
   ```

4. **Check CORS:**
   - Make sure your server has CORS enabled
   - OnlyOffice needs to fetch the config.json file

5. **Check config.json syntax:**
   - Validate JSON syntax
   - Check all file paths are correct
   - Verify icon files exist

---

### Issue 3: Plugin Appears But Features Don't Work

**Symptoms:**
- Plugin panel appears
- Buttons are visible
- But clicking features doesn't work

**Solutions:**

1. **Check Browser Console:**
   - Look for JavaScript errors
   - Check Network tab for failed API calls

2. **Verify API Endpoints:**
   - Check backend URL is correct
   - Verify endpoints match your backend
   - Test endpoints directly with curl/Postman

3. **Check Authentication:**
   - Verify access token is being passed
   - Check token is valid
   - Look for 401/403 errors in Network tab

4. **Check Plugin Data:**
   ```javascript
   // In browser console
   console.log(window.pluginData);
   // Should show: { contractId, accessToken, userId, etc. }
   ```

---

### Issue 4: CORS Errors

**Error Message:**
```
Access to fetch at 'http://localhost:8080/config.json' from origin '...' has been blocked by CORS policy
```

**Solution:**

Make sure your local server has CORS enabled:

```bash
# http-server with CORS
npx http-server -p 8080 --cors

# Or use a CORS-enabled server
npx serve -p 8080 --cors
```

---

### Issue 5: Icons Not Displaying

**Symptoms:**
- Plugin works but icons are missing
- Broken image icons

**Solutions:**

1. **Check icon file paths:**
   - Verify icons exist in `resources/img/`
   - Check paths in config.json match actual files

2. **Check icon format:**
   - OnlyOffice supports both SVG and PNG
   - Make sure files are valid

3. **Check file permissions:**
   - Icons must be readable
   - Check server can serve the files

---

### Issue 6: Plugin Not Loading on Document Server

**Symptoms:**
- Works locally but not on server
- Plugin doesn't appear in production

**Solutions:**

1. **Check file permissions:**
   ```bash
   sudo chown -R onlyoffice:onlyoffice /var/www/onlyoffice/documentserver/sdkjs-plugins/ai-contract-plugin
   sudo chmod -R 755 /var/www/onlyoffice/documentserver/sdkjs-plugins/ai-contract-plugin
   ```

2. **Restart Document Server:**
   ```bash
   sudo supervisorctl restart ds:docservice
   # OR
   sudo systemctl restart ds-docservice
   ```

3. **Check server logs:**
   ```bash
   # Check for plugin-related errors
   tail -f /var/log/onlyoffice/documentserver/docservice/out.log
   ```

4. **Verify plugin path in config:**
   - Make sure backend points to correct plugin URL
   - Check ONLYOFFICE_SERVER_URL is correct

---

## Debug Checklist

When troubleshooting, check these in order:

- [ ] Local server is running and accessible
- [ ] config.json is valid JSON and accessible
- [ ] All icon files exist
- [ ] Browser console shows no errors
- [ ] Network tab shows successful requests
- [ ] Plugin appears in Plugin Manager
- [ ] Plugin panel is visible
- [ ] API endpoints are correct
- [ ] Authentication tokens are valid
- [ ] CORS is enabled on server

---

## Getting More Help

1. **Check OnlyOffice Documentation:**
   - https://api.onlyoffice.com/pluginapi/
   - https://api.onlyoffice.com/docs/plugin-and-macros/

2. **Check Browser Console:**
   - Look for specific error messages
   - Check Network tab for failed requests

3. **Check Server Logs:**
   - Document Server logs
   - Your backend logs

4. **Ask Your Team:**
   - Share error messages
   - Share browser console output
   - Share server logs

---

## Quick Test Script

Run this in browser console to diagnose issues:

```javascript
// Quick diagnostic script
console.log('=== OnlyOffice Plugin Diagnostic ===');
console.log('1. Asc available:', typeof Asc !== 'undefined');
console.log('2. Asc.editor available:', typeof Asc !== 'undefined' && typeof Asc.editor !== 'undefined');
console.log('3. installDeveloperPlugin available:', typeof Asc !== 'undefined' && typeof Asc.editor !== 'undefined' && typeof Asc.editor.installDeveloperPlugin !== 'undefined');
console.log('4. Current URL:', window.location.href);
console.log('5. Plugin data:', window.pluginData);
console.log('=== End Diagnostic ===');
```
