// Global Pilgrim Bank Wallet - Frontend JavaScript
// Owner: Olawale Abdul-Ganiyu
// Contact: adeganglobal@gmail.com, +2349030277275

let currentWallet = null;
let pendingTransaction = null;

// Initialize Wallet
document.addEventListener('DOMContentLoaded', function() {
    loadWallet();
    initializeEventListeners();
    updateDashboard();
    startBalanceUpdates();
});

// Load Wallet Data
function loadWallet() {
    currentWallet = GPBWallet.getWallet();
    updateWalletDisplay();
}

// Update Wallet Display
function updateWalletDisplay() {
    if (!currentWallet) return;

    // Update wallet address displays
    const addressElements = document.querySelectorAll('#walletAddress, #walletAddressText, #settingsWalletAddress');
    addressElements.forEach(el => {
        if (el) {
            el.textContent = currentWallet.address;
        }
    });

    // Update created date
    const createdDate = document.getElementById('walletCreatedDate');
    if (createdDate) {
        createdDate.textContent = new Date(currentWallet.createdAt).toLocaleDateString();
    }

    // Update API key display
    const apiKey = document.getElementById('apiKey');
    if (apiKey) {
        apiKey.textContent = currentWallet.apiKey;
    }

    // Generate QR codes
    generateQRCode(currentWallet.address);
}

// Generate QR Code
function generateQRCode(address) {
    const qrElements = document.querySelectorAll('#qrCode, #receiveQrCode');
    qrElements.forEach(el => {
        if (el) {
            // Using a simple QR code API
            el.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}" alt="Wallet QR Code">`;
        }
    });
}

// Update Dashboard
function updateDashboard() {
    if (!currentWallet) return;

    // Update balances
    const totalBalance = currentWallet.balance.USD + 
                        (currentWallet.balance.BTC * 43000) + 
                        (currentWallet.balance.ETH * 2300) +
                        (currentWallet.balance.NGN / 1550);

    document.getElementById('totalBalance').textContent = '$' + totalBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('cryptoBalance').textContent = currentWallet.balance.BTC.toFixed(8) + ' BTC';
    document.getElementById('cryptoUsd').textContent = '$' + (currentWallet.balance.BTC * 43000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Update transaction count
    const thisMonth = new Date().getMonth();
    const monthlyTransactions = currentWallet.transactions.filter(t => 
        new Date(t.timestamp).getMonth() === thisMonth
    );
    document.getElementById('transactionCount').textContent = monthlyTransactions.length;

    // Update recent transactions
    updateRecentTransactions();
    updateFullTransactionList();

    // Update connection status
    updateConnectionStatus();
}

// Update Recent Transactions
function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    const recentTransactions = currentWallet.transactions.slice(0, 5);

    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentTransactions.map(tx => createTransactionHTML(tx)).join('');
}

// Update Full Transaction List
function updateFullTransactionList() {
    const container = document.getElementById('fullTransactionList');
    if (!container) return;

    const transactions = currentWallet.transactions;

    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = transactions.map(tx => createTransactionHTML(tx)).join('');
}

// Create Transaction HTML
function createTransactionHTML(tx) {
    const typeClass = tx.type.toLowerCase();
    const icon = getTransactionIcon(tx.type);
    const amountPrefix = tx.type === 'Sent' || tx.type === 'Withdrawal' ? '-' : '+';
    const amountColor = tx.type === 'Sent' || tx.type === 'Withdrawal' ? '#ff6b6b' : '#00ff88';

    return `
        <div class="transaction-item ${typeClass}">
            <div class="transaction-info">
                <div class="transaction-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${tx.type}</h4>
                    <p>${tx.recipient || tx.sender || 'Wallet'}</p>
                    <p>${new Date(tx.timestamp).toLocaleString()}</p>
                </div>
            </div>
            <div class="transaction-amount">
                <div class="amount" style="color: ${amountColor}">
                    ${amountPrefix}${tx.amount} ${tx.currency}
                </div>
                <div class="status">${tx.status}</div>
            </div>
        </div>
    `;
}

// Get Transaction Icon
function getTransactionIcon(type) {
    switch(type) {
        case 'Sent':
            return 'fas fa-arrow-up';
        case 'Received':
            return 'fas fa-arrow-down';
        case 'Deposit':
            return 'fas fa-plus-circle';
        case 'Withdrawal':
            return 'fas fa-minus-circle';
        default:
            return 'fas fa-exchange-alt';
    }
}

// Update Connection Status
function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;

    if (currentWallet.connectedToTrading) {
        statusElement.innerHTML = `
            <span class="status-indicator online"></span>
            <span>Connected to Trading Platform</span>
        `;
        statusElement.classList.add('connected');
    } else {
        statusElement.innerHTML = `
            <span class="status-indicator offline"></span>
            <span>Not Connected to Trading Platform</span>
        `;
        statusElement.classList.remove('connected');
    }
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
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
}

