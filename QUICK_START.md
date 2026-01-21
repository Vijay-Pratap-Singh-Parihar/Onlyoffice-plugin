# Quick Start Guide - AI Contract Assistant Plugin

## 🚀 Getting Started in 5 Minutes

### Step 0: Start Local Server (IMPORTANT!)

**Before testing, you MUST start a local web server!**

**Windows (PowerShell/CMD):**
```bash
cd contract-frontend\onlyoffice-plugins\ai-contract-plugin
npx http-server -p 8080 --cors
```

**Mac/Linux:**
```bash
cd contract-frontend/onlyoffice-plugins/ai-contract-plugin
npx http-server -p 8080 --cors
```

**Or use the provided scripts:**
- **Windows:** Double-click `start-server.bat` or run `.\start-server.ps1` in PowerShell
- **Mac/Linux:** Run `./start-server.sh` (make executable: `chmod +x start-server.sh`)

**Verify server is running:**
1. Open browser: http://localhost:8080
2. You should see a file listing
3. Try: http://localhost:8080/config.json
4. Should display the JSON configuration

**Troubleshooting "connection refused":**
- ✅ Make sure server is running (check terminal window)
- ✅ Check port 8080 is not in use
- ✅ Try different port: `npx http-server -p 3000 --cors`
- ✅ Check firewall settings
- ✅ Make sure you're in the correct directory

### Step 1: Verify Plugin Structure

Make sure you have this folder structure:
```
onlyoffice-plugins/
└── ai-contract-plugin/
    ├── config.json
    ├── index.html
    ├── scripts/
    │   ├── main.js
    │   ├── askAI.js
    │   ├── summary.js
    │   ├── obligations.js
    │   ├── clauses.js
    │   ├── playbook.js
    │   └── approval.js
    ├── styles/
    │   └── plugin.css
    └── resources/
        └── img/
            └── (icon files)
```

### Step 2: Icon Files ✅

**Good news!** Sample SVG icons are already included:
- ✅ `resources/img/icon.svg` - Main plugin icon
- ✅ `resources/img/ask-ai-icon.svg` - Ask AI feature
- ✅ `resources/img/summary-icon.svg` - Summary feature
- ✅ `resources/img/obligations-icon.svg` - Obligations feature
- ✅ `resources/img/clauses-icon.svg` - Clauses feature
- ✅ `resources/img/playbook-icon.svg` - AI Playbook feature
- ✅ `resources/img/approval-icon.svg` - Approval feature

