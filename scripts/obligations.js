// Obligations Feature Module - Matches MS Editor Implementation
(function(window) {
    'use strict';

    // State management
    let obligationsData = null;
    let savedObligation = '';
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
        document.addEventListener('DOMContentLoaded', initObligations);
    } else {
        initObligations();
    }

    function initObligations() {
        const generateBtn = document.getElementById('generate-obligations-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => generateObligations());
        }
        
        responseContainerRef = document.getElementById('obligations-result');
        
        // Check for existing obligations
        checkExistingObligations();
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

    async function generateObligations(type) {
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

        const generateBtn = document.getElementById('generate-obligations-btn');
        const resultContainer = document.getElementById('obligations-result');
        const loadingContainer = document.getElementById('obligations-loading');
        const pluginData = window.getPluginData();

        if (!pluginData.contractId) {
            showToast('Contract ID not available');
            return;
        }

        // Immediately clear data and chunks when regenerate is clicked
        if (type === "reGenerate") {
            regenerateLoader = true;
            responseChunks = [];
            savedObligation = '';
            obligationsData = null;
            isStreaming = true;
        } else {
            responseChunks = [];
            savedObligation = '';
            obligationsData = null;
            isStreaming = true;
        }

        // Hide generate button container
        const generateContainer = document.getElementById('obligations-generate-container');
        if (generateContainer) {
            generateContainer.style.display = 'none';
        }
        
        // Clear result container and show progress loader
        if (resultContainer) {
            resultContainer.innerHTML = '';
            
            // Show progress loader
            if (window.createProgressLoader) {
                progressLoaderInstance = window.createProgressLoader(resultContainer, {
                    title: 'Extracting obligations',
                    steps: [
                        'Reading document',
                        'Identifying obligations',
                        'Categorizing requirements',
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
            const url = `${backendUrl}/ai-assistant/onlyoffice/stream-generate-obligation?${params.toString()}`;
            
            console.log('Fetching obligations from:', url);
            
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
                    obligationsData = accumulated;
                }
            }
        } catch (e) {
            // Ignore abort errors, but handle other errors
            if (e.name !== 'AbortError') {
                console.error('Obligations generation error:', e);
                if (resultContainer) {
                    resultContainer.innerHTML = `<div class="error-message">Error: ${e.message || "Something went wrong!"}</div>`;
                }
                // Show generate button container again on error
                const generateContainer = document.getElementById('obligations-generate-container');
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
        const resultContainer = document.getElementById('obligations-result');
        if (!resultContainer) return;

        // Hide progress loader if we have chunks
        if (responseChunks.length > 0 && progressLoaderInstance) {
            progressLoaderInstance.hide();
            progressLoaderInstance = null;
        }

        // Determine what to display
        const displayData = savedObligation || (responseChunks.length > 0 ? responseChunks.join('') : obligationsData);
        
        if (!displayData && (isStreaming || regenerateLoader)) {
            // Show progress loader if still loading and no data
            if (!progressLoaderInstance && window.createProgressLoader) {
                progressLoaderInstance = window.createProgressLoader(resultContainer, {
                    title: 'Extracting obligations',
                    steps: [
                        'Reading document',
                        'Identifying obligations',
                        'Categorizing requirements',
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
                <div id="html_obligations_text" class="obligations-content">
                    ${processed}
                </div>
            `;
            
            // Show action buttons
            showObligationsActions(resultContainer);
            
            // Auto-scroll to bottom during streaming
            if (isStreaming) {
                window.scrollToBottom(resultContainer, false);
            }
        }
    }

    async function checkExistingObligations() {
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        const resultContainer = document.getElementById('obligations-result');
        const generateBtn = document.getElementById('generate-obligations-btn');
        
        if (!pluginData.contractId || !accessToken || !resultContainer) {
            initialLoading = false;
            return;
        }
        
        try {
            initialLoading = true;
            const url = `${backendUrl}/ai-assistant/fetch-obligation?contractId=${pluginData.contractId}`;
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.status && data.data && data.data.obligation) {
                    savedObligation = data.data.obligation;
                    obligationsData = data.data.obligation;
                    
                    // Update UI with saved obligation
                    updateStreamingUI();
                    
                    // Hide generate button container
                    const generateContainer = document.getElementById('obligations-generate-container');
                    if (generateContainer) {
                        generateContainer.style.display = 'none';
                    }
                    
                    // Show action box
                    showObligationsActions(resultContainer);
                }
            }
        } catch (error) {
            console.error('Error checking existing obligations:', error);
        } finally {
            initialLoading = false;
        }
    }

    function showObligationsActions(container) {
        // Show action box in header (matches MS Editor)
        const actionBox = document.getElementById('obligations-action-box');
        if (actionBox) {
            actionBox.style.display = 'flex';
        }
        
        // Hide generate button container
        const generateContainer = document.getElementById('obligations-generate-container');
        if (generateContainer) {
            generateContainer.style.display = 'none';
        }
    }

    function copyObligations() {
        const displayData = savedObligation || (responseChunks.length > 0 ? responseChunks.join('') : obligationsData);
        if (displayData) {
            // Extract text from HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = displayData;
            const text = tempDiv.textContent || tempDiv.innerText || displayData;
            
            navigator.clipboard.writeText(text).then(() => {
                showToast('Obligations copied to clipboard');
            }).catch(err => {
                console.error('Failed to copy:', err);
                showToast('Failed to copy obligations');
            });
        }
    }

    function regenerateObligations() {
        generateObligations('reGenerate');
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
    window.copyObligations = copyObligations;
    window.regenerateObligations = regenerateObligations;

})(window);
