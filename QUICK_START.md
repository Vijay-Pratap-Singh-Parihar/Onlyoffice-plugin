# Quick Start Guide - AI Contract Assistant Plugin

## 🚀 Getting Started

This guide will help you set up and run the AI Contract Assistant plugin for OnlyOffice in minutes.

---

## Prerequisites

- OnlyOffice Desktop Editors or Document Server installed
- A local web server (for development) or web hosting (for production)
- Access to your contract backend API

---

## Step 1: Plugin Structure

Your plugin folder should have this structure:

```
{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}/
├── config.json              # Plugin configuration (REQUIRED)
├── index.html              # Main plugin UI
├── scripts/
│   ├── main.js            # Plugin initialization & API helpers
│   ├── askAI.js           # Ask AI feature
│   ├── summary.js         # Summary generation
│   ├── obligations.js     # Obligations extraction
│   ├── clauses.js         # Clauses extraction
│   ├── playbook.js        # AI Playbook execution
│   └── approval.js        # Approval workflow
├── styles/
│   └── plugin.css         # Plugin styles
└── resources/
    └── img/               # Plugin icons
        ├── icon.svg
        ├── ask-ai-icon.svg
        ├── summary-icon.svg
        ├── obligations-icon.svg
        ├── clauses-icon.svg
        ├── playbook-icon.svg
        └── approval-icon.svg
```

---

## Step 2: Start Local Development Server

**Before testing, you MUST start a local web server!**

### Windows (PowerShell)

```powershell
# Navigate to plugin directory
cd onlyoffice-plugins\{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}

# Option 1: Use provided script
.\start-server.ps1

# Option 2: Manual start
npx http-server -p 8080 --cors
```

### Windows (CMD/Batch)

```batch
# Double-click start-server.bat
# OR run manually:
cd onlyoffice-plugins\{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}
npx http-server -p 8080 --cors
```

### Mac/Linux

```bash
# Navigate to plugin directory
cd onlyoffice-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}

# Make script executable (first time only)
chmod +x start-server.sh

# Run script
./start-server.sh

# OR run manually:
npx http-server -p 8080 --cors
```

### Verify Server is Running

1. Open browser: **http://localhost:8080**
2. You should see a file listing
3. Test config.json: **http://localhost:8080/config.json**
4. Should display valid JSON configuration

---

## Step 3: Configure Backend Integration

### Update OnlyOffice Service Configuration

In your backend `onlyOfficeService.js`, configure the plugin:

```javascript
editorConfig: {
    // ... other configuration
    plugins: {
        autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
        pluginsData: [
            {
                url: "http://localhost:8080/config.json",  // Development
                // OR for production:
                // url: `${process.env.ONLYOFFICE_SERVER_URL}/plugins/ai-contract/config.json`,
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

### Important Configuration Notes

- **Development:** Use `http://localhost:8080/config.json` (local server)
- **Production:** Use your OnlyOffice server URL: `${ONLYOFFICE_SERVER_URL}/plugins/...`
- **initData:** Passes contract context to the plugin (contractId, tokens, etc.)
- **autostart:** Automatically starts the plugin when editor loads

---

## Step 4: Test Plugin Locally

### Option A: Web Editor (Recommended for Testing)

1. **Start local server** (see Step 2)
2. **Open OnlyOffice editor** in your web browser
3. **Load a document**
4. **Plugin should appear automatically** as a right-side panel
5. **Check browser console** (F12) for initialization message:
   ```
   AI Contract Assistant Plugin initialized
   ```

### Option B: Desktop Editor

1. **Start local server** (see Step 2)
2. **Open OnlyOffice Desktop Editor**
3. **Create or open a Word document**
4. **Go to Plugins menu**
5. **Open Plugin Manager**
6. **Install plugin:**
   - Enter URL: `http://localhost:8080/config.json`
   - Click Install
   - Enable the plugin

---

## Step 5: Verify Plugin Features

### Check Plugin Panel

1. Plugin panel should appear on the right side
2. Should show 6 tabs: Ask AI, Summary, Obligations, Clauses, AI Playbook, Approval
3. Each tab should be clickable

### Test Basic Functionality

