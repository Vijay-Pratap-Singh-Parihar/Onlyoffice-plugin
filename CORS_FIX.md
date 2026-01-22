# CORS Configuration Fix for OnlyOffice Plugin

## Problem
The OnlyOffice plugin is getting "Failed to fetch" errors because the backend CORS configuration doesn't allow requests from the OnlyOffice plugin origin.

## Root Cause
OnlyOffice plugins run from a special origin (typically `asc-local://` or similar), which is different from your web application's origin. The backend's `ALLOWED_ORIGINS` environment variable must include this origin.

## Solution

### Step 1: Identify the OnlyOffice Plugin Origin

1. Open the OnlyOffice editor with the plugin loaded
2. Open browser DevTools (F12)
3. In the Console, run:
   ```javascript
   console.log('Plugin Origin:', window.location.origin);
   console.log('Plugin Location:', window.location.href);
   ```
4. Note the origin value (e.g., `asc-local://` or `file://`)

### Step 2: Update Backend CORS Configuration

Edit your backend's environment configuration file (`.env` or similar):

```bash
# Add the OnlyOffice plugin origin to ALLOWED_ORIGINS
ALLOWED_ORIGINS=["http://localhost:3000","https://yourdomain.com","asc-local://"]
```

**Important Notes:**
- OnlyOffice Desktop Editor typically uses `asc-local://` as the origin
- OnlyOffice Server Edition may use different origins
- You may need to add multiple origins if you support both Desktop and Server editions

### Step 3: Restart Backend Server

After updating the environment variable, restart your backend server:

```bash
# If using Node.js directly
npm restart

# If using Docker
docker-compose restart backend

# If using PM2
pm2 restart backend
```

### Step 4: Verify CORS Headers

Test that CORS is working by checking the response headers:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a request from the plugin
4. Check the response headers for:
   - `Access-Control-Allow-Origin: asc-local://` (or your plugin origin)
   - `Access-Control-Allow-Credentials: true` (if using credentials)

## Alternative: Development Workaround

For development only, you can temporarily allow all origins (NOT recommended for production):

```javascript
// In contract-backend/src/app/utils/credentialsAndCorsOptions.js
const corsOptions = {
    origin: '*', // Allow all origins (DEVELOPMENT ONLY)
    exposedHeaders: 'x-auth-token',
    optionsSuccessStatus: 200
};
```

## Testing

After applying the fix:

1. Reload the OnlyOffice plugin
2. Try generating a summary
3. Check browser console for any remaining CORS errors
4. Verify the request succeeds in the Network tab

## Common Origins

- **OnlyOffice Desktop Editor**: `asc-local://`
- **OnlyOffice Server (local)**: `http://localhost:8080`
- **OnlyOffice Server (remote)**: Your server's domain (e.g., `https://onlyoffice.yourdomain.com`)

## Still Having Issues?

If you're still getting CORS errors after adding the origin:

1. Check that the backend server restarted with the new configuration
2. Verify the origin string matches exactly (case-sensitive, no trailing slashes)
3. Check browser console for the exact origin being used
4. Ensure the backend's CORS middleware is properly configured
5. Check if there are any proxy or load balancer configurations that might interfere
