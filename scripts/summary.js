// Summary Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSummary);
    } else {
        initSummary();
    }

    function initSummary() {
        const generateBtn = document.getElementById('generate-summary-btn');
        const resultContainer = document.getElementById('summary-result');
        const loadingContainer = document.getElementById('summary-loading');

        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateSummary);
        }
    }

    async function handleGenerateSummary() {
        const generateBtn = document.getElementById('generate-summary-btn');
        const resultContainer = document.getElementById('summary-result');
        const loadingContainer = document.getElementById('summary-loading');
        const pluginData = window.getPluginData();

        // Disable button and show loading
        generateBtn.disabled = true;
        loadingContainer.style.display = 'flex';
        resultContainer.innerHTML = '';

        try {
            // Get document content
            const documentContent = await window.getDocumentContent();
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();

            // Call backend API for summary generation
            const url = `${backendUrl}/ai-assistant/onlyoffice/generate-summary?contractId=${pluginData.contractId}&userId=${pluginData.userId}&organizationId=${pluginData.organizationId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken,
                    'accept-language': 'en-US,en;q=0.9'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to generate summary: ${response.status}`);
            }

            // Handle streaming response (if applicable)
            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    accumulated += decoder.decode(value, { stream: true });
                    resultContainer.innerHTML = formatSummary(accumulated);
                }

                resultContainer.innerHTML = formatSummary(accumulated);
            } else {
                const data = await response.json();
                resultContainer.innerHTML = formatSummary(data.summary || data.data || 'No summary available');
            }

        } catch (error) {
            console.error('Summary generation error:', error);
            resultContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        } finally {
            generateBtn.disabled = false;
            loadingContainer.style.display = 'none';
        }
    }

    function formatSummary(text) {
        // Format the summary text with proper line breaks and styling
        if (!text) return '<p>No summary available</p>';
        
        // Replace newlines with HTML breaks
        const formatted = text
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        return `<div class="summary-content"><p>${formatted}</p></div>`;
    }

})(window);
