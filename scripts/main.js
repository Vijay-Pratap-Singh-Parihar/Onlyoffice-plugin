// Main Plugin Entry Point
(function(window, undefined) {
    'use strict';

    // Store plugin data (contractId, accessToken, etc.) with default values
    window.pluginData = {
        contractId: '6970839dcf5e285074cf9bfb',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTYwZDJkZThhNmExYTE3YjBjMzdiZSIsImZ1bGxOYW1lIjoiVmlqYXkgUHJhdGFwIiwiZW1haWwiOiJ2aWpheS5wcmF0YXBAbGVnaXN0aWZ5LmNvbSIsIm9yZ2FuaXphdGlvbklkIjoiNjJhMWEwMWNhYzAwNTk4ODNkYjQwODkxIiwib3JnYW5pemF0aW9uTmFtZSI6IkxvYWQgVGVzdGluZyBPcmciLCJ0eXBlT2ZVc2VyIjoiYWRtaW4iLCJ0eXBlIjoib3JnVXNlciIsImNrRWRpdG9yRW5hYmxlZEZvck9yZ2FuaXphdGlvbiI6dHJ1ZSwiY2tFZGl0b3JFbmFibGVkRm9yVXNlciI6dHJ1ZSwiaXNDa0VkaXRvck1hbmFnZXIiOnRydWUsImVTaWduaW5nRW5hYmxlZCI6dHJ1ZSwicXVldWVSZXF1ZXN0RW5hYmxlZCI6dHJ1ZSwiYWlDaGF0RW5hYmxlZCI6dHJ1ZSwiYWlDaGF0RW5hYmxlZEZvck9yZ2FuaXphdGlvbiI6dHJ1ZSwiZVNpZ25TZXJ2aWNlIjoibGVlZ2FsaXR5IiwiZVNpZ25PcHRpb25zRW5hYmxlZCI6W10sInN0b3JhZ2VJZCI6IkFXUy00YjVmNzVjZi05ODY2LTRhYjMtODEwMy01MDAzMTI5NTMyZDgiLCJpc1Bob25lTnVtYmVyTWFuZGF0b3J5Ijp0cnVlLCJlbmFibGVTZXRUdXJuIjp0cnVlLCJlbmFibGVTd2l0Y2hXb3Jrc3BhY2UiOnRydWUsImlhdCI6MTc2OTA2NDIxOCwiZXhwIjoxNzY5MTUwNjE4fQ.eW5UKdjToUvB4_cK-iUDJod91CB4RXa4oFyn9k4rHw4',
        userId: '68e60d2de8a6a1a17b0c37be',
        organizationId: '62a1a01cac0059883db40891',
        backendUrl: 'https://contract-frontend-dev.legistrak.com/api',
        permissions: {}
    };

    // Store original init function
    const originalPluginInit = window.Asc && window.Asc.plugin && window.Asc.plugin.init;
    
    // Plugin initialization - called when OnlyOffice loads the plugin
    window.Asc.plugin.init = function() {
        console.log('AI Contract Assistant Plugin initialized');
        
        // Get plugin initialization data (passed from backend)
        const initData = window.Asc.plugin.info.initData;
        if (initData) {
            try {
                const data = typeof initData === 'string' ? JSON.parse(initData) : initData;
                // Merge initData with defaults (initData takes precedence)
                window.pluginData = {
                    contractId: data.contractId || window.pluginData.contractId,
                    accessToken: data.accessToken || window.pluginData.accessToken,
                    userId: data.userId || window.pluginData.userId,
                    organizationId: data.organizationId || window.pluginData.organizationId,
                    backendUrl: data.backendUrl || window.pluginData.backendUrl,
                    permissions: data.permissions || window.pluginData.permissions
                };
                
                // Apply permissions to hide/show features
                applyPermissions(window.pluginData.permissions || {});
            } catch (e) {
                console.error('Error parsing plugin init data:', e);
                // Keep default values if parsing fails
            }
        } else {
            // No initData provided, use defaults and apply permissions
            applyPermissions(window.pluginData.permissions || {});
        }
        
        // Log plugin data for debugging
        console.log('Plugin data initialized:', {
            contractId: window.pluginData.contractId ? 'Set' : 'Missing',
            accessToken: window.pluginData.accessToken ? 'Set' : 'Missing',
            userId: window.pluginData.userId ? 'Set' : 'Missing',
            organizationId: window.pluginData.organizationId ? 'Set' : 'Missing',
            backendUrl: window.pluginData.backendUrl
        });
        
        // Initialize card-based navigation
        initCardNavigation();
        
        // Initialize OnlyOffice API connection
        initOnlyOfficeAPI();
        
        // Initialize resize handle
        initResizeHandle();
        
        // Set up close button event listeners (for custom close button)
        setupCloseButtonListeners();
        
        // Open plugin panel on left side
        openPluginPanel();
    };
    
    // Set up close button event listeners
    function setupCloseButtonListeners() {
        // Listen for clicks on the custom close button
        document.addEventListener('click', function(e) {
            if (e.target.closest('.panel-close-button')) {
                e.preventDefault();
                e.stopPropagation();
                closePluginPanel();
            }
        });
        
        // Also handle OnlyOffice's built-in close button if it exists
        // OnlyOffice's close button might be in a different DOM location
        setTimeout(function() {
            // Try to find OnlyOffice's close button and attach listener
            const onlyOfficeCloseBtn = document.querySelector('.asc-window-close, .plugin-close, [aria-label*="close" i], [title*="close" i]');
            if (onlyOfficeCloseBtn) {
                onlyOfficeCloseBtn.addEventListener('click', function(e) {
                    console.log('OnlyOffice close button clicked');
                    // OnlyOffice should handle this automatically, but we can ensure our handler is called
                    if (window.Asc && window.Asc.plugin && window.Asc.plugin.onClose) {
                        window.Asc.plugin.onClose();
                    }
                });
            }
        }, 500);
    }
    
    // Open plugin panel on the left side
    function openPluginPanel() {
        try {
            // Try to show plugin panel using OnlyOffice API
            if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeMethod) {
                // Show the plugin panel - OnlyOffice will position it based on config
                window.Asc.plugin.executeMethod("ShowPluginPanel", [], function() {
                    console.log('Plugin panel opened');
                }, function(error) {
                    console.warn('ShowPluginPanel not available:', error);
                });
            }
        } catch (error) {
            console.warn('Error opening plugin panel:', error);
        }
    }

    // Apply permissions to hide/show features
    function applyPermissions(permissions) {
        // Feature map: feature name -> { view selector, card selector }
        const featureMap = {
            'summary': { view: 'summary-view', card: 'summary', cardText: 'Summarise Your Draft' },
            'clauses': { view: 'clauses-view', card: 'clauses', cardText: 'Extract Key Clauses' },
            'obligations': { view: 'obligations-view', card: 'obligations', cardText: 'Identify Main Obligations' },
            'playbook': { view: 'playbook-view', card: 'playbook', cardText: 'Run AI Playbook Review' },
            'chat': { view: 'ask-ai-view', card: 'ask-ai', cardText: 'Chat With Your Draft' },
            'approval': { view: 'approval-view', card: 'approval', cardText: 'Approval' },
            'library': { view: 'library-view', card: 'library', cardText: 'Library' }
        };
        
        Object.keys(featureMap).forEach(feature => {
            // Check if feature is allowed (default to true if not specified)
            const isAllowed = permissions[feature] !== false; // Allow if undefined or true
            
            if (!isAllowed) {
                const { view, card } = featureMap[feature];
                
                // Hide feature card in landing view
                const featureCard = document.querySelector(`[data-feature="${card}"]`);
                if (featureCard) {
                    featureCard.style.display = 'none';
                }
                
                // Hide feature view
                const featureView = document.getElementById(view);
                if (featureView) {
                    featureView.style.display = 'none';
                }
                
                // Note: Toolbar buttons are controlled by OnlyOffice based on config.json
                // If you need to hide toolbar buttons dynamically, you would need to use
                // OnlyOffice API methods, but typically permissions are handled at config level
            }
        });
    }

    // Handle button clicks from OnlyOffice toolbar
    window.Asc.plugin.button = function(id) {
        // This function is called when user clicks a plugin button
        // Map button IDs to feature names (button IDs are based on button text in lowercase with spaces removed)
        const buttonMap = {
            'askai': 'ask-ai',
            'ask-ai': 'ask-ai',
            'summary': 'summary',
            'clauses': 'clauses',
            'obligations': 'obligations',
            'aiplaybook': 'playbook',
            'playbook': 'playbook',
            'library': 'library',
            'approval': 'approval'
        };

        // Normalize button ID (remove spaces, convert to lowercase)
        const normalizedId = id.toLowerCase().replace(/\s+/g, '');
        const featureName = buttonMap[normalizedId] || buttonMap[id];
        
        if (featureName) {
            // Ensure plugin panel is visible
            if (window.Asc.plugin && window.Asc.plugin.executeMethod) {
                // Open plugin panel if not already open
                window.Asc.plugin.executeMethod("ShowPluginPanel", [], function() {
                    // Panel opened, show feature view
                    setTimeout(() => showFeatureView(featureName), 100);
                }, function() {
                    // If panel already open, just show feature view
                    showFeatureView(featureName);
                });
            } else {
                // Fallback: just show feature view
                showFeatureView(featureName);
            }
        } else {
            console.warn('Unknown button ID:', id);
        }
    };

    // Initialize card-based navigation
    function initCardNavigation() {
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', function() {
                const feature = this.getAttribute('data-feature');
                if (feature) {
                    showFeatureView(feature);
                }
            });
        });
    }

    // Show landing view with card buttons
    window.showLandingView = function() {
        const landingView = document.getElementById('main-landing-view');
        const featureViews = document.getElementById('feature-views');
        
        if (landingView) {
            landingView.style.display = 'flex';
        }
        if (featureViews) {
            featureViews.style.display = 'none';
        }
    };

    // Show specific feature view
    function showFeatureView(featureName) {
        const landingView = document.getElementById('main-landing-view');
        const featureViews = document.getElementById('feature-views');
        const featureView = document.getElementById(featureName + '-view');
        
        // Hide landing view
        if (landingView) {
            landingView.style.display = 'none';
        }
        
        // Show feature views container
        if (featureViews) {
            featureViews.style.display = 'flex';
        }
        
        // Hide all feature views
        document.querySelectorAll('.feature-view').forEach(view => {
            view.style.display = 'none';
        });
        
        // Show selected feature view
        if (featureView) {
            featureView.style.display = 'flex';
        }
    }

    // Legacy function for button handler compatibility
    function switchTab(tabName) {
        // Map old tab names to new feature names
        const featureMap = {
            'ask-ai': 'ask-ai',
            'summary': 'summary',
            'clauses': 'clauses',
            'obligations': 'obligations',
            'playbook': 'playbook',
            'library': 'library',
            'approval': 'approval'
        };
        
        const featureName = featureMap[tabName] || tabName;
        showFeatureView(featureName);
    }

    // Initialize OnlyOffice API helpers
    function initOnlyOfficeAPI() {
        // Get document content as plain text using OnlyOffice plugin API
        // Note: OnlyOffice plugins can access document content through the editor API
        window.getDocumentContent = function() {
            return new Promise((resolve, reject) => {
                try {
                    // Try to get document content using OnlyOffice API
                    // The actual method depends on OnlyOffice version and API availability
                    if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeMethod) {
                        // Use executeMethod to get document content
                        // Note: This is a placeholder - actual implementation depends on OnlyOffice API version
                        window.Asc.plugin.executeMethod("GetDocumentContent", [], function(data) {
                            if (data && data.content) {
                                // Extract plain text from HTML content if needed
                                const text = typeof data.content === 'string' 
                                    ? data.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
                                    : JSON.stringify(data.content);
                                resolve(text);
                            } else {
                                resolve('');
                            }
                        }, function(error) {
                            console.warn('GetDocumentContent not available, using fallback:', error);
                            // Fallback: return empty string if method not available
                            resolve('');
                        });
                    } else {
                        console.warn('OnlyOffice plugin API not available');
                        resolve('');
                    }
                } catch (error) {
                    console.error('Error getting document content:', error);
                    resolve('');
                }
            });
        };

        // Get selected text using OnlyOffice plugin API
        window.getSelectedText = function() {
            return new Promise((resolve, reject) => {
                try {
                    if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeMethod) {
                        window.Asc.plugin.executeMethod("GetSelectedText", [], function(data) {
                            if (data && data.text) {
                                resolve(data.text);
                            } else {
                                resolve('');
                            }
                        }, function(error) {
                            console.warn('GetSelectedText not available:', error);
                            resolve('');
                        });
                    } else {
                        resolve('');
                    }
                } catch (error) {
                    console.error('Error getting selected text:', error);
                    resolve('');
                }
            });
        };

        // Get document text - alias for getDocumentContent
        window.getDocumentText = window.getDocumentContent;
    }

    // Plugin execution complete callback
    window.Asc.plugin.executeCommand = function(command, data) {
        // Handle commands from OnlyOffice
        console.log('Command received:', command, data);
    };

    // Handle plugin panel close event - OnlyOffice calls this when close button is clicked
    window.Asc.plugin.onClose = function() {
        console.log('Plugin panel close event triggered by OnlyOffice');
        // OnlyOffice will handle the actual closing automatically
        // We can do cleanup here if needed
    };

    // Function to close/hide the plugin panel programmatically
    window.closePluginPanel = function() {
        console.log('closePluginPanel called');
        try {
            if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeMethod) {
                // Method 1: Try HidePluginPanel (most direct method)
                window.Asc.plugin.executeMethod("HidePluginPanel", [], function() {
                    console.log('Plugin panel closed via HidePluginPanel');
                }, function(error) {
                    console.warn('HidePluginPanel not available, trying alternative methods:', error);
                    
                    // Method 2: Try to trigger the close event manually
                    try {
                        if (window.Asc && window.Asc.plugin && window.Asc.plugin.onClose) {
                            console.log('Calling onClose handler');
                            window.Asc.plugin.onClose();
                        }
                    } catch (e) {
                        console.warn('Error calling onClose:', e);
                    }
                    
                    // Method 3: Try using resizeWindow to minimize (set width to 0)
                    try {
                        window.Asc.plugin.executeMethod("resizeWindow", [0, 0], function() {
                            console.log('Plugin panel hidden via resizeWindow');
                        }, function(err) {
                            console.warn('resizeWindow also failed:', err);
                        });
                    } catch (e) {
                        console.warn('Error with resizeWindow fallback:', e);
                    }
                });
            } else {
                console.warn('OnlyOffice plugin API not available');
            }
        } catch (error) {
            console.error('Error closing plugin panel:', error);
        }
    };

    // Helper function to get plugin data
    window.getPluginData = function() {
        // Ensure pluginData exists, if not initialize with defaults
        if (!window.pluginData || Object.keys(window.pluginData).length === 0) {
            window.pluginData = {
                contractId: '6970839dcf5e285074cf9bfb',
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTYwZDJkZThhNmExYTE3YjBjMzdiZSIsImZ1bGxOYW1lIjoiVmlqYXkgUHJhdGFwIiwiZW1haWwiOiJ2aWpheS5wcmF0YXBAbGVnaXN0aWZ5LmNvbSIsIm9yZ2FuaXphdGlvbklkIjoiNjJhMWEwMWNhYzAwNTk4ODNkYjQwODkxIiwib3JnYW5pemF0aW9uTmFtZSI6IkxvYWQgVGVzdGluZyBPcmciLCJ0eXBlT2ZVc2VyIjoiYWRtaW4iLCJ0eXBlIjoib3JnVXNlciIsImNrRWRpdG9yRW5hYmxlZEZvck9yZ2FuaXphdGlvbiI6dHJ1ZSwiY2tFZGl0b3JFbmFibGVkRm9yVXNlciI6dHJ1ZSwiaXNDa0VkaXRvck1hbmFnZXIiOnRydWUsImVTaWduaW5nRW5hYmxlZCI6dHJ1ZSwicXVldWVSZXF1ZXN0RW5hYmxlZCI6dHJ1ZSwiYWlDaGF0RW5hYmxlZCI6dHJ1ZSwiYWlDaGF0RW5hYmxlZEZvck9yZ2FuaXphdGlvbiI6dHJ1ZSwiZVNpZ25TZXJ2aWNlIjoibGVlZ2FsaXR5IiwiZVNpZ25PcHRpb25zRW5hYmxlZCI6W10sInN0b3JhZ2VJZCI6IkFXUy00YjVmNzVjZi05ODY2LTRhYjMtODEwMy01MDAzMTI5NTMyZDgiLCJpc1Bob25lTnVtYmVyTWFuZGF0b3J5Ijp0cnVlLCJlbmFibGVTZXRUdXJuIjp0cnVlLCJlbmFibGVTd2l0Y2hXb3Jrc3BhY2UiOnRydWUsImlhdCI6MTc2OTA2NDIxOCwiZXhwIjoxNzY5MTUwNjE4fQ.eW5UKdjToUvB4_cK-iUDJod91CB4RXa4oFyn9k4rHw4',
                userId: '68e60d2de8a6a1a17b0c37be',
                organizationId: '62a1a01cac0059883db40891',
                backendUrl: 'https://contract-frontend-dev.legistrak.com/api',
                permissions: {}
            };
        }
        return window.pluginData;
    };

    // Helper function to get backend URL
    window.getBackendUrl = function() {
        const url = window.pluginData?.backendUrl || 'https://contract-frontend-dev.legistrak.com/api';
        
        // #region agent log
        console.log('[DEBUG] getBackendUrl entry:', {rawUrl:url,pluginDataBackendUrl:window.pluginData?.backendUrl});
        fetch('http://127.0.0.1:7242/ingest/be32d8b0-12c9-4dbe-a212-01f2fe6cfcc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:323',message:'getBackendUrl entry',data:{rawUrl:url,pluginDataBackendUrl:window.pluginData?.backendUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Normalize URL: remove trailing slashes
        let normalized = url.trim().replace(/\/+$/, '');
        
        // #region agent log
        console.log('[DEBUG] URL after trim:', {normalized:normalized,endsWithApi:normalized.endsWith('/api'),includesApi:normalized.includes('/api/')});
        fetch('http://127.0.0.1:7242/ingest/be32d8b0-12c9-4dbe-a212-01f2fe6cfcc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:328',message:'URL after trim',data:{normalized:normalized,endsWithApi:normalized.endsWith('/api'),includesApi:normalized.includes('/api/')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // If URL doesn't end with /api, add it (unless it's already a full API URL)
        // FIX: Don't add /api if URL already contains /api (either at end or in path)
        if (!normalized.endsWith('/api') && !normalized.includes('/api')) {
            normalized = normalized + '/api';
            
            // #region agent log
            console.log('[DEBUG] Added /api suffix:', {normalized:normalized});
            fetch('http://127.0.0.1:7242/ingest/be32d8b0-12c9-4dbe-a212-01f2fe6cfcc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:333',message:'Added /api suffix',data:{normalized:normalized},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
        }
        
        // Remove any double slashes except after protocol
        normalized = normalized.replace(/([^:]\/)\/+/g, '$1');
        
        // #region agent log
        console.log('[DEBUG] getBackendUrl exit:', {finalUrl:normalized,originalUrl:url});
        fetch('http://127.0.0.1:7242/ingest/be32d8b0-12c9-4dbe-a212-01f2fe6cfcc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:339',message:'getBackendUrl exit',data:{finalUrl:normalized,originalUrl:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        console.log('Backend URL:', normalized);
        return normalized;
    };
    
    // Helper function to get frontend origin for CORS - matches the origin that backend expects
    window.getFrontendOrigin = function() {
        const backendUrl = window.getBackendUrl();
        let frontendOrigin = 'https://contract-frontend-dev.legistrak.com';
        
        try {
            const backendUrlObj = new URL(backendUrl);
            // Derive frontend origin from backend URL
            if (backendUrlObj.hostname.includes('contract-backend-dev.legistrak.com')) {
                frontendOrigin = 'https://contract-frontend-dev.legistrak.com';
            } else if (backendUrlObj.hostname.includes('contract-backend')) {
                frontendOrigin = backendUrlObj.origin.replace('contract-backend', 'contract-frontend');
            } else if (backendUrlObj.hostname.includes('localhost')) {
                frontendOrigin = 'http://localhost:3000';
            }
        } catch (e) {
            console.warn('Could not derive frontend origin from backend URL, using default:', frontendOrigin);
        }
        
        return frontendOrigin;
    };

    // Helper function to get access token
    window.getAccessToken = function() {
        return window.pluginData?.accessToken || '';
    };

    // Helper function to get contract ID
    window.getContractId = function() {
        return window.pluginData?.contractId || '';
    };

    // Initialize resize handle for panel resizing
    function initResizeHandle() {
        const resizeHandle = document.getElementById('resize-handle');
        if (!resizeHandle) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            resizeHandle.classList.add('resizing');
            startX = e.clientX;
            
            // Get current panel width from parent iframe or use default
            const iframe = window.frameElement;
            if (iframe) {
                startWidth = iframe.offsetWidth;
            } else {
                startWidth = window.innerWidth;
            }

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            e.preventDefault();
            e.stopPropagation();
        });

        function handleMouseMove(e) {
            if (!isResizing) return;

            const diff = startX - e.clientX; // For left panel, dragging right increases width
            const newWidth = Math.max(250, Math.min(800, startWidth + diff)); // Min 250px, Max 800px

            // Try to resize using OnlyOffice API if available
            if (window.Asc && window.Asc.plugin && window.Asc.plugin.executeMethod) {
                try {
                    // OnlyOffice may have a method to resize plugin panel
                    // This is a placeholder - actual API may vary
                    window.Asc.plugin.executeMethod('SetPluginPanelWidth', [newWidth], function() {
                        console.log('Panel width set to:', newWidth);
                    }, function(error) {
                        console.warn('SetPluginPanelWidth not available, using CSS fallback:', error);
                        // Fallback: try to resize via CSS
                        resizeViaCSS(newWidth);
                    });
                } catch (error) {
                    console.warn('Error calling OnlyOffice resize API:', error);
                    resizeViaCSS(newWidth);
                }
            } else {
                // Fallback: resize via CSS
                resizeViaCSS(newWidth);
            }
        }

        function resizeViaCSS(newWidth) {
            // Try to resize the iframe or container
            const iframe = window.frameElement;
            if (iframe) {
                iframe.style.width = newWidth + 'px';
            }
            
            // Also try to set on body/document
            document.body.style.minWidth = newWidth + 'px';
            document.body.style.width = newWidth + 'px';
        }

        function handleMouseUp() {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('resizing');
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        }

        // Prevent text selection while resizing
        resizeHandle.addEventListener('selectstart', function(e) {
            e.preventDefault();
        });
    }

})(window);