1. **Click "Summary" tab**
2. **Click "Generate Summary" button**
3. **Check Network tab** (F12 → Network) for API call:
   - Should call: `/ai-assistant/onlyoffice/generate-summary`
   - Should include `x-auth-token` header
   - Should include `contractId` parameter

### Check Console for Errors

Open browser console (F12) and verify:
- ✅ No JavaScript errors
- ✅ Plugin initialization message
- ✅ API calls are being made
- ✅ Responses are received

---

## Step 6: Deploy to Production

### For Document Server (Linux)

```bash
# 1. Copy plugin to Document Server
sudo cp -r {9DC93CDB-B576-4F0C-B55E-FCC9C48DD007} \
     /var/www/onlyoffice/documentserver/sdkjs-plugins/

# 2. Set proper permissions
sudo chown -R onlyoffice:onlyoffice \
     /var/www/onlyoffice/documentserver/sdkjs-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}
sudo chmod -R 755 \
     /var/www/onlyoffice/documentserver/sdkjs-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}

# 3. Restart Document Server
sudo supervisorctl restart ds:docservice
# OR
sudo systemctl restart ds-docservice
```

### For Desktop Editor (Windows)

```powershell
# 1. Copy plugin to Desktop Editors directory
Copy-Item -Path "{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}" \
          -Destination "C:\Program Files\ONLYOFFICE\DesktopEditors\editors\sdkjs-plugins\" \
          -Recurse -Force

# 2. Restart OnlyOffice Desktop Editor
```

### Update Backend Configuration for Production

```javascript
editorConfig: {
    plugins: {
        autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
        pluginsData: [
            {
                url: `${process.env.ONLYOFFICE_SERVER_URL}/plugins/ai-contract/config.json`,
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

---

## Step 7: Icon Setup (Optional)

The plugin uses SVG icons by default. To use PNG icons (recommended for production):

### Create PNG Icon Structure

1. Create directories:
   ```
   resources/
   ├── light/
   │   ├── icon.png
   │   ├── icon@1.25x.png
   │   ├── icon@1.5x.png
   │   ├── icon@1.75x.png
   │   └── icon@2x.png
   └── dark/
       ├── icon.png
       ├── icon@1.25x.png
       ├── icon@1.5x.png
       ├── icon@1.75x.png
       └── icon@2x.png
   ```

2. Convert your SVG icons to PNG at different scales
3. The `config.json` already has the correct icon pattern configured

---

## 🔧 Troubleshooting

### Plugin Not Appearing

1. **Check server is running:**
   ```bash
   curl http://localhost:8080/config.json
   ```

2. **Check config.json is valid:**
   - Use JSON validator
   - Check all file paths are correct

3. **Check browser console:**
   - Look for plugin initialization errors
   - Check for CORS errors

### CORS Errors

```bash
# Make sure server has CORS enabled
npx http-server -p 8080 --cors
```

### Plugin Loads But Features Don't Work

1. **Check Network tab:**
   - Verify API calls are made
   - Check authentication headers
   - Verify backend URL is correct

2. **Check plugin data:**
   ```javascript
   // In browser console
   console.log(window.pluginData);
   // Should show: { contractId, accessToken, userId, ... }
   ```

3. **Verify backend endpoints:**
   - Test endpoints directly with Postman/curl
   - Check backend logs for errors

---

## 📋 Quick Checklist

- [ ] Local server running on port 8080
- [ ] config.json accessible at http://localhost:8080/config.json
- [ ] Backend configuration updated with plugin URL
- [ ] Plugin appears in OnlyOffice editor
- [ ] Browser console shows "Plugin initialized"
- [ ] Feature buttons are clickable
- [ ] API calls are being made (check Network tab)
- [ ] No console errors

---

## 📚 Next Steps

- Read **PLUGIN_OVERVIEW.md** for detailed architecture
- Check **TROUBLESHOOTING.md** for common issues
- Review **MIGRATION_GUIDE.md** if migrating from React

---

## 🆘 Need Help?

1. Check browser console for errors
2. Review server logs
3. Verify backend API endpoints
4. Check OnlyOffice plugin documentation
5. Review troubleshooting guide

---

**Plugin Version:** 1.0.0  
**OnlyOffice Min Version:** 8.2.0  
**Last Updated:** 2024
