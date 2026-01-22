// Ask AI Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAskAI);
    } else {
        initAskAI();
    }

    let chatHistory = [];
    let isLoading = false;

    function initAskAI() {
        const sendButton = document.getElementById('ask-ai-send');
        const inputField = document.getElementById('ask-ai-input');
        const chatContainer = document.getElementById('ask-ai-chat');

        if (sendButton && inputField && chatContainer) {
            sendButton.addEventListener('click', handleAskAI);
            inputField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskAI();
                }
            });
        }
        
        // Load chat history
        loadChatHistory();
    }

    async function loadChatHistory() {
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        const chatContainer = document.getElementById('ask-ai-chat');
        
        if (!pluginData.contractId || !accessToken || !chatContainer) return;
        
        try {
            // Build query params
            const params = new URLSearchParams({
                contractId: pluginData.contractId,
                userId: pluginData.userId || '',
                organizationId: pluginData.organizationId || ''
            });
            
            const url = `${backendUrl}/ai-assistant/chat-history?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.status && data.data && Array.isArray(data.data)) {
                    chatHistory = data.data;
                    
                    // Render chat history
                    chatContainer.innerHTML = '';
                    chatHistory.forEach(msg => {
                        addMessageToChat(chatContainer, msg.question || msg.query || '', 'user');
                        addMessageToChat(chatContainer, msg.answer || msg.response || '', 'assistant');
                    });
                }
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
            // Silent fail - user can still chat
        }
    }

    async function handleAskAI() {
        if (isLoading) return;
        
        const inputField = document.getElementById('ask-ai-input');
        const chatContainer = document.getElementById('ask-ai-chat');
        const sendButton = document.getElementById('ask-ai-send');
        const question = inputField.value.trim();

        if (!question) {
            showError('Please enter a question');
            return;
        }

        // Show user question in chat
        addMessageToChat(chatContainer, question, 'user');

        // Clear input and disable
        inputField.value = '';
        inputField.disabled = true;
        if (sendButton) sendButton.disabled = true;
        isLoading = true;

        // Show loading message
        const loadingId = addMessageToChat(chatContainer, 'Thinking...', 'assistant', true);

        try {
            const pluginData = window.getPluginData();
            const backendUrl = window.getBackendUrl();
            const accessToken = window.getAccessToken();

            // Sync document first (as per MS Editor implementation)
            try {
                await syncDocument(pluginData, backendUrl, accessToken);
            } catch (syncError) {
                console.warn('Document sync failed, continuing:', syncError);
            }

            // Call backend API
            const response = await callBackendAPI('/ai-assistant/ask-question', {
                question: question,
                contractId: pluginData.contractId,
                userId: pluginData.userId,
                organizationId: pluginData.organizationId
            });

            // Update loading message with actual response
            const answer = response.answer || response.data || response.response || 'No answer received';
            updateMessage(chatContainer, loadingId, answer, 'assistant');
            
            // Add to chat history
            chatHistory.push({
                question: question,
                answer: answer,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Ask AI Error:', error);
            const errorMsg = error.message || 'Sorry, an error occurred. Please try again.';
            updateMessage(chatContainer, loadingId, errorMsg, 'assistant');
            showError('Failed to get AI response. Please check your connection and try again.');
        } finally {
            inputField.disabled = false;
            if (sendButton) sendButton.disabled = false;
            inputField.focus();
            isLoading = false;
        }
    }

    async function syncDocument(pluginData, backendUrl, accessToken) {
        // Sync document before asking questions (as per MS Editor)
        const response = await fetch(`${backendUrl}/ai-assistant/onlyoffice/sync-document`, {
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
            throw new Error('Document sync failed');
        }
        
        return await response.json();
    }

    function addMessageToChat(container, message, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        if (isLoading) {
            messageDiv.id = 'loading-' + Date.now();
            messageDiv.innerHTML = '<div class="loading"></div> ' + message;
        } else {
            messageDiv.textContent = message;
        }
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        return messageDiv.id;
    }

    function updateMessage(container, messageId, newText, sender) {
        const messageDiv = document.getElementById(messageId);
        if (messageDiv) {
            messageDiv.textContent = newText;
            messageDiv.className = `chat-message ${sender}`;
            container.scrollTop = container.scrollHeight;
        }
    }

    // Helper function to call backend API
    async function callBackendAPI(endpoint, data) {
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();

        if (!accessToken) {
            throw new Error('Access token not available');
        }

        const response = await fetch(backendUrl + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': accessToken,
                'accept-language': 'en-US,en;q=0.9'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    function showError(message) {
        // Show toast notification instead of alert
        const toast = document.createElement('div');
        toast.className = 'toast-message error';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

})(window);
