// Global Pilgrim Trader - Admin Dashboard JavaScript
// Owner: Olawale Abdul-Ganiyu
// Contact: adeganglobal@gmail.com, +2349030277275

let currentUser = null;
let marketUpdateInterval = null;

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession();
    initializeEventListeners();
    loadDashboardStats();
    startMarketUpdates();
});

// Session Management
function checkAdminSession() {
    const session = localStorage.getItem('gpt_session');
    if (session) {
        currentUser = JSON.parse(session);
        if (currentUser.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        document.getElementById('adminName').textContent = currentUser.name;
    } else {
        window.location.href = 'index.html';
    }
}

// Navigation
function initializeEventListeners() {
    // Navigation menu
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Auto-generate password checkbox
    const autoGenerateCheckbox = document.getElementById('autoGeneratePassword');
    if (autoGenerateCheckbox) {
        autoGenerateCheckbox.addEventListener('change', function() {
            const passwordGroup = document.getElementById('passwordGroup');
            if (this.checked) {
                passwordGroup.style.display = 'none';
            } else {
                passwordGroup.style.display = 'block';
            }
        });
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from nav links
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked link
    document.querySelector(`.nav-menu a[href="#${sectionId}"]`).classList.add('active');

    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'trades':
            loadTrades();
            break;
        case 'payments':
            loadPayments();
            break;
    }
}

// Dashboard Functions
function loadDashboardStats() {
    const stats = GPTBackend.getSystemStats();
    
    document.getElementById('totalUsers').textContent = stats.totalUsers;
    document.getElementById('activeUsers').textContent = stats.activeUsers;
    document.getElementById('pendingUsers').textContent = stats.pendingUsers;
    document.getElementById('totalBalance').textContent = '$' + stats.totalBalance.toLocaleString();
    document.getElementById('totalProfit').textContent = '$' + stats.totalProfit.toLocaleString();
    document.getElementById('activeTrades').textContent = stats.activeTrades;
    
    addTerminalMessage('[STATS] Dashboard statistics updated', 'info');
}

// User Management Functions
function loadUsers() {
    loadPendingUsers();
    loadAllUsers();
}

function loadPendingUsers() {
    const pendingUsers = GPTBackend.getPendingUsers();
    const container = document.getElementById('pendingUsersList');
    
    if (pendingUsers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-clock"></i><p>No pending users</p></div>';
        return;
    }
    
    container.innerHTML = pendingUsers.map(user => `
        <div class="user-card">
            <div class="user-details">
                <h4>${user.name}</h4>
                <p><i class="fas fa-envelope"></i> ${user.email}</p>
                <p><i class="fas fa-phone"></i> ${user.phone}</p>
                <p><i class="fas fa-id-card"></i> Account: ${user.accountNumber}</p>
                <p><i class="fas fa-barcode"></i> Serial: ${user.serialNumber}</p>
                <p><i class="fas fa-calendar"></i> Created: ${new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="user-actions">
                <button onclick="approveUser('${user.id}')" class="btn-approve">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button onclick="deleteUser('${user.id}')" class="btn-delete">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function loadAllUsers() {
    const allUsers = GPTBackend.getAllUsers();
    const container = document.getElementById('allUsersList');
    
    container.innerHTML = allUsers.map(user => `
        <div class="user-card">
            <div class="user-details">
                <h4>${user.name} ${user.role === 'admin' ? '<span class="admin-badge">ADMIN</span>' : ''}</h4>
                <p><i class="fas fa-envelope"></i> ${user.email}</p>
                <p><i class="fas fa-phone"></i> ${user.phone}</p>
                <p><i class="fas fa-id-card"></i> Account: ${user.accountNumber}</p>
                <p><i class="fas fa-barcode"></i> Serial: ${user.serialNumber}</p>
                <p><i class="fas fa-wallet"></i> Balance: $${user.balance.toLocaleString()}</p>
                <p><i class="fas fa-chart-line"></i> Profit: $${user.profit.toLocaleString()}</p>
                <p><i class="fas fa-status"></i> Status: <span class="status-${user.status}">${user.status}</span></p>
            </div>
            <div class="user-actions">
                <button onclick="editUserBalance('${user.id}')" class="btn-edit">
                    <i class="fas fa-dollar-sign"></i> Edit Balance
                </button>
                <button onclick="generateUserPassword('${user.id}')" class="btn-password">
                    <i class="fas fa-key"></i> Generate Password
                </button>
                ${user.role !== 'admin' ? `
                    <button onclick="deleteUser('${user.id}')" class="btn-delete">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function handleAddUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const phone = document.getElementById('newUserPhone').value;
    const initialBalance = parseFloat(document.getElementById('newUserBalance').value) || 0;
    const autoGenerate = document.getElementById('autoGeneratePassword').checked;
    
    let password;
    if (autoGenerate) {
        password = GPTBackend.generatePassword();
    } else {
        password = document.getElementById('newUserPassword').value;
    }
    
    const result = GPTBackend.createUser({
        name,
        email,
        phone,
        password
    });
    
    if (result) {
        // Set initial balance if provided
        if (initialBalance > 0) {
            GPTBackend.updateBalance(result.id, initialBalance, 'credit');
        }
        
        closeModal('addUserModal');
        document.getElementById('addUserForm').reset();
        
        const message = autoGenerate 
            ? `User created successfully!\n\nName: ${name}\nEmail: ${email}\nAccount Number: ${result.accountNumber}\nPassword: ${password}`
            : `User created successfully!\n\nName: ${name}\nEmail: ${email}\nAccount Number: ${result.accountNumber}`;
        
        alert(message);
        addTerminalMessage(`[USER] New user created: ${name} (${result.accountNumber})`, 'success');
        loadUsers();
        loadDashboardStats();
    } else {
        alert('Error creating user. Email may already exist.');
    }
}

function approveUser(userId) {
    if (confirm('Are you sure you want to approve this user?')) {
        const result = GPTBackend.approveUser(userId);
        if (result) {
            addTerminalMessage(`[USER] User approved: ${result.name}`, 'success');
            loadUsers();
            loadDashboardStats();
            showMessage('User approved successfully!', 'success');
        } else {
            showMessage('Error approving user', 'error');
        }
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        GPTBackend.deleteUser(userId);
        addTerminalMessage(`[USER] User deleted: ${userId}`, 'warning');
        loadUsers();
        loadDashboardStats();
        showMessage('User deleted successfully!', 'success');
    }
}

function editUserBalance(userId) {
    const user = GPTBackend.db.getUserById(userId);
    if (!user) return;
    
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editCurrentBalance').value = '$' + user.balance.toLocaleString();
    document.getElementById('editBalanceModal').style.display = 'block';
}

function handleEditBalance(event) {
    event.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const action = document.getElementById('balanceAction').value;
    const amount = parseFloat(document.getElementById('balanceAmount').value);
    
    if (amount <= 0) {
        showMessage('Amount must be greater than 0', 'error');
        return;
    }
    
    const result = GPTBackend.updateBalance(userId, amount, action);
    
    if (result) {
        const user = GPTBackend.db.getUserById(userId);
        closeModal('editBalanceModal');
        document.getElementById('editBalanceForm').reset();
        addTerminalMessage(`[BALANCE] ${action.toUpperCase()} $${amount} to ${user.name}`, 'success');
        loadUsers();
        loadDashboardStats();
        showMessage(`Balance ${action}ed successfully!`, 'success');
    } else {
        showMessage('Error updating balance', 'error');
    }
}

function generateUserPassword(userId) {
    const user = GPTBackend.db.getUserById(userId);
    if (!user) return;
    
    const newPassword = GPTBackend.generatePassword();
    const result = GPTBackend.updateUser(userId, { 
        password: GPTBackend.db.hashPassword(newPassword) 
    });
    
    if (result) {
        alert(`New password generated for ${user.name}:\n\n${newPassword}`);
        addTerminalMessage(`[PASSWORD] New password generated for ${user.name}`, 'success');
        showMessage('Password generated successfully!', 'success');
    } else {
        showMessage('Error generating password', 'error');
    }
}

// Trade Management Functions
function loadTrades() {
    const tradingData = GPTBackend.getTradingData();
    const container = document.getElementById('tradeList');
    
    if (tradingData.activeTrades.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exchange-alt"></i><p>No active trades</p></div>';
        return;
    }
    
    container.innerHTML = tradingData.activeTrades.map(trade => {
        const user = GPTBackend.db.getUserById(trade.userId);
        return `
            <div class="trade-card">
                <div class="trade-header">
                    <span class="trade-symbol">${trade.symbol}</span>
                    <span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
                </div>
                <div class="trade-details">
                    <div class="trade-detail">User: <span>${user ? user.name : 'Unknown'}</span></div>
                    <div class="trade-detail">Account: <span>${user ? user.accountNumber : 'N/A'}</span></div>
                    <div class="trade-detail">Lot Size: <span>${trade.lotSize}</span></div>
                    <div class="trade-detail">Entry: <span>${trade.entryPrice.toFixed(5)}</span></div>
                    <div class="trade-detail">Current: <span>${trade.currentPrice.toFixed(5)}</span></div>
                    <div class="trade-detail">Mode: <span>${trade.mode}</span></div>
                    <div class="trade-detail">Time: <span>${new Date(trade.createdAt).toLocaleString()}</span></div>
                </div>
            </div>
        `;
    }).join('');
}

// Payment Management Functions
function loadPayments() {
    const paymentData = GPTBackend.getPaymentData();
    const container = document.getElementById('paymentList');
    
    if (paymentData.transactions.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>No transactions</p></div>';
        return;
    }
    
    container.innerHTML = paymentData.transactions.map(transaction => {
        const user = GPTBackend.db.getUserById(transaction.userId);
        return `
            <div class="payment-card">
                <div class="payment-info">
                    <h4>${transaction.type.toUpperCase()} - $${transaction.amount.toLocaleString()}</h4>
                    <p><i class="fas fa-user"></i> ${user ? user.name : 'Unknown'}</p>
                    <p><i class="fas fa-id-card"></i> Account: ${user ? user.accountNumber : 'N/A'}</p>
                    <p><i class="fas fa-credit-card"></i> Method: ${transaction.method}</p>
                    <p><i class="fas fa-calendar"></i> ${new Date(transaction.createdAt).toLocaleString()}</p>
                </div>
                <div class="payment-actions">
                    <span class="payment-status ${transaction.status}">${transaction.status}</span>
                    ${transaction.status === 'pending' ? `
                        <button onclick="processTransaction('${transaction.id}')" class="btn-approve">
                            <i class="fas fa-check"></i> Process
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function processTransaction(transactionId) {
    if (confirm('Are you sure you want to process this transaction?')) {
        const result = GPTBackend.processTransaction(transactionId);
        if (result) {
            addTerminalMessage(`[PAYMENT] Transaction processed: ${transactionId}`, 'success');
            loadPayments();
            loadDashboardStats();
            showMessage('Transaction processed successfully!', 'success');
        } else {
            showMessage('Error processing transaction', 'error');
        }
    }
}

// Market Data Updates
function startMarketUpdates() {
    marketUpdateInterval = setInterval(() => {
        GPTBackend.updateMarketData();
        updateTerminalMarketData();
    }, 1000);
}

function updateTerminalMarketData() {
    const marketData = GPTBackend.getMarketData();
    const pair = marketData.currencyPairs[0]; // Show EUR/USD
    
    addTerminalMessage(
        `[MARKET] ${pair.symbol} - Bid: ${pair.bid.toFixed(5)} | Ask: ${pair.ask.toFixed(5)} | Change: ${pair.change.toFixed(2)}%`,
        'info'
    );
}

// Terminal Functions
function addTerminalMessage(message, type = 'info') {
    const terminal = document.getElementById('adminTerminal');
    if (terminal) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = message;
        
        if (type === 'success') {
            line.style.color = '#00ff88';
        } else if (type === 'error') {
            line.style.color = '#ff6b6b';
        } else if (type === 'warning') {
            line.style.color = '#ffcc00';
        }
        
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        
        // Limit terminal lines
        while (terminal.children.length > 100) {
            terminal.removeChild(terminal.firstChild);
        }
    }
}

// Utility Functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

function logout() {
    localStorage.removeItem('gpt_session');
    window.location.href = 'index.html';
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .status-approved {
        color: #00ff88;
    }
    
    .status-pending {
        color: #ffcc00;
    }
    
    .status-rejected {
        color: #ff6b6b;
    }
`;
document.head.appendChild(style);

// Initialize
console.log('Global Pilgrim Trader Admin Dashboard Initialized');
console.log('Owner: Olawale Abdul-Ganiyu');
console.log('Contact: adeganglobal@gmail.com | +2349030277275');