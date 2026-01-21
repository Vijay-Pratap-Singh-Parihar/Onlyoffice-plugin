// Clauses Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClauses);
    } else {
        initClauses();
    }

    function initClauses() {
        const extractBtn = document.getElementById('extract-clauses-btn');
        const resultContainer = document.getElementById('clauses-result');
        const loadingContainer = document.getElementById('clauses-loading');

        if (extractBtn) {
            extractBtn.addEventListener('click', handleExtractClauses);
        }
    }

    async function handleExtractClauses() {
        const extractBtn = document.getElementById('extract-clauses-btn');
        const resultContainer = document.getElementById('clauses-result');
        const loadingContainer = document.getElementById('clauses-loading');
        const pluginData = window.getPluginData();

        // Disable button and show loading
        extractBtn.disabled = true;
        loadingContainer.style.display = 'flex';
        resultContainer.innerHTML = '';

        try {
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();

            // Call backend API for clauses extraction
            const url = `${backendUrl}/ai-assistant/onlyoffice/generate-AiClause?contractId=${pluginData.contractId}&userId=${pluginData.userId}&organizationId=${pluginData.organizationId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken,
                    'accept-language': 'en-US,en;q=0.9'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to extract clauses: ${response.status}`);
            }

            // Handle streaming response
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    accumulated += decoder.decode(value, { stream: true });
                    resultContainer.innerHTML = formatClauses(accumulated);
                }

                resultContainer.innerHTML = formatClauses(accumulated);
            } else {
                const data = await response.json();
                resultContainer.innerHTML = formatClauses(data.clauses || data.data || 'No clauses found');
            }

        } catch (error) {
            console.error('Clauses extraction error:', error);
            resultContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        } finally {
            extractBtn.disabled = false;
            loadingContainer.style.display = 'none';
        }
    }

    function formatClauses(clausesText) {
        // Format clauses text
        if (!clausesText) return '<p>No clauses found</p>';
        
        // If it's HTML, use it directly; otherwise format as plain text
        if (clausesText.includes('<')) {
            return `<div class="clauses-content">${clausesText}</div>`;
        } else {
            const formatted = clausesText
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            return `<div class="clauses-content"><p>${formatted}</p></div>`;
        }
    }

})(window);