// Send Money
function selectSendMethod(method) {
    document.getElementById('sendForm').style.display = 'block';
    document.getElementById('sendFormTitle').textContent = `Send via ${method.charAt(0).toUpperCase() + method.slice(1)}`;
    
    // Update placeholder based on method
    const recipientInput = document.getElementById('recipientAddress');
    switch(method) {
        case 'crypto':
            recipientInput.placeholder = 'Enter wallet address (0x...)';
            break;
        case 'opay':
        case 'palmpay':
        case 'moneypoint':
            recipientInput.placeholder = 'Enter phone number';
            break;
        case 'bank':
            recipientInput.placeholder = 'Enter account number';
            break;
    }
}

function handleSendMoney(event) {
    event.preventDefault();
    
    const recipient = document.getElementById('recipientAddress').value;
    const amount = parseFloat(document.getElementById('sendAmount').value);
    const currency = document.getElementById('sendCurrency').value;
    const note = document.getElementById('sendNote').value;
    
    // Calculate fee
    const fee = GPBWallet.calculateFee(amount, currency, 'blockchain');
    const total = amount + fee;
    
    // Check balance
    if (currentWallet.balance[currency] < total) {
        showMessage('Insufficient balance', 'error');
        return;
    }
    
    // Store pending transaction
    pendingTransaction = {
        type: 'Sent',
        recipient: recipient,
        amount: amount,
        currency: currency,
        fee: fee,
        total: total,
        note: note
    };
    
    // Show confirmation modal
    document.getElementById('confirmType').textContent = 'Send';
    document.getElementById('confirmTo').textContent = recipient.substring(0, 10) + '...';
    document.getElementById('confirmAmount').textContent = `${amount} ${currency}`;
    document.getElementById('confirmFee').textContent = `${fee} ${currency}`;
    document.getElementById('confirmTotal').textContent = `${total} ${currency}`;
    
    document.getElementById('confirmModal').style.display = 'block';
}

function confirmTransaction() {
    if (!pendingTransaction) return;
    
    // Deduct from balance
    GPBWallet.updateBalance(pendingTransaction.currency, pendingTransaction.total, 'debit');
    
    // Add transaction
    GPBWallet.addTransaction(pendingTransaction);
    
    // Process transaction based on recipient type
    processTransaction(pendingTransaction);
    
    // Close modal and reset
    closeModal('confirmModal');
    document.getElementById('transferForm').reset();
    document.getElementById('sendForm').style.display = 'none';
    
    // Update display
    loadWallet();
    updateDashboard();
    
    showMessage('Transaction submitted successfully!', 'success');
}

async function processTransaction(transaction) {
    // Simulate processing
    setTimeout(() => {
        const txId = 'TXN' + Date.now();
        GPBWallet.updateTransactionStatus(txId, 'completed');
        loadWallet();
    }, 3000);
}

// Receive Money
function selectReceiveMethod(method) {
    document.getElementById('receiveDetails').style.display = 'block';
    document.getElementById('receiveDetailsTitle').textContent = `Receive via ${method.charAt(0).toUpperCase() + method.slice(1)}`;
    
    // Update address display based on method
    const addressText = document.getElementById('receiveAddressText');
    if (method === 'crypto') {
        addressText.textContent = currentWallet.address;
    } else {
        addressText.textContent = currentWallet.address; // For demo, using same address
    }
}

// Copy Address
function copyAddress() {
    navigator.clipboard.writeText(currentWallet.address);
    showMessage('Address copied to clipboard!', 'success');
}

function copyReceiveAddress() {
    const address = document.getElementById('receiveAddressText').textContent;
    navigator.clipboard.writeText(address);
    showMessage('Address copied to clipboard!', 'success');
}

function copySettingsAddress() {
    navigator.clipboard.writeText(currentWallet.address);
    showMessage('Address copied to clipboard!', 'success');
}

// Share Address
function shareAddress() {
    if (navigator.share) {
        navigator.share({
            title: 'My Wallet Address',
            text: currentWallet.address
        });
    } else {
        copyAddress();
    }
}

// Download QR
function downloadQR() {
    const qrImg = document.querySelector('#receiveQrCode img');
    if (qrImg) {
        const link = document.createElement('a');
        link.href = qrImg.src;
        link.download = 'wallet-qr-code.png';
        link.click();
    }
}

// Deposit
function showDepositModal() {
    document.getElementById('depositModal').style.display = 'block';
}

