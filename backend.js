// Global Pilgrim Trader - Backend JavaScript
// Owner: Olawale Abdul-Ganiyu
// Contact: adeganglobal@gmail.com, +2349030277275

// Database Simulation using localStorage
class Database {
    constructor() {
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (!localStorage.getItem('gpt_initialized')) {
            // Initialize admin account
            const adminAccount = {
                id: 'ADMIN001',
                accountNumber: '0022345678',
                name: 'Olawale Abdul-Ganiyu',
                email: 'adeganglobal@gmail.com',
                phone: '+2349030277275',
                password: this.hashPassword('admin123'),
                role: 'admin',
                balance: 1000000,
                profit: 0,
                status: 'approved',
                serialNumber: this.generateSerialNumber(),
                createdAt: new Date().toISOString()
            };

            // Initialize users array
            const users = [adminAccount];

            // Initialize trading data
            const tradingData = {
                activeTrades: [],
                tradeHistory: [],
                marketData: this.generateMarketData()
            };

            // Initialize payment data
            const paymentData = {
                transactions: [],
                pendingDeposits: [],
                pendingWithdrawals: []
            };

            // Save to localStorage
            localStorage.setItem('gpt_users', JSON.stringify(users));
            localStorage.setItem('gpt_trading', JSON.stringify(tradingData));
            localStorage.setItem('gpt_payments', JSON.stringify(paymentData));
            localStorage.setItem('gpt_initialized', 'true');
        }
    }

    hashPassword(password) {
        // Simple hash for demo (use proper hashing in production)
        return btoa(password);
    }

    generateSerialNumber() {
        return 'GPT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    generateAccountNumber() {
        let accountNumber;
        do {
            accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        } while (this.getUserByAccountNumber(accountNumber));
        return accountNumber;
    }

    generateMarketData() {
        const currencyPairs = [
            { symbol: 'EUR/USD', bid: 1.0850, ask: 1.0852, change: 0.15 },
            { symbol: 'GBP/USD', bid: 1.2650, ask: 1.2652, change: -0.08 },
            { symbol: 'USD/JPY', bid: 149.50, ask: 149.52, change: 0.22 },
            { symbol: 'AUD/USD', bid: 0.6540, ask: 0.6542, change: 0.05 },
            { symbol: 'USD/CAD', bid: 1.3550, ask: 1.3552, change: -0.12 },
            { symbol: 'USD/CHF', bid: 0.8750, ask: 0.8752, change: 0.03 }
        ];

        const cryptocurrencies = [
            { symbol: 'BTC/USD', price: 43500, change: 2.5 },
            { symbol: 'ETH/USD', price: 2280, change: 1.8 },
            { symbol: 'XRP/USD', price: 0.52, change: -0.5 },
            { symbol: 'LTC/USD', price: 72, change: 0.8 },
            { symbol: 'BCH/USD', price: 235, change: 1.2 }
        ];

        return { currencyPairs, cryptocurrencies };
    }

    // User Management
    getUsers() {
        return JSON.parse(localStorage.getItem('gpt_users')) || [];
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    getUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }

