// Clauses Feature Module - Matches MS Editor Implementation
(function(window) {
    'use strict';

    // State management
    let clausesData = null;
    let savedClause = '';
    let responseChunks = [];
    let isStreaming = false;
    let initialLoading = true;
    let regenerateLoader = false;
    let abortControllerRef = null;
    let readerRef = null;
    let progressLoaderInstance = null;
    let responseContainerRef = null;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClauses);
    } else {
        initClauses();
    }

    function initClauses() {
        const extractBtn = document.getElementById('extract-clauses-btn');
        if (extractBtn) {
            extractBtn.addEventListener('click', () => extractClauses());
        }
        
        responseContainerRef = document.getElementById('clauses-result');
        
        // Check for existing clauses
        checkExistingClauses();
    }

    function sanitizeResponse(raw) {
        if (!raw) return '';
        const cleaned = raw
            .replace('```html', '')
            .replace('```', '')
            .replace(/---END_OF_ASSISTANT_RESPONSE---[\s\S]*$/i, '')
            .replace(/\n?\{\s*"thread_last_event"[\s\S]*$/i, '');
        return cleaned.trim();
    }

    async function extractClauses(type) {
        // Cancel previous request if it exists
        if (abortControllerRef) {
            abortControllerRef.abort();
        }
        if (readerRef) {
            try {
                await readerRef.cancel();
            } catch (e) {
                // Ignore cancel errors
            }
        }

        // Create new AbortController for this request
        const abortController = new AbortController();
        abortControllerRef = abortController;

        const extractBtn = document.getElementById('extract-clauses-btn');
        const resultContainer = document.getElementById('clauses-result');
        const loadingContainer = document.getElementById('clauses-loading');
        const pluginData = window.getPluginData();

        if (!pluginData.contractId) {
            showToast('Contract ID not available');
            return;
        }

        // Immediately clear data and chunks when regenerate is clicked
        if (type === "reGenerate") {
            regenerateLoader = true;
            responseChunks = [];
            savedClause = '';
            clausesData = null;
            isStreaming = true;
        } else {
            responseChunks = [];
            savedClause = '';
            clausesData = null;
            isStreaming = true;
        }

        // Hide extract button container
        const generateContainer = document.getElementById('clauses-generate-container');
        if (generateContainer) {
            generateContainer.style.display = 'none';
        }
        
        // Clear result container and show progress loader
        if (resultContainer) {
            resultContainer.innerHTML = '';
            
            // Show progress loader
            if (window.createProgressLoader) {
                progressLoaderInstance = window.createProgressLoader(resultContainer, {
                    title: 'Extracting key clauses',
                    steps: [
                        'Reading document',
                        'Identifying clause patterns',
                        'Extracting clause details',
                        'Formatting results'
                    ],
                    stepDelay: 1000,
                    minDisplayTime: 3000
                });
            }
        }

        try {
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Access token not available');
            }

            // Construct URL with modelId - match frontend exactly
            const params = new URLSearchParams({
                contractId: pluginData.contractId,
                userId: pluginData.userId,
                organizationId: pluginData.organizationId,
                modelId: 'anthropic_claude_sonnet_3_5' // Default model
            });
            const url = `${backendUrl}/ai-assistant/onlyoffice/stream-generate-AiClause?${params.toString()}`;
            
            console.log('Fetching clauses from:', url);
            
            // Get frontend origin for CORS
            const frontendOrigin = window.getFrontendOrigin();
            
            let response;
            try {
                // Match frontend request headers exactly
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/json',
                        'origin': frontendOrigin,
                        'x-auth-token': accessToken || ''
                    },
                    signal: abortController.signal,
                    mode: 'cors',
                    credentials: 'omit'
                });
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    return; // User cancelled
                }
                console.error('Fetch error:', fetchError);
                throw new Error(`Network error: ${fetchError.message}. Please check your connection and CORS settings.`);
            }

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
            }

            if (!response.body) {
                throw new Error('Streaming is not supported in this environment.');
            }

            const reader = response.body.getReader();
            readerRef = reader;
            const decoder = new TextDecoder();
            const accumulatedChunks = [];

            while (true) {
                // Check if request was aborted
                if (abortController.signal.aborted) {
                    break;
                }

                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                accumulatedChunks.push(chunk);
                responseChunks = [...responseChunks, chunk];
                
                // Update UI with streaming chunks
                updateStreamingUI();
            }
            
            // Save accumulated chunks after streaming completes
            if (!abortController.signal.aborted && accumulatedChunks.length > 0) {
                const accumulated = accumulatedChunks.join('');
                if (accumulated.trim()) {
                    clausesData = accumulated;
                }
            }
        } catch (e) {
            // Ignore abort errors, but handle other errors
            if (e.name !== 'AbortError') {
                console.error('Clauses extraction error:', e);
                if (resultContainer) {
                    resultContainer.innerHTML = `<div class="error-message">Error: ${e.message || "Something went wrong!"}</div>`;
                }
                // Show extract button container again on error
                const generateContainer = document.getElementById('clauses-generate-container');
                if (generateContainer) {
                    generateContainer.style.display = 'flex';
                }
            }
        } finally {
            // Only clear refs if this is still the current request
            if (abortControllerRef === abortController) {
                abortControllerRef = null;
                readerRef = null;
            }
            regenerateLoader = false;
            isStreaming = false;
            
            // Hide progress loader
            if (progressLoaderInstance) {
                progressLoaderInstance.hide();
                progressLoaderInstance = null;
            }
            
            // Final UI update
            updateStreamingUI();
        }
    }

    function updateStreamingUI() {
        const resultContainer = document.getElementById('clauses-result');
        if (!resultContainer) return;

        // Hide progress loader if we have chunks
        if (responseChunks.length > 0 && progressLoaderInstance) {
            progressLoaderInstance.hide();
            progressLoaderInstance = null;
        }

        // Determine what to display
        const displayData = savedClause || (responseChunks.length > 0 ? responseChunks.join('') : clausesData);
        
        if (!displayData && (isStreaming || regenerateLoader)) {
            // Show progress loader if still loading and no data
            if (!progressLoaderInstance && window.createProgressLoader) {
                progressLoaderInstance = window.createProgressLoader(resultContainer, {
                    title: 'Extracting key clauses',
                    steps: [
                        'Reading document',
                        'Identifying clause patterns',
                        'Extracting clause details',
                        'Formatting results'
                    ],
                    stepDelay: 1000,
                    minDisplayTime: 3000
                });
            }
            return;
        }

        if (displayData) {
            // Format and display the data
            let processed = sanitizeResponse(displayData);
            
            // Apply formatting similar to MS Editor
            processed = processed.replace(/\*\*(\d+\.\s+[^*]+?)\*\*/g, '<strong>$1</strong>');
            processed = processed.replace(/<p>(\d+\.\s+[^:]+?):\s*([^<]+?)(?=<\/p>)/g, '<p><strong>$1:</strong><br>$2');
            processed = processed.replace(/(?:^|\n)(\d+\.\s+[^:\n<]+?):\s*([^\n<]+?)(?=\n\d+\.|$|\n\n)/g, '<p><strong>$1:</strong><br>$2</p>');
            processed = processed.replace(/(?:^|\n)(\d+\.\s+[A-Z][^.\n<]+?)(\s+[A-Za-z][^.\n<]+?)(?=\n\d+\.|$|\n\n)/g, (match, heading, description) => {
                return `<p><strong>${heading}</strong><br>${description}</p>`;
            });
            processed = processed.replace(/(?:^|\n)(\d+\.\s+[^\n<]+?)(?=\n\d+\.|$)/g, (match) => {
                return `<p>${match.trim()}</p>`;
            });
            processed = processed.replace(/<h([23])>([^<]+?)<\/h[23]>/g, '<h$1><strong>$2</strong></h$1>');
            processed = processed
                .replace(/<p><\/p>/g, '')
                .replace(/<p>\s*<\/p>/g, '')
                .replace(/\n\n+/g, '\n')
                .trim();

            resultContainer.innerHTML = `
                <div id="html_clauses_text" class="clauses-content">
                    ${processed}
                </div>
            `;
            
            // Show action buttons
            showClausesActions(resultContainer);
            
            // Auto-scroll to bottom during streaming
            if (isStreaming) {
                window.scrollToBottom(resultContainer, false);
            }
        }
    }

    async function checkExistingClauses() {
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        const resultContainer = document.getElementById('clauses-result');
        const extractBtn = document.getElementById('extract-clauses-btn');
        
        if (!pluginData.contractId || !accessToken || !resultContainer) {
            initialLoading = false;
            return;
        }
        
        try {
            initialLoading = true;
            const url = `${backendUrl}/ai-assistant/fetch-Summary-Clause?contractId=${pluginData.contractId}`;
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.clause) {
                    savedClause = data.clause;
                    clausesData = data.clause;
                    
                    // Update UI with saved clause
                    updateStreamingUI();
                    
                    // Hide extract button container
                    const generateContainer = document.getElementById('clauses-generate-container');
                    if (generateContainer) {
                        generateContainer.style.display = 'none';
                    }
                    
                    // Show action box
                    showClausesActions(resultContainer);
                }
            }
        } catch (error) {
            console.error('Error checking existing clauses:', error);
        } finally {
            initialLoading = false;
        }
    }

    function showClausesActions(container) {
        // Show action box in header (matches MS Editor)
        const actionBox = document.getElementById('clauses-action-box');
        if (actionBox) {
            actionBox.style.display = 'flex';
        }
        
        // Hide generate button container
        const generateContainer = document.getElementById('clauses-generate-container');
        if (generateContainer) {
            generateContainer.style.display = 'none';
        }
    }

    function copyClauses() {
        const displayData = savedClause || (responseChunks.length > 0 ? responseChunks.join('') : clausesData);
        if (displayData) {
            // Extract text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = displayData;
            const text = tempDiv.textContent || tempDiv.innerText || displayData;
            
            navigator.clipboard.writeText(text).then(() => {
                showToast('Clauses copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showToast('Failed to copy clauses');
            });
        }
    }

    function regenerateClauses() {
        extractClauses('reGenerate');
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Expose functions globally
    window.copyClauses = copyClauses;
    window.regenerateClauses = regenerateClauses;

})(window);
