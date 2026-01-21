// Approval Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApproval);
    } else {
        initApproval();
    }

    function initApproval() {
        const startBtn = document.getElementById('start-approval-btn');
        const resultContainer = document.getElementById('approval-result');
        const loadingContainer = document.getElementById('approval-loading');

        if (startBtn) {
            startBtn.addEventListener('click', handleStartApproval);
        }
    }

    async function handleStartApproval() {
        const startBtn = document.getElementById('start-approval-btn');
        const resultContainer = document.getElementById('approval-result');
        const loadingContainer = document.getElementById('approval-loading');
        const pluginData = window.getPluginData();

        // Disable button and show loading
        startBtn.disabled = true;
        loadingContainer.style.display = 'flex';
        resultContainer.innerHTML = '';

        try {
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();

            // Call backend API to start approval workflow
            const url = `${backendUrl}/clause-approval/start-clause-approval-workflow`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken
                },
                body: JSON.stringify({
                    contractId: pluginData.contractId,
                    userId: pluginData.userId,
                    organizationId: pluginData.organizationId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to start approval: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status) {
                resultContainer.innerHTML = `
                    <div class="success-message">
                        <h4>Approval Workflow Started</h4>
                        <p>Your approval workflow has been initiated successfully.</p>
                        <p>Approval ID: ${data.data?.approvalId || 'N/A'}</p>
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `<div class="error-message">${data.message || 'Failed to start approval workflow'}</div>`;
            }

        } catch (error) {
            console.error('Approval start error:', error);
            resultContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        } finally {
            startBtn.disabled = false;
            loadingContainer.style.display = 'none';
        }
    }

})(window);