    getUserByAccountNumber(accountNumber) {
        const users = this.getUsers();
        return users.find(user => user.accountNumber === accountNumber);
    }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: 'USER' + Date.now(),
            accountNumber: this.generateAccountNumber(),
            serialNumber: this.generateSerialNumber(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            password: this.hashPassword(userData.password),
            role: 'user',
            balance: 0,
            profit: 0,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('gpt_users', JSON.stringify(users));
        return newUser;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('gpt_users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('gpt_users', JSON.stringify(filteredUsers));
    }

    approveUser(userId) {
        return this.updateUser(userId, { status: 'approved' });
    }

    // Balance Management
    updateBalance(userId, amount, type) {
        const user = this.getUserById(userId);
        if (!user) return false;

        const newBalance = type === 'credit' 
            ? user.balance + amount 
            : user.balance - amount;

        if (newBalance < 0) return false;

        return this.updateUser(userId, { balance: newBalance });
    }

    updateProfit(userId, amount) {
        const user = this.getUserById(userId);
        if (!user) return false;

        const newProfit = user.profit + amount;
        return this.updateUser(userId, { profit: newProfit });
    }

    // Trading Operations
    getTradingData() {
        return JSON.parse(localStorage.getItem('gpt_trading'));
    }

    saveTradingData(data) {
        localStorage.setItem('gpt_trading', JSON.stringify(data));
    }

    createTrade(userId, tradeData) {
        const tradingData = this.getTradingData();
        const trade = {
            id: 'TRADE' + Date.now(),
            userId: userId,
            symbol: tradeData.symbol,
            type: tradeData.type, // 'buy' or 'sell'
            lotSize: tradeData.lotSize,
            entryPrice: tradeData.entryPrice,
            currentPrice: tradeData.entryPrice,
            status: 'active',
            profit: 0,
            createdAt: new Date().toISOString(),
            mode: tradeData.mode // 'manual', 'automatic', 'robot'
        };

        tradingData.activeTrades.push(trade);
        this.saveTradingData(tradingData);
        return trade;
    }

    closeTrade(tradeId, exitPrice) {
        const tradingData = this.getTradingData();
        const tradeIndex = tradingData.activeTrades.findIndex(t => t.id === tradeId);
        
        if (tradeIndex === -1) return null;

        const trade = tradingData.activeTrades[tradeIndex];
        trade.exitPrice = exitPrice;
        trade.status = 'closed';
        trade.closedAt = new Date().toISOString();

        // Calculate profit
        const priceDiff = trade.type === 'buy' 
            ? exitPrice - trade.entryPrice 
            : trade.entryPrice - exitPrice;
        
        trade.profit = priceDiff * trade.lotSize * 100000; // Standard lot calculation

        // Move to history
        tradingData.activeTrades.splice(tradeIndex, 1);
        tradingData.tradeHistory.push(trade);
        this.saveTradingData(tradingData);

        // Update user profit
        if (trade.profit > 0) {
            this.updateProfit(trade.userId, trade.profit);
        }

        return trade;
    }

    // Robot Trading Logic
    startRobotTrading(userId) {
        const tradingData = this.getTradingData();
        
        // Check if robot is already running for this user
        if (tradingData.activeTrades.some(t => t.userId === userId && t.mode === 'robot')) {
            return { success: false, message: 'Robot trading already active' };
        }

        // Start robot trading cycle
        this.robotTradingCycle(userId);
        return { success: true, message: 'Robot trading started' };
    }

    robotTradingCycle(userId) {
        const tradingData = this.getTradingData();
        const marketData = tradingData.marketData;

        // Select a random currency pair
        const pair = marketData.currencyPairs[Math.floor(Math.random() * marketData.currencyPairs.length)];
        
        // Analyze market trend (simplified)
        const trend = Math.random() > 0.5 ? 'up' : 'down';
        const tradeType = trend === 'up' ? 'buy' : 'sell';

        // Create trade
        const trade = this.createTrade(userId, {
            symbol: pair.symbol,
            type: tradeType,
            lotSize: 0.1, // Default lot size for robot
            entryPrice: tradeType === 'buy' ? pair.ask : pair.bid,
            mode: 'robot'
        });

        // Monitor trade for 6 seconds
        setTimeout(() => {
            this.monitorRobotTrade(trade.id, pair);
        }, 6000);
    }

    monitorRobotTrade(tradeId, pair) {
        const tradingData = this.getTradingData();
        const trade = tradingData.activeTrades.find(t => t.id === tradeId);

        if (!trade) return;

        // Simulate price movement
        const priceChange = (Math.random() - 0.5) * 0.0020; // Random price movement
        const currentPrice = trade.type === 'buy' 
            ? pair.ask + priceChange 
            : pair.bid - priceChange;

        // Calculate profit
        const profit = trade.type === 'buy' 
            ? (currentPrice - trade.entryPrice) * trade.lotSize * 100000 
            : (trade.entryPrice - currentPrice) * trade.lotSize * 100000;

        // Check if profit threshold reached (0.02)
        if (profit >= 0.02) {
            // Close trade and reinvest profit
            this.closeTrade(tradeId, currentPrice);
            
            // Start new trade with reinvested profit
            const user = this.getUserById(trade.userId);
            if (user && user.profit > 0) {
                this.robotTradingCycle(trade.userId);
            }
        } else if (profit <= -0.01) {
            // Stop loss - close trade
            this.closeTrade(tradeId, currentPrice);
        } else {
            // Continue monitoring
            setTimeout(() => {
                this.monitorRobotTrade(tradeId, pair);
            }, 6000);
        }
    }

    // Payment Operations
    getPaymentData() {
        return JSON.parse(localStorage.getItem('gpt_payments'));
    }

    savePaymentData(data) {
        localStorage.setItem('gpt_payments', JSON.stringify(data));
    }

    createTransaction(transactionData) {
        const paymentData = this.getPaymentData();
        const transaction = {
            id: 'TXN' + Date.now(),
            userId: transactionData.userId,
            type: transactionData.type, // 'deposit' or 'withdrawal'
            amount: transactionData.amount,
            method: transactionData.method,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        paymentData.transactions.push(transaction);
        this.savePaymentData(paymentData);
        return transaction;
    }

    processTransaction(transactionId) {
        const paymentData = this.getPaymentData();
        const transaction = paymentData.transactions.find(t => t.id === transactionId);

        if (!transaction) return false;

        transaction.status = 'completed';

        if (transaction.type === 'deposit') {
            this.updateBalance(transaction.userId, transaction.amount, 'credit');
        } else {
            this.updateBalance(transaction.userId, transaction.amount, 'debit');
        }

        this.savePaymentData(paymentData);
        return true;
    }

    transferFunds(fromUserId, toAccountNumber, amount) {
        const fromUser = this.getUserById(fromUserId);
        const toUser = this.getUserByAccountNumber(toAccountNumber);

        if (!fromUser || !toUser) {
            return { success: false, message: 'Invalid account' };
        }

        if (fromUser.balance < amount) {
            return { success: false, message: 'Insufficient balance' };
        }

        this.updateBalance(fromUserId, amount, 'debit');
        this.updateBalance(toUser.id, amount, 'credit');

        // Record transaction
        this.createTransaction({
            userId: fromUserId,
            type: 'transfer',
            amount: amount,
            method: 'internal',
            toAccount: toAccountNumber
        });

        return { success: true, message: 'Transfer successful' };
    }

    // Market Data Updates
    updateMarketData() {
        const tradingData = this.getTradingData();
        
        // Update currency pairs
        tradingData.marketData.currencyPairs.forEach(pair => {
            const change = (Math.random() - 0.5) * 0.0010;
            pair.bid += change;
            pair.ask = pair.bid + 0.0002;
            pair.change = (Math.random() - 0.5) * 0.5;
        });

        // Update cryptocurrencies
        tradingData.marketData.cryptocurrencies.forEach(crypto => {
            const change = (Math.random() - 0.5) * 0.02;
            crypto.price *= (1 + change);
            crypto.change = (Math.random() - 0.5) * 3;
        });

        this.saveTradingData(tradingData);
        return tradingData.marketData;
    }

    // Authentication
    authenticateUser(email, password) {
        const user = this.getUserByEmail(email);
        if (user && user.password === this.hashPassword(password)) {
            return { success: true, user: this.sanitizeUser(user) };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    authenticateByAccountNumber(accountNumber, password) {
        const user = this.getUserByAccountNumber(accountNumber);
        if (user && user.password === this.hashPassword(password)) {
            return { success: true, user: this.sanitizeUser(user) };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    // Password Generation
    generatePassword() {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    // Admin Functions
    getAllUsers() {
        return this.getUsers().map(user => this.sanitizeUser(user));
    }

    getPendingUsers() {
        return this.getUsers()
            .filter(user => user.status === 'pending')
            .map(user => this.sanitizeUser(user));
    }

    getSystemStats() {
        const users = this.getUsers();
        const tradingData = this.getTradingData();
        const paymentData = this.getPaymentData();

        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'approved').length,
            pendingUsers: users.filter(u => u.status === 'pending').length,
            totalBalance: users.reduce((sum, u) => sum + u.balance, 0),
            totalProfit: users.reduce((sum, u) => sum + u.profit, 0),
            activeTrades: tradingData.activeTrades.length,
            completedTrades: tradingData.tradeHistory.length,
            pendingTransactions: paymentData.transactions.filter(t => t.status === 'pending').length
        };
    }
}

// Initialize Database
const db = new Database();

// Export for use in frontend
window.GPTBackend = {
    db,
    authenticateUser: (email, password) => db.authenticateUser(email, password),
    authenticateByAccountNumber: (accountNumber, password) => db.authenticateByAccountNumber(accountNumber, password),
    createUser: (userData) => db.createUser(userData),
    updateUser: (userId, updates) => db.updateUser(userId, updates),
    deleteUser: (userId) => db.deleteUser(userId),
    approveUser: (userId) => db.approveUser(userId),
    updateBalance: (userId, amount, type) => db.updateBalance(userId, amount, type),
    createTrade: (userId, tradeData) => db.createTrade(userId, tradeData),
    closeTrade: (tradeId, exitPrice) => db.closeTrade(tradeId, exitPrice),
    startRobotTrading: (userId) => db.startRobotTrading(userId),
    createTransaction: (transactionData) => db.createTransaction(transactionData),
    processTransaction: (transactionId) => db.processTransaction(transactionId),
    transferFunds: (fromUserId, toAccountNumber, amount) => db.transferFunds(fromUserId, toAccountNumber, amount),
    getMarketData: () => db.getTradingData().marketData,
    updateMarketData: () => db.updateMarketData(),
    generatePassword: () => db.generatePassword(),
    getAllUsers: () => db.getAllUsers(),
    getPendingUsers: () => db.getPendingUsers(),
    getSystemStats: () => db.getSystemStats()
};

console.log('Global Pilgrim Trader Backend Initialized');
console.log('Owner: Olawale Abdul-Ganiyu');
console.log('Contact: adeganglobal@gmail.com | +2349030277275');