// Ask AI Feature Module
(function(window) {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAskAI);
    } else {
        initAskAI();
    }

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
    }

    async function handleAskAI() {
        const inputField = document.getElementById('ask-ai-input');
        const chatContainer = document.getElementById('ask-ai-chat');
        const question = inputField.value.trim();

        if (!question) {
            showError('Please enter a question');
            return;
        }

        // Show user question in chat
        addMessageToChat(chatContainer, question, 'user');

        // Clear input
        inputField.value = '';
        inputField.disabled = true;

        // Show loading
        const loadingId = addMessageToChat(chatContainer, 'Thinking...', 'assistant', true);

        try {
            // Get document content
            const documentContent = await window.getDocumentContent();
            const pluginData = window.getPluginData();

            // Call your backend API
            const response = await callBackendAPI('/ai-assistant/ask-question', {
                question: question,
                documentContent: documentContent,
                contractId: pluginData.contractId,
                userId: pluginData.userId,
                organizationId: pluginData.organizationId
            });

            // Update loading message with actual response
            updateMessage(chatContainer, loadingId, response.answer || response.data || 'No answer received', 'assistant');
        } catch (error) {
            console.error('Ask AI Error:', error);
            updateMessage(chatContainer, loadingId, 'Sorry, an error occurred. Please try again.', 'assistant');
            showError('Failed to get AI response. Please check your connection and try again.');
        } finally {
            inputField.disabled = false;
            inputField.focus();
        }
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
        // Simple error display - you can enhance this
        alert(message);
    }

})(window);
