// Obligations Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObligations);
    } else {
        initObligations();
    }

    function initObligations() {
        const generateBtn = document.getElementById('generate-obligations-btn');
        const resultContainer = document.getElementById('obligations-result');
        const loadingContainer = document.getElementById('obligations-loading');

        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerateObligations);
        }
    }

    async function handleGenerateObligations() {
        const generateBtn = document.getElementById('generate-obligations-btn');
        const resultContainer = document.getElementById('obligations-result');
        const loadingContainer = document.getElementById('obligations-loading');
        const pluginData = window.getPluginData();

        // Disable button and show loading
        generateBtn.disabled = true;
        loadingContainer.style.display = 'flex';
        resultContainer.innerHTML = '';

        try {
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();

            // Call backend API for obligations generation
            const url = `${backendUrl}/ai-assistant/generate-obligation`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken,
                    'accept-language': 'en-US,en;q=0.9'
                },
                body: JSON.stringify({
                    contractId: pluginData.contractId,
                    userId: pluginData.userId,
                    organizationId: pluginData.organizationId
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate obligations: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status && data.data && data.data.obligation) {
                resultContainer.innerHTML = formatObligations(data.data.obligation);
            } else {
                resultContainer.innerHTML = '<div class="error-message">No obligations found</div>';
            }

        } catch (error) {
            console.error('Obligations generation error:', error);
            resultContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        } finally {
            generateBtn.disabled = false;
            loadingContainer.style.display = 'none';
        }
    }

    function formatObligations(obligationText) {
        // Format obligations text (can be HTML or plain text)
        if (!obligationText) return '<p>No obligations found</p>';
        
        // If it's HTML, use it directly; otherwise format as plain text
        if (obligationText.includes('<')) {
            return `<div class="obligations-content">${obligationText}</div>`;
        } else {
            const formatted = obligationText
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            return `<div class="obligations-content"><p>${formatted}</p></div>`;
        }
    }

})(window);
