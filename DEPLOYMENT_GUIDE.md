# Deployment & Integration Guide - OnlyOffice Plugin

This comprehensive guide covers deploying the AI Contract Assistant plugin for OnlyOffice, managing permissions, and integrating with your Docker-based infrastructure.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Docker Integration](#docker-integration)
3. [Deployment Process](#deployment-process)
4. [Permission Management](#permission-management)
5. [Backend Configuration](#backend-configuration)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 Overview

The AI Contract Assistant plugin integrates with your existing contract-backend infrastructure and follows the same deployment pattern as your MS Editor addins.

### Key Components

- **Plugin Files:** Static HTML/CSS/JS files served via web server
- **OnlyOffice Integration:** Plugin loaded via config.json URL
- **Backend APIs:** Uses existing contract-backend endpoints
- **Authentication:** JWT tokens passed via initData

### Architecture Flow

```
OnlyOffice Editor
    ↓
Loads plugin config.json
    ↓
Loads index.html (plugin UI)
    ↓
Makes API calls to contract-backend
    ↓
contract-backend validates permissions & processes
    ↓
Response sent back to plugin
```

---

## 🐳 Docker Integration

### Option 1: Serve Plugin from Nginx Container (Recommended)

#### Dockerfile for Plugin Server

Create `Dockerfile`:

```dockerfile
FROM nginx:alpine

# Copy plugin files
COPY {9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}/ /usr/share/nginx/html/plugins/ai-contract/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    
    # CORS headers for OnlyOffice
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # Plugin static files
    location /plugins/ai-contract/ {
        alias /usr/share/nginx/html/plugins/ai-contract/;
        try_files $uri $uri/ =404;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check
    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

#### Docker Compose Integration

Add to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # ... your existing services ...
  
  onlyoffice-plugin-server:
    build:
      context: ./onlyoffice-plugins
      dockerfile: Dockerfile
    container_name: onlyoffice-plugin-server
    ports:
      - "8080:80"
    volumes:
      # For development, mount plugin directory
      - ./onlyoffice-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}:/usr/share/nginx/html/plugins/ai-contract
    networks:
      - legistify-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Build and Run

```bash
# Build the container
docker-compose build onlyoffice-plugin-server

# Start the service
docker-compose up -d onlyoffice-plugin-server

# Check logs
docker-compose logs -f onlyoffice-plugin-server

# Verify it's working
curl http://localhost:8080/plugins/ai-contract/config.json
```

### Option 2: Integrate with Existing Web Server

If you already have a web server (Nginx/Apache) serving your MS Editor addins:

#### Nginx Configuration Addition

```nginx
# Add to existing server block
location /plugins/ai-contract/ {
    alias /var/www/projects/onlyoffice-plugin/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}/;
    try_files $uri $uri/ =404;
    
    # CORS for OnlyOffice
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
}
```

---

## 🚀 Deployment Process

### Development Deployment

#### Step 1: Local Testing

```bash
# Navigate to plugin directory
cd onlyoffice-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}

# Start local server (for testing)
npx http-server -p 8080 --cors

# Test accessibility
curl http://localhost:8080/config.json
```

#### Step 2: Update Backend Configuration

In `contract-backend/src/app/services/onlyOfficeService.js`:

```javascript
editorConfig: {
    // ... other config
    plugins: {
        autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
        pluginsData: [
            {
                url: process.env.ONLYOFFICE_PLUGIN_URL || "http://localhost:8080/plugins/ai-contract/config.json",
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

#### Step 3: Environment Variables

Add to `.env`:

```bash
# OnlyOffice Plugin Configuration
ONLYOFFICE_PLUGIN_URL=http://localhost:8080/plugins/ai-contract/config.json

# Production URL (update for production)
# ONLYOFFICE_PLUGIN_URL=https://plugins.legistify.com/plugins/ai-contract/config.json
```

### Production Deployment

#### Automated Deployment Script

Create `deploy.sh` (similar to MS Editor addins):

```bash
#!/bin/bash

# --- 1. Define Directories and Variables ---
# The live directory where the code is running
LIVE_DIR="/var/www/projects/onlyoffice-plugin.legistify.com/plugins/ai-contract"

# The source directory for the new code
SOURCE_DIR="/home/legistify/onlyoffice-plugins/{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}"

# Generate a unique date-time stamp for the backup folder name
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="${LIVE_DIR}_bckp/${TIMESTAMP}"

# --- SCRIPT COMMANDS ---

echo "🚀 Starting OnlyOffice Plugin Deployment Process..."
echo "Live Directory: ${LIVE_DIR}"

# 1. Take a Backup of the Current Live Directory
echo "📦 Step 1: Creating backup..."
sudo mkdir -p ${BACKUP_DIR}
sudo cp -r ${LIVE_DIR}/* ${BACKUP_DIR}/

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully at ${BACKUP_DIR}"
else
    echo "❌ Backup failed. Aborting deployment."
    exit 1
fi

# 2. Pull the latest code from Git (if using Git)
echo "📥 Step 2: Pulling latest code from Git..."
cd /home/legistify/onlyoffice-plugins
git pull

if [ $? -eq 0 ]; then
    echo "✅ Git pull completed successfully"
else
    echo "⚠️  Git pull failed. Continuing with existing code..."
fi

# 3. Copy the new files from source to live directory
echo "📋 Step 3: Copying new plugin files..."
sudo cp -r ${SOURCE_DIR}/* ${LIVE_DIR}/

if [ $? -eq 0 ]; then
    echo "✅ Files copied successfully"
else
    echo "❌ File copy failed. Restore from ${BACKUP_DIR} if needed."
    exit 1
fi

# 4. Set proper permissions
echo "🔐 Step 4: Setting permissions..."
sudo chown -R www-data:www-data ${LIVE_DIR}
sudo chmod -R 755 ${LIVE_DIR}

# 5. Reload/restart web server
echo "🔄 Step 5: Reloading web server..."
if systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "⚠️  Nginx not running or using different server"
fi

# 6. Restart Docker container (if using Docker)
if command -v docker-compose &> /dev/null; then
    echo "🐳 Step 6: Restarting Docker container..."
    docker-compose restart onlyoffice-plugin-server
    echo "✅ Docker container restarted"
fi

echo "🎉 Deployment Finalized!"
echo "Backup location: ${BACKUP_DIR}"
echo "Plugin URL: https://plugins.legistify.com/plugins/ai-contract/config.json"
```

#### Make Script Executable

```bash
chmod +x deploy.sh
```

#### Deployment Steps

```bash
# 1. Commit and push changes
git add .
git commit -m "Update OnlyOffice plugin"
git push origin main

# 2. SSH into production server
ssh user@production-server

# 3. Navigate to project directory
cd /home/legistify/onlyoffice-plugins

# 4. Run deployment script
./deploy.sh

# 5. Verify deployment
curl https://plugins.legistify.com/plugins/ai-contract/config.json
```

---

## 🔐 Permission Management

### Overview

Permissions are managed at the **backend level** through:
1. JWT token validation
2. User role/organization checks
3. Feature-specific permission flags
4. Contract access validation

### Permission Levels

#### 1. Plugin Access (Show/Hide Entire Plugin)

Control whether user can see the plugin at all.

**Backend Configuration:**

In `onlyOfficeService.js`, add permission check:

```javascript
// Check if user has access to AI features
const orgUser = await orgUserModel.findOne({ _id: userId })
    .populate('organizationId');

// Check organization settings for AI features
const orgSettings = await orgSettingModel.findOne({ 
    organizationId: organizationId 
});

// Check if AI features are enabled for organization
if (!orgSettings?.aiFeaturesEnabled || !orgUser?.organizationId?.aiChatEnabled) {
    // Don't include plugin in autostart
    return {
        // ... config without plugin
    };
}

// Include plugin only if user has access
editorConfig: {
    plugins: {
        autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
        // ... rest of config
    }
}
```

#### 2. Feature-Level Permissions

Control which features a user can access within the plugin.

**Backend Permission Check Middleware:**

Create `contract-backend/src/app/middlewares/featurePermission.js`:

```javascript
const orgSettingModel = require('../models/orgSettingModel');
const orgUserModel = require('../models/orgUserModel');

/**
 * Middleware to check feature-level permissions
 * Usage: router.get('/endpoint', featurePermission('summary'), handler)
 */
module.exports = function(featureName) {
    return async function(req, res, next) {
        try {
            const userId = req.user?.id;
            const organizationId = req.user?.organizationId;
            
            if (!userId || !organizationId) {
                return res.status(401).json({ 
                    status: false, 
                    msg: 'Unauthorized' 
                });
            }

            // Get user details
            const user = await orgUserModel.findOne({ _id: userId })
                .populate('organizationId');

            // Get organization settings
            const orgSettings = await orgSettingModel.findOne({ 
                organizationId: organizationId 
            });

            // Define feature permissions mapping
            const featurePermissions = {
                'summary': {
                    roles: ['admin', 'contractManager', 'reviewer'],
                    setting: 'aiSummaryEnabled',
                    requiredPlan: 'premium'
                },
                'clauses': {
                    roles: ['admin', 'contractManager', 'reviewer', 'viewer'],
                    setting: 'aiClausesEnabled',
                    requiredPlan: 'premium'
                },
                'obligations': {
                    roles: ['admin', 'contractManager'],
                    setting: 'aiObligationsEnabled',
                    requiredPlan: 'premium'
                },
                'playbook': {
                    roles: ['admin', 'contractManager'],
                    setting: 'aiPlaybookEnabled',
                    requiredPlan: 'enterprise'
                },
                'chat': {
                    roles: ['admin', 'contractManager', 'reviewer'],
                    setting: 'aiChatEnabled',
                    requiredPlan: 'basic'
                },
                'approval': {
                    roles: ['admin', 'contractManager'],
                    setting: 'clauseApprovalEnabled',
                    requiredPlan: 'premium'
                },
                'library': {
                    roles: ['admin', 'contractManager', 'reviewer'],
                    setting: 'clauseLibraryEnabled',
                    requiredPlan: 'premium'
                }
            };

            const permission = featurePermissions[featureName];
            
            if (!permission) {
                return res.status(400).json({ 
                    status: false, 
                    msg: 'Invalid feature' 
                });
            }

            // Check role
            const userRole = user.typeOfUser;
            if (!permission.roles.includes(userRole)) {
                return res.status(403).json({ 
                    status: false, 
                    msg: `Access denied. ${featureName} requires one of: ${permission.roles.join(', ')}` 
                });
            }

            // Check organization setting
            if (orgSettings && !orgSettings[permission.setting]) {
                return res.status(403).json({ 
                    status: false, 
                    msg: `${featureName} is not enabled for your organization` 
                });
            }

            // Check subscription plan (if applicable)
            const orgPlan = user.organizationId?.subscriptionPlan;
            if (permission.requiredPlan && orgPlan !== permission.requiredPlan) {
                // Check if plan allows feature
                const planFeatures = {
                    'basic': ['chat'],
                    'premium': ['summary', 'clauses', 'obligations', 'approval', 'library'],
                    'enterprise': ['summary', 'clauses', 'obligations', 'playbook', 'approval', 'library']
                };
                
                if (!planFeatures[orgPlan]?.includes(featureName)) {
                    return res.status(403).json({ 
                        status: false, 
                        msg: `${featureName} requires ${permission.requiredPlan} plan` 
                    });
                }
            }

            // Permission granted
            req.featurePermission = {
                feature: featureName,
                userRole: userRole,
                allowed: true
            };

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ 
                status: false, 
                msg: 'Permission check failed' 
            });
        }
    };
};
```

#### 3. Apply Permissions to Routes

In your route files, wrap endpoints with permission middleware:

```javascript
// Example: aiAssistantRoutes.js
const express = require('express');
const router = express.Router();
const featurePermission = require('../middlewares/featurePermission');
const aiAssistantController = require('../controllers/aiAssistantController');

// Summary endpoint - requires 'summary' permission
router.get(
    '/onlyoffice/generate-summary',
    userAuth,  // Authenticate user first
    featurePermission('summary'),  // Check feature permission
    aiAssistantController.generateSummary
);

// Clauses endpoint - requires 'clauses' permission
router.get(
    '/onlyoffice/generate-AiClause',
    userAuth,
    featurePermission('clauses'),
    aiAssistantController.generateClauses
);

// Obligations endpoint - requires 'obligations' permission
router.get(
    '/generate-obligation',
    userAuth,
    featurePermission('obligations'),
    aiAssistantController.generateObligations
);

// Playbook endpoint - requires 'playbook' permission
router.get(
    '/run-playbook',
    userAuth,
    featurePermission('playbook'),
    aiAssistantController.runPlaybook
);

// Chat endpoint - requires 'chat' permission
router.post(
    '/ask-question',
    userAuth,
    featurePermission('chat'),
    aiAssistantController.askQuestion
);
```

#### 4. Plugin-Side Permission Handling

The plugin should hide/disable features based on permissions.

**Update Plugin to Check Permissions:**

In `scripts/main.js`, add permission checking:

```javascript
window.Asc.plugin.init = function() {
    // ... existing initialization ...
    
    // Get permissions from initData
    const initData = window.Asc.plugin.info.initData;
    if (initData) {
        try {
            const data = typeof initData === 'string' ? JSON.parse(initData) : initData;
            window.pluginData = {
                // ... existing data ...
                permissions: data.permissions || {}  // Add permissions object
            };
            
            // Hide/disable features based on permissions
            applyPermissions(data.permissions);
        } catch (e) {
            console.error('Error parsing plugin init data:', e);
        }
    }
};

function applyPermissions(permissions) {
    // Hide tabs/buttons for features user doesn't have access to
    const featureMap = {
        'summary': { tab: 'summary-tab', button: 'summary-btn' },
        'clauses': { tab: 'clauses-tab', button: 'clauses-btn' },
        'obligations': { tab: 'obligations-tab', button: 'obligations-btn' },
        'playbook': { tab: 'playbook-tab', button: 'playbook-btn' },
        'chat': { tab: 'ask-ai-tab', button: 'ask-ai-btn' },
        'approval': { tab: 'approval-tab', button: 'approval-btn' },
        'library': { tab: 'library-tab', button: 'library-btn' }
    };
    
    Object.keys(featureMap).forEach(feature => {
        if (!permissions[feature]) {
            const { tab, button } = featureMap[feature];
            
            // Hide tab button
            const tabBtn = document.querySelector(`[data-tab="${feature}"]`);
            if (tabBtn) {
                tabBtn.style.display = 'none';
            }
            
            // Hide tab content
            const tabContent = document.getElementById(`${feature}-tab`);
            if (tabContent) {
                tabContent.style.display = 'none';
            }
        }
    });
}
```

**Backend: Include Permissions in initData:**

Update `onlyOfficeService.js`:

```javascript
// Fetch user permissions
const user = await orgUserModel.findOne({ _id: userId })
    .populate('organizationId');

const orgSettings = await orgSettingModel.findOne({ 
    organizationId: organizationId 
});

// Determine available features
const permissions = {
    summary: ['admin', 'contractManager', 'reviewer'].includes(user.typeOfUser) 
        && orgSettings?.aiSummaryEnabled,
    clauses: ['admin', 'contractManager', 'reviewer', 'viewer'].includes(user.typeOfUser) 
        && orgSettings?.aiClausesEnabled,
    obligations: ['admin', 'contractManager'].includes(user.typeOfUser) 
        && orgSettings?.aiObligationsEnabled,
    playbook: ['admin', 'contractManager'].includes(user.typeOfUser) 
        && orgSettings?.aiPlaybookEnabled,
    chat: ['admin', 'contractManager', 'reviewer'].includes(user.typeOfUser) 
        && orgSettings?.aiChatEnabled,
    approval: ['admin', 'contractManager'].includes(user.typeOfUser) 
        && orgSettings?.clauseApprovalEnabled,
    library: ['admin', 'contractManager', 'reviewer'].includes(user.typeOfUser) 
        && orgSettings?.clauseLibraryEnabled
};

// Include permissions in initData
editorConfig: {
    plugins: {
        pluginsData: [{
            url: process.env.ONLYOFFICE_PLUGIN_URL,
            initData: JSON.stringify({
                contractId: contractId,
                accessToken: accessToken,
                userId: userId,
                organizationId: organizationId,
                backendUrl: process.env.BACKEND_BASE_URL + '/api',
                permissions: permissions  // Add permissions
            })
        }]
    }
}
```

---

## ⚙️ Backend Configuration

### Update onlyOfficeService.js

Full example with permissions:

```javascript
const orgUserModel = require('../models/orgUserModel');
const orgSettingModel = require('../models/orgSettingModel');

exports.getOnlyOfficeConfig = async function(req) {
    try {
        const contractId = req.params.contractId;
        const userId = req.user.id;
        const organizationId = req.user.organizationId;
        
        // Get user and organization settings
        const user = await orgUserModel.findOne({ _id: userId })
            .populate('organizationId');
            
        const orgSettings = await orgSettingModel.findOne({ 
            organizationId: organizationId 
        });
        
        // Determine permissions
        const permissions = {
            summary: ['admin', 'contractManager', 'reviewer'].includes(user.typeOfUser) 
                && orgSettings?.aiSummaryEnabled,
            clauses: ['admin', 'contractManager', 'reviewer', 'viewer'].includes(user.typeOfUser) 
                && orgSettings?.aiClausesEnabled,
            obligations: ['admin', 'contractManager'].includes(user.typeOfUser) 
                && orgSettings?.aiObligationsEnabled,
            playbook: ['admin', 'contractManager'].includes(user.typeOfUser) 
                && orgSettings?.aiPlaybookEnabled,
            chat: ['admin', 'contractManager', 'reviewer'].includes(user.typeOfUser) 
                && orgSettings?.aiChatEnabled,
            approval: ['admin', 'contractManager'].includes(user.typeOfUser) 
                && orgSettings?.clauseApprovalEnabled,
            library: ['admin', 'contractManager', 'reviewer'].includes(user.typeOfUser) 
                && orgSettings?.clauseLibraryEnabled
        };
        
        // Only include plugin if user has at least one permission
        const hasAnyPermission = Object.values(permissions).some(p => p === true);
        
        const editorConfig = {
            // ... other config ...
            plugins: hasAnyPermission ? {
                autostart: ['asc.{9DC93CDB-B576-4F0C-B55E-FCC9C48DD007}'],
                pluginsData: [{
                    url: process.env.ONLYOFFICE_PLUGIN_URL || 
                         'https://plugins.legistify.com/plugins/ai-contract/config.json',
                    initData: JSON.stringify({
                        contractId: contractId,
                        accessToken: req.headers['x-auth-token'],
                        userId: userId,
                        organizationId: organizationId,
                        backendUrl: process.env.BACKEND_BASE_URL + '/api',
                        permissions: permissions
                    })
                }]
            } : {}
        };
        
        return editorConfig;
    } catch (error) {
        return globalErrorHandler(error);
    }
};
```

---

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Check plugin accessibility
curl https://plugins.legistify.com/plugins/ai-contract/config.json

# Check Docker container
docker ps | grep onlyoffice-plugin-server

# Check Nginx status
systemctl status nginx
```

### Logs

```bash
# Docker logs
docker-compose logs -f onlyoffice-plugin-server

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Troubleshooting

See **TROUBLESHOOTING.md** for common issues and solutions.

---

## 📚 Next Steps

1. Review **PLUGIN_OVERVIEW.md** for architecture details
2. Check **QUICK_START.md** for initial setup
3. Test permissions with different user roles
4. Monitor production deployment

---

**Last Updated:** 2024
