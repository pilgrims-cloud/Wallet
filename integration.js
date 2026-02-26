// Global Pilgrim Bank - Trading Platform Integration
// This file handles the integration between the wallet and trading platform

// Integration Manager
class IntegrationManager {
    constructor() {
        this.connected = false;
        this.tradingPlatformUrl = '';
        this.walletUrl = '';
        this.apiKey = '';
        this.syncInterval = null;
    }

    // Connect wallet to trading platform
    async connectToTradingPlatform(tradingUrl, walletUrl, apiKey) {
        try {
            // Simulate API connection
            const response = await this.makeRequest(tradingUrl + '/api/connect', {
                walletUrl: walletUrl,
                apiKey: apiKey
            });

            if (response.success) {
                this.connected = true;
                this.tradingPlatformUrl = tradingUrl;
                this.walletUrl = walletUrl;
                this.apiKey = apiKey;
                
                // Start auto-sync
                this.startAutoSync();
                
                return {
                    success: true,
                    message: 'Successfully connected to trading platform'
                };
            } else {
                return {
                    success: false,
                    message: 'Connection failed: ' + response.message
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'Connection error: ' + error.message
            };
        }
    }

    // Withdraw from trading platform to wallet
    async withdrawFromTrading(amount, currency = 'USD') {
        if (!this.connected) {
            return {
                success: false,
                message: 'Not connected to trading platform'
            };
        }

        try {
            const response = await this.makeRequest(this.tradingPlatformUrl + '/api/withdraw', {
                amount: amount,
                currency: currency,
                destination: this.walletUrl,
                apiKey: this.apiKey
            });

            if (response.success) {
                // Add transaction to wallet
                GPBWallet.addTransaction({
                    type: 'Deposit',
                    sender: 'Trading Platform',
                    amount: amount,
                    currency: currency,
                    note: 'Withdrawal from trading platform',
                    reference: response.transactionId
                });

                // Update wallet balance
                GPBWallet.updateBalance(currency, amount, 'credit');

                return {
                    success: true,
                    message: 'Withdrawal successful',
                    transactionId: response.transactionId
                };
            } else {
                return {
                    success: false,
                    message: 'Withdrawal failed: ' + response.message
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'Withdrawal error: ' + error.message
            };
        }
    }

    // Deposit from wallet to trading platform
    async depositToTrading(amount, currency = 'USD') {
        if (!this.connected) {
            return {
                success: false,
                message: 'Not connected to trading platform'
            };
        }

        try {
            const response = await this.makeRequest(this.tradingPlatformUrl + '/api/deposit', {
                amount: amount,
                currency: currency,
                source: this.walletUrl,
                apiKey: this.apiKey
            });

            if (response.success) {
                // Add transaction to wallet
                GPBWallet.addTransaction({
                    type: 'Withdrawal',
                    recipient: 'Trading Platform',
                    amount: amount,
                    currency: currency,
                    note: 'Deposit to trading platform',
                    reference: response.transactionId
                });

                // Update wallet balance
                GPBWallet.updateBalance(currency, amount, 'debit');

                return {
                    success: true,
                    message: 'Deposit successful',
                    transactionId: response.transactionId
                };
            } else {
                return {
                    success: false,
                    message: 'Deposit failed: ' + response.message
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'Deposit error: ' + error.message
            };
        }
    }

    // Get trading platform balance
    async getTradingBalance() {
        if (!this.connected) {
            return {
                success: false,
                message: 'Not connected to trading platform'
            };
        }

        try {
            const response = await this.makeRequest(this.tradingPlatformUrl + '/api/balance', {
                apiKey: this.apiKey
            });

            return {
                success: true,
                balance: response.balance
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error getting balance: ' + error.message
            };
        }
    }

    // Sync transactions between wallet and trading platform
    async syncTransactions() {
        if (!this.connected) return;

        try {
            const response = await this.makeRequest(this.tradingPlatformUrl + '/api/transactions', {
                apiKey: this.apiKey
            });

            if (response.success && response.transactions) {
                // Process new transactions
                response.transactions.forEach(tx => {
                    // Check if transaction already exists in wallet
                    const existingTx = GPBWallet.getWallet().transactions.find(
                        t => t.reference === tx.id
                    );

                    if (!existingTx) {
                        // Add new transaction to wallet
                        GPBWallet.addTransaction({
                            type: tx.type === 'deposit' ? 'Received' : 'Sent',
                            sender: tx.type === 'deposit' ? 'Trading Platform' : 'Wallet',
                            recipient: tx.type === 'withdrawal' ? 'Trading Platform' : 'Wallet',
                            amount: tx.amount,
                            currency: tx.currency,
                            note: 'Synced from trading platform',
                            reference: tx.id,
                            status: tx.status
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }

    // Start auto-sync
    startAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Sync every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncTransactions();
        }, 30000);
    }

    // Stop auto-sync
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Make API request
    async makeRequest(url, data) {
        // Simulate API request (in production, use fetch/axios)
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate successful response
                resolve({
                    success: true,
                    message: 'Request successful',
                    transactionId: 'TXN' + Date.now(),
                    balance: Math.floor(Math.random() * 10000),
                    transactions: []
                });
            }, 1000);
        });
    }

    // Disconnect from trading platform
    disconnect() {
        this.connected = false;
        this.tradingPlatformUrl = '';
        this.walletUrl = '';
        this.apiKey = '';
        this.stopAutoSync();

        return {
            success: true,
            message: 'Disconnected from trading platform'
        };
    }
}

// Initialize Integration Manager
const integrationManager = new IntegrationManager();

// Export for use
window.GPBIntegration = {
    connectToTradingPlatform: (tradingUrl, walletUrl, apiKey) => 
        integrationManager.connectToTradingPlatform(tradingUrl, walletUrl, apiKey),
    withdrawFromTrading: (amount, currency) => 
        integrationManager.withdrawFromTrading(amount, currency),
    depositToTrading: (amount, currency) => 
        integrationManager.depositToTrading(amount, currency),
    getTradingBalance: () => 
        integrationManager.getTradingBalance(),
    syncTransactions: () => 
        integrationManager.syncTransactions(),
    disconnect: () => 
        integrationManager.disconnect()
};

console.log('Global Pilgrim Bank Integration Manager Initialized');
console.log('Owner: Olawale Abdul-Ganiyu');
console.log('Contact: adeganglobal@gmail.com | +2349030277275');