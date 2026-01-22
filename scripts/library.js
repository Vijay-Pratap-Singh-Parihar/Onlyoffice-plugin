// Library Feature Module
(function(window) {
    'use strict';

    let libraryData = [];
    let currentPage = 1;
    let isLoading = false;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLibrary);
    } else {
        initLibrary();
    }

    function initLibrary() {
        // Load library on initialization
        loadLibrary();
    }

    async function loadLibrary() {
        if (isLoading) return;
        
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        const libraryList = document.getElementById('library-list');
        const loadingContainer = document.getElementById('library-loading');
        
        if (!pluginData.contractId || !accessToken || !libraryList) return;
        
        isLoading = true;
        if (loadingContainer) loadingContainer.style.display = 'flex';
        libraryList.innerHTML = '';

        try {
            // Build query params
            const params = new URLSearchParams({
                contractId: pluginData.contractId,
                organizationId: pluginData.organizationId || '',
                page: currentPage,
                limit: 50
            });
            
            const url = `${backendUrl}/clause-library/clause-list?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.status && data.data) {
                    libraryData = Array.isArray(data.data) ? data.data : (data.data.clauses || []);
                    renderLibraryList(libraryList, libraryData);
                } else {
                    libraryList.innerHTML = '<div class="empty-state">No clauses found in library</div>';
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.msg || errorData.message || 'Failed to load library');
            }
        } catch (error) {
            console.error('Library loading error:', error);
            if (libraryList) {
                libraryList.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
            }
        } finally {
            isLoading = false;
            if (loadingContainer) loadingContainer.style.display = 'none';
        }
    }

    function renderLibraryList(container, clauses) {
        if (!clauses || clauses.length === 0) {
            container.innerHTML = '<div class="empty-state">No clauses found in library</div>';
            return;
        }

        const listHTML = clauses.map((clause, index) => {
            const clauseName = clause.name || clause.clauseName || `Clause ${index + 1}`;
            const clauseDescription = clause.description || clause.clauseDescription || '';
            const isFavorite = clause.isFavorite || clause.isFavourite || false;
            
            return `
                <div class="library-item" data-clause-id="${clause._id || clause.id}">
                    <div class="library-item-header">
                        <h4 class="library-item-title">${escapeHtml(clauseName)}</h4>
                        <button class="favorite-button ${isFavorite ? 'active' : ''}" 
                                onclick="toggleFavorite('${clause._id || clause.id}')" 
                                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>
                    ${clauseDescription ? `<p class="library-item-description">${escapeHtml(clauseDescription)}</p>` : ''}
                    <button class="view-details-button" onclick="viewClauseDetails('${clause._id || clause.id}')">
                        View Details
                    </button>
                </div>
            `;
        }).join('');

        container.innerHTML = listHTML;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function toggleFavorite(clauseId) {
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        
        if (!accessToken) {
            showToast('Access token not available');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/clause-library/mark-favourite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': accessToken
                },
                body: JSON.stringify({
                    clauseId: clauseId,
                    contractId: pluginData.contractId,
                    organizationId: pluginData.organizationId
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Reload library to update favorite status
                loadLibrary();
                showToast(data.msg || 'Favorite status updated');
            } else {
                throw new Error('Failed to update favorite');
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            showToast('Failed to update favorite');
        }
    }

    async function viewClauseDetails(clauseId) {
        const pluginData = window.getPluginData();
        const backendUrl = window.getBackendUrl();
        const accessToken = window.getAccessToken();
        
        if (!accessToken) {
            showToast('Access token not available');
            return;
        }

        try {
            const params = new URLSearchParams({
                subClauseId: clauseId,
                contractId: pluginData.contractId || ''
            });
            
            const url = `${backendUrl}/clause-library/sub-clause-details/${clauseId}?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    'x-auth-token': accessToken,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.status && data.data) {
                    // Show clause details in a modal or expand view
                    showClauseDetailsModal(data.data);
                }
            } else {
                throw new Error('Failed to load clause details');
            }
        } catch (error) {
            console.error('View clause details error:', error);
            showToast('Failed to load clause details');
        }
    }

    function showClauseDetailsModal(clauseData) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'clause-details-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="closeClauseDetailsModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${escapeHtml(clauseData.name || clauseData.clauseName || 'Clause Details')}</h3>
                    <button class="modal-close" onclick="closeClauseDetailsModal()">×</button>
                </div>
                <div class="modal-body">
                    ${clauseData.description ? `<p><strong>Description:</strong> ${escapeHtml(clauseData.description)}</p>` : ''}
                    ${clauseData.content ? `<div class="clause-content">${clauseData.content}</div>` : ''}
                    ${clauseData.notes ? `<p><strong>Notes:</strong> ${escapeHtml(clauseData.notes)}</p>` : ''}
                </div>
                <div class="modal-footer">
                    <button class="action-button" onclick="insertClauseIntoDocument('${clauseData._id || clauseData.id}')">Insert into Document</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    function closeClauseDetailsModal() {
        const modal = document.querySelector('.clause-details-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    function insertClauseIntoDocument(clauseId) {
        // This would insert the clause into the OnlyOffice document
        // Implementation depends on OnlyOffice API capabilities
        showToast('Clause insertion feature coming soon');
        closeClauseDetailsModal();
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
    window.toggleFavorite = toggleFavorite;
    window.viewClauseDetails = viewClauseDetails;
    window.closeClauseDetailsModal = closeClauseDetailsModal;
    window.insertClauseIntoDocument = insertClauseIntoDocument;

})(window);