function handleDeposit(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const method = document.getElementById('depositMethod').value;
    
    if (method === 'trading') {
        // Withdraw from trading platform
        GPBWallet.withdrawFromTrading(amount).then(result => {
            if (result.success) {
                GPBWallet.updateBalance('USD', amount, 'credit');
                GPBWallet.addTransaction({
                    type: 'Deposit',
                    sender: 'Trading Platform',
                    amount: amount,
                    currency: 'USD',
                    note: 'Transfer from trading platform'
                });
                
                closeModal('depositModal');
                loadWallet();
                updateDashboard();
                showMessage(`$${amount} deposited from trading platform!`, 'success');
            }
        });
    } else {
        // Simulate other deposit methods
        GPBWallet.updateBalance('USD', amount, 'credit');
        GPBWallet.addTransaction({
            type: 'Deposit',
            sender: method,
            amount: amount,
            currency: 'USD',
            note: `Deposit via ${method}`
        });
        
        closeModal('depositModal');
        loadWallet();
        updateDashboard();
        showMessage(`$${amount} deposited successfully!`, 'success');
    }
}

// Withdraw
function showWithdrawModal() {
    document.getElementById('withdrawModal').style.display = 'block';
}

function handleWithdraw(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    
    if (currentWallet.balance.USD < amount) {
        showMessage('Insufficient balance', 'error');
        return;
    }
    
    if (method === 'trading') {
        // Deposit to trading platform
        GPBWallet.depositToTrading(amount).then(result => {
            if (result.success) {
                GPBWallet.updateBalance('USD', amount, 'debit');
                GPBWallet.addTransaction({
                    type: 'Withdrawal',
                    recipient: 'Trading Platform',
                    amount: amount,
                    currency: 'USD',
                    note: 'Transfer to trading platform'
                });
                
                closeModal('withdrawModal');
                loadWallet();
                updateDashboard();
                showMessage(`$${amount} withdrawn to trading platform!`, 'success');
            }
        });
    } else {
        // Simulate other withdrawal methods
        GPBWallet.updateBalance('USD', amount, 'debit');
        GPBWallet.addTransaction({
            type: 'Withdrawal',
            recipient: method,
            amount: amount,
            currency: 'USD',
            note: `Withdrawal via ${method}`
        });
        
        closeModal('withdrawModal');
        loadWallet();
        updateDashboard();
        showMessage(`$${amount} withdrawn successfully!`, 'success');
    }
}

// Connect to Trading Platform
function connectToTradingPlatform() {
    const platformUrl = prompt('Enter Trading Platform URL:');
    if (!platformUrl) return;
    
    const apiKey = prompt('Enter API Key:');
    if (!apiKey) return;
    
    GPBWallet.connectToTrading(platformUrl, apiKey).then(result => {
        if (result.success) {
            GPBWallet.updateWallet({
                connectedToTrading: true,
                tradingPlatformUrl: platformUrl
            });
            
            loadWallet();
            updateDashboard();
            showMessage('Connected to trading platform successfully!', 'success');
        }
    });
}

// Filter Transactions
function filterTransactions() {
    const typeFilter = document.getElementById('filterType').value;
    const currencyFilter = document.getElementById('filterCurrency').value;
    
    let filtered = currentWallet.transactions;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(tx => 
            tx.type.toLowerCase() === typeFilter
        );
    }
    
    if (currencyFilter !== 'all') {
        filtered = filtered.filter(tx => 
            tx.currency === currencyFilter
        );
    }
    
    const container = document.getElementById('fullTransactionList');
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found</p>
            </div>
        `;
    } else {
        container.innerHTML = filtered.map(tx => createTransactionHTML(tx)).join('');
    }
}

// Settings Functions
function showApiKey() {
    const apiKeyElement = document.getElementById('apiKey');
    if (apiKeyElement.textContent.includes('•••')) {
        apiKeyElement.textContent = currentWallet.apiKey;
    } else {
        apiKeyElement.textContent = '••••••••••••';
    }
}

function enable2FA() {
    alert('Two-factor authentication setup coming soon!');
}

function changePIN() {
    const newPin = prompt('Enter new PIN:');
    if (newPin && newPin.length === 4) {
        showMessage('PIN changed successfully!', 'success');
    } else {
        showMessage('Invalid PIN. Must be 4 digits.', 'error');
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
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Start Balance Updates
function startBalanceUpdates() {
    setInterval(() => {
        // Simulate balance updates
        if (currentWallet && currentWallet.connectedToTrading) {
            GPBWallet.getTradingBalance().then(result => {
                if (result.success) {
                    // Update display with trading balance
                    console.log('Trading balance:', result.balance);
                }
            });
        }
    }, 30000); // Update every 30 seconds
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });

    // Withdraw method change
    document.getElementById('withdrawMethod').addEventListener('change', function() {
        const addressGroup = document.getElementById('withdrawAddressGroup');
        if (this.value === 'crypto' || this.value === 'bank') {
            addressGroup.style.display = 'block';
        } else {
            addressGroup.style.display = 'none';
        }
    });

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

// Initialize
console.log('Global Pilgrim Bank Wallet Frontend Initialized');
console.log('Owner: Olawale Abdul-Ganiyu');
console.log('Contact: adeganglobal@gmail.com | +2349030277275');