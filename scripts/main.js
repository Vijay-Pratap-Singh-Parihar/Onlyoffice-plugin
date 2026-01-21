// Main Plugin Entry Point
(function(window) {
    'use strict';

    // Store plugin data (contractId, accessToken, etc.)
    window.pluginData = {};

    // Plugin initialization - called when OnlyOffice loads the plugin
    window.Asc.plugin.init = function() {
        console.log('AI Contract Assistant Plugin initialized');
        
        // Get plugin initialization data (passed from backend)
        const initData = window.Asc.plugin.info.initData;
        if (initData) {
            try {
                const data = JSON.parse(initData);
                window.pluginData = {
                    contractId: data.contractId || '',
                    accessToken: data.accessToken || '',
                    userId: data.userId || '',
                    organizationId: data.organizationId || '',
                    backendUrl: data.backendUrl || 'https://contract-backend.legistify.com/api'
                };
            } catch (e) {
                console.error('Error parsing plugin init data:', e);
            }
        }
        
        // Initialize tab switching
        initTabs();
        
        // Initialize OnlyOffice API connection
        initOnlyOfficeAPI();
    };

    // Handle button clicks from OnlyOffice toolbar
    window.Asc.plugin.button = function(id) {
        // This function is called when user clicks a plugin button
        // Map button IDs to tab names
        const buttonMap = {
            'ask-ai': 'ask-ai',
            'summary': 'summary',
            'obligations': 'obligations',
            'clauses': 'clauses',
            'playbook': 'playbook',
            'approval': 'approval'
        };

        const tabName = buttonMap[id];
        if (tabName) {
            switchTab(tabName);
        }
    };

    // Initialize tab switching functionality
    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });
    }

    // Switch between tabs
    function switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName + '-tab');
        const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
    }

    // Initialize OnlyOffice API helpers
    function initOnlyOfficeAPI() {
        // Get document content as plain text
        window.getDocumentContent = function() {
            return new Promise((resolve, reject) => {
                try {
                    // Get document from OnlyOffice API
                    const oDocument = Api.GetDocument();
                    let content = '';
                    
                    // Iterate through document elements to extract text
                    const count = oDocument.GetElementsCount();
                    for (let i = 0; i < count; i++) {
                        const element = oDocument.GetElement(i);
                        if (element && element.GetText) {
                            content += element.GetText() + '\n';
                        }
                    }
                    
                    resolve(content.trim());
                } catch (error) {
                    console.error('Error getting document content:', error);
                    reject(error);
                }
            });
        };

        // Get selected text
        window.getSelectedText = function() {
            return new Promise((resolve, reject) => {
                try {
                    const selection = Api.GetSelection();
                    if (selection) {
                        const text = selection.GetText();
                        resolve(text || '');
                    } else {
                        resolve('');
                    }
                } catch (error) {
                    console.error('Error getting selected text:', error);
                    reject(error);
                }
            });
        };
    }

    // Plugin execution complete callback
    window.Asc.plugin.executeCommand = function(command, data) {
        // Handle commands from OnlyOffice
        console.log('Command received:', command, data);
    };

    // Helper function to get plugin data
    window.getPluginData = function() {
        return window.pluginData || {};
    };

    // Helper function to get backend URL
    window.getBackendUrl = function() {
        return window.pluginData?.backendUrl || 'https://contract-backend.legistify.com/api';
    };

    // Helper function to get access token
    window.getAccessToken = function() {
        return window.pluginData?.accessToken || '';
    };

    // Helper function to get contract ID
    window.getContractId = function() {
        return window.pluginData?.contractId || '';
    };

})(window);
