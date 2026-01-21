// AI Playbook Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlaybook);
    } else {
        initPlaybook();
    }

    function initPlaybook() {
        const runBtn = document.getElementById('run-playbook-btn');
        const resultContainer = document.getElementById('playbook-result');
        const loadingContainer = document.getElementById('playbook-loading');

        if (runBtn) {
            runBtn.addEventListener('click', handleRunPlaybook);
        }
    }

    async function handleRunPlaybook() {
        const runBtn = document.getElementById('run-playbook-btn');
        const resultContainer = document.getElementById('playbook-result');
        const loadingContainer = document.getElementById('playbook-loading');
        const pluginData = window.getPluginData();

        // Disable button and show loading
        runBtn.disabled = true;
        loadingContainer.style.display = 'flex';
        resultContainer.innerHTML = '';

        try {
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();

            // First, get list of playbooks
            const playbooksUrl = `${backendUrl}/ai-assistant/global-playbooks`;
            const playbooksResponse = await fetch(playbooksUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken
                }
            });

            if (!playbooksResponse.ok) {
                throw new Error('Failed to fetch playbooks');
            }

            const playbooksData = await playbooksResponse.json();
            
            if (!playbooksData.data || playbooksData.data.length === 0) {
                resultContainer.innerHTML = '<div class="info-message">No playbooks available. Please create a playbook first.</div>';
                return;
            }

            // For now, run the first playbook (you can enhance this to show a selection UI)
            const playbookId = playbooksData.data[0]._id || playbooksData.data[0].id;

            // Run the playbook
            const runUrl = `${backendUrl}/ai-assistant/run-playbook`;
            const runResponse = await fetch(runUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken
                },
                body: JSON.stringify({
                    contractId: pluginData.contractId,
                    playbookId: playbookId,
                    userId: pluginData.userId,
                    organizationId: pluginData.organizationId
                })
            });

            if (!runResponse.ok) {
                throw new Error(`Failed to run playbook: ${runResponse.status}`);
            }

            // Handle streaming response
            if (runResponse.body) {
                const reader = runResponse.body.getReader();
                const decoder = new TextDecoder();
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    accumulated += decoder.decode(value, { stream: true });
                    resultContainer.innerHTML = formatPlaybookResult(accumulated);
                }

                resultContainer.innerHTML = formatPlaybookResult(accumulated);
            } else {
                const data = await runResponse.json();
                resultContainer.innerHTML = formatPlaybookResult(data.result || data.data || 'Playbook completed');
            }

        } catch (error) {
            console.error('Playbook execution error:', error);
            resultContainer.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        } finally {
            runBtn.disabled = false;
            loadingContainer.style.display = 'none';
        }
    }

    function formatPlaybookResult(resultText) {
        // Format playbook results
        if (!resultText) return '<p>No results available</p>';
        
        // If it's HTML, use it directly; otherwise format as plain text
        if (resultText.includes('<')) {
            return `<div class="playbook-content">${resultText}</div>`;
        } else {
            const formatted = resultText
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
            return `<div class="playbook-content"><p>${formatted}</p></div>`;
        }
    }

})(window);