All icons are ready to use! They're designed with:
- Blue theme (#2667ff) matching your design system
- 32x32px size for buttons
- 64x64px for main icon
- Clean, modern design

**Note:** If you prefer PNG format, you can convert these SVGs using any image editor or online tool.

### Step 3: Test Locally (Developer Mode)

#### Option A: Direct Configuration (Recommended)

Instead of using developer mode, configure the plugin directly in your backend:

1. **Start a local server:**

   **Windows (PowerShell/CMD):**
   ```bash
   cd contract-frontend\onlyoffice-plugins\ai-contract-plugin
   npx http-server -p 8080 --cors
   ```
   
   **Or use the provided script:**
   ```bash
   # Double-click start-server.bat
   # OR run in PowerShell:
   .\start-server.ps1
   ```

   **Mac/Linux:**
   ```bash
   cd contract-frontend/onlyoffice-plugins/ai-contract-plugin
   npx http-server -p 8080 --cors
   ```
   
   **Or use the provided script:**
   ```bash
   chmod +x start-server.sh
   ./start-server.sh
   ```

   **Verify server is running:**
   - Open browser and go to: http://localhost:8080
   - You should see a file listing or the plugin files
   - Try: http://localhost:8080/config.json
   - Should show the JSON configuration

2. **Update your backend OnlyOffice configuration** to include the plugin:
   ```javascript
   // In your onlyOfficeService.js
   editorConfig: {
       // ... other config
       plugins: {
           autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
           pluginsData: [
               "http://localhost:8080/config.json"  // Your local plugin
           ]
       }
   }
   ```

3. **Open OnlyOffice Editor** - The plugin should load automatically!

#### Option B: Developer Mode (If Option A doesn't work)

**Important:** The `Asc.editor` API is only available when the editor is fully loaded.

1. **Start a local server:**
   
   **Windows:**
   ```bash
   cd contract-frontend\onlyoffice-plugins\ai-contract-plugin
   npx http-server -p 8080 --cors
   ```
   
   **Mac/Linux:**
   ```bash
   cd contract-frontend/onlyoffice-plugins/ai-contract-plugin
   npx http-server -p 8080 --cors
   ```
   
   **Verify it's working:**
   - Open http://localhost:8080 in your browser
   - You should see your plugin files
   - Try http://localhost:8080/config.json - should show JSON

2. **Open OnlyOffice Editor** in your browser with a document loaded

3. **Wait for editor to fully load** (wait 5-10 seconds after page loads)

4. **Open Browser Console** (F12)

5. **Check if API is available:**
   ```javascript
   // First, check if Asc is available
   console.log(typeof Asc);  // Should be "object"
   console.log(typeof Asc.editor);  // Should be "object"
   ```

6. **If API is available, install plugin:**
   ```javascript
   // Method 1: Try this first
   if (typeof Asc !== 'undefined' && Asc.editor) {
       Asc.editor.installDeveloperPlugin("http://localhost:8080/config.json");
   }
   
   // Method 2: Alternative (if Method 1 doesn't work)
   if (typeof window.Asc !== 'undefined' && window.Asc.editor) {
       window.Asc.editor.installDeveloperPlugin("http://localhost:8080/config.json");
   }
   
   // Method 3: Wait for editor ready event
   window.addEventListener('load', function() {
       setTimeout(function() {
           if (typeof Asc !== 'undefined' && Asc.editor) {
               Asc.editor.installDeveloperPlugin("http://localhost:8080/config.json");
               console.log('Plugin installed!');
           } else {
               console.error('OnlyOffice API not available. Make sure editor is fully loaded.');
           }
       }, 2000); // Wait 2 seconds for editor to initialize
   });
   ```

7. **Refresh the page** - Your plugin should appear!

#### Troubleshooting Developer Mode

**Error: "Cannot read properties of undefined"**

This means `Asc.editor` is not available. Try:

1. **Wait longer** - The editor takes time to load:
   ```javascript
   // Wait 5 seconds after page load
   setTimeout(function() {
       if (typeof Asc !== 'undefined' && Asc.editor) {
           Asc.editor.installDeveloperPlugin("http://localhost:8080/config.json");
       } else {
           console.error('Editor API not ready. Try refreshing the page.');
       }
   }, 5000);
   ```

2. **Check editor context** - Make sure you're in the editor iframe:
   ```javascript
   // Check if you're in the right context
   console.log(window.location.href);
   // Should be something like: http://documentserver/...
   ```

3. **Use Option A instead** - Direct configuration is more reliable

4. **Check CORS** - Make sure your server has CORS enabled:
   ```bash
   # http-server with CORS
   npx http-server -p 8080 --cors
   
   # Or python with CORS headers
   python -m http.server 8080
   # (Note: Python's server doesn't have CORS by default)
   ```

### Step 4: Verify Plugin is Working

After installation, verify the plugin:

1. **Check Plugin Manager:**
   - In OnlyOffice editor, go to **Plugins** → **Plugin Manager**
   - Look for "AI Contract Assistant"
   - It should show as installed/enabled

2. **Check for Plugin Panel:**
   - The plugin should appear as a right-side panel
   - Look for plugin buttons in the toolbar (if configured)

3. **Check Browser Console:**
   - Open Console (F12)
   - Look for: "AI Contract Assistant Plugin initialized"
   - Check for any errors

4. **Test a Feature:**
   - Click on a feature tab (e.g., "Summary")
   - Click "Generate Summary" button
   - Check if API calls are made (Network tab)

### Step 5: Update Backend Configuration

In your backend code (where you configure OnlyOffice), update the plugin configuration:

```javascript
// In your onlyOfficeService.js or similar file
plugins: {
    autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
    pluginsData: [
        `${process.env.ONLYOFFICE_SERVER_URL}/plugins/ai-contract-plugin/config.json`
    ]
}
```

### Step 6: Pass Plugin Data

When initializing the plugin, pass necessary data:

```javascript
// In your backend, when creating OnlyOffice config
editorConfig: {
    // ... other config
    plugins: {
        pluginsData: [
            {
                url: `${ONLYOFFICE_SERVER_URL}/plugins/ai-contract-plugin/config.json`,
                initData: JSON.stringify({
                    contractId: contractId,
                    accessToken: accessToken,
                    userId: userId,
                    organizationId: organizationId,
                    backendUrl: process.env.BACKEND_BASE_URL + '/api'
                })
            }
        ]
    }
}
```

### Step 7: Deploy to Document Server

1. **Copy plugin folder to Document Server:**
   ```bash
   # Linux
   sudo cp -r contract-frontend/onlyoffice-plugins/ai-contract-plugin \
        /var/www/onlyoffice/documentserver/sdkjs-plugins/
   
   # Windows
   xcopy contract-frontend\onlyoffice-plugins\ai-contract-plugin \
        "C:\Program Files\ONLYOFFICE\DocumentServer\sdkjs-plugins\ai-contract-plugin\" /E /I
   ```

2. **Set proper permissions:**
   ```bash
   sudo chown -R onlyoffice:onlyoffice /var/www/onlyoffice/documentserver/sdkjs-plugins/ai-contract-plugin
   sudo chmod -R 755 /var/www/onlyoffice/documentserver/sdkjs-plugins/ai-contract-plugin
   ```

3. **Restart Document Server:**
   ```bash
   sudo supervisorctl restart ds:docservice
   # OR
   sudo systemctl restart ds-docservice
   ```

### Step 8: Verify Installation

1. Open OnlyOffice editor
2. Go to **Plugins** → **Plugin Manager**
3. Find "AI Contract Assistant"
4. Enable it
5. The plugin panel should appear on the right side

## 🔧 Common Issues & Solutions

### Quick Fixes

**Error: "localhost refused to connect"**

👉 **Solution:** Your local server isn't running!
1. Make sure you're in the plugin directory
2. Run: `npx http-server -p 8080 --cors`
3. Verify: Open http://localhost:8080 in browser
4. See "Server Setup" section below for detailed steps

**Error: "Cannot read properties of undefined (reading 'installDeveloperPlugin')"**

👉 **Solution:** Use **Option A (Direct Configuration)** instead of developer mode. It's more reliable!

Or use the helper script:
1. Open browser console
2. Copy and paste content from `install-plugin.js`
3. Press Enter

**For more detailed troubleshooting, see:**
- 📖 **TROUBLESHOOTING.md** - Complete troubleshooting guide
- 🔧 **install-plugin.js** - Helper script for installation

### Common Checks

**Plugin Not Appearing:**
- ✅ `config.json` syntax is valid (use JSON validator)
- ✅ All file paths in `config.json` are correct
- ✅ Icon files exist
- ✅ File permissions are correct
- ✅ Document Server was restarted

**API Calls Failing:**
- ✅ Backend URL is correct in `main.js`
- ✅ Access token is being passed correctly
- ✅ CORS is enabled on your backend
- ✅ Backend endpoints match your API

**UI Not Displaying:**
- ✅ Browser console for JavaScript errors
- ✅ CSS file is loading (check Network tab)
- ✅ HTML structure is correct

## 📝 Next Steps

1. **Customize the UI** - Update `styles/plugin.css`
2. **Add more features** - Extend the JavaScript modules
3. **Test thoroughly** - Test all features with real documents
4. **Add error handling** - Improve user experience
5. **Add loading states** - Better UX during API calls

## 🆘 Need Help?

1. Check the main README.md for detailed explanations
2. Review OnlyOffice plugin documentation
3. Check browser console for errors
4. Ask your team for assistance

---

**Happy Plugin Development! 🎉**
