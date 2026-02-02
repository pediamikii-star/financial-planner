// services/withdrawService.js

// Simulasi database/local storage
const WITHDRAWAL_HISTORY_KEY = 'asset_withdrawal_history';
const CREATORS_KEY = 'asset_creators';
const ACCOUNTS_KEY = 'asset_accounts';
const TRANSACTIONS_KEY = 'asset_transactions';

/* ======================
   HELPER FUNCTIONS
====================== */

// Get data from localStorage
const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
};

// Save data to localStorage
const saveStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Format timestamp
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* ======================
   WITHDRAWAL FUNCTIONS
====================== */

export const withdrawService = {
  
  // Process a withdrawal
  async processWithdrawal(withdrawData) {
    try {
      console.log('🔵 Processing withdrawal:', withdrawData);
      
      const {
        creatorId,
        creatorName,
        amount,
        accountId,
        timestamp = new Date().toISOString()
      } = withdrawData;
      
      // 1. VALIDATION
      if (!creatorId || !amount || !accountId) {
        throw new Error('Missing required withdrawal data');
      }
      
      if (amount <= 0) {
        throw new Error('Withdrawal amount must be greater than 0');
      }
      
      // 2. GET CURRENT DATA
      const creators = getStorageData(CREATORS_KEY);
      const accounts = getStorageData(ACCOUNTS_KEY);
      const transactions = getStorageData(TRANSACTIONS_KEY);
      const withdrawalHistory = getStorageData(WITHDRAWAL_HISTORY_KEY);
      
      // 3. FIND CREATOR
      const creatorIndex = creators.findIndex(c => c.id === creatorId);
      if (creatorIndex === -1) {
        throw new Error('Creator not found');
      }
      
      const creator = creators[creatorIndex];
      
      // 4. CHECK PLATFORM BALANCE
      if (creator.platformBalance < amount) {
        throw new Error('Insufficient platform balance');
      }
      
      // 5. FIND ACCOUNT
      const account = accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Destination account not found');
      }
      
      // Check if account is bank or digital bank
      if (account.type !== 'bank' && account.type !== 'digital_bank') {
        throw new Error('Selected account is not a bank account');
      }
      
      // 6. CREATE TRANSACTION RECORD
      const transactionId = generateId();
      const transaction = {
        id: transactionId,
        type: 'withdrawal',
        creatorId,
        creatorName,
        amount,
        from: 'Platform Balance',
        to: `${account.bankName} - ${account.accountNumber}`,
        accountId,
        status: 'completed',
        timestamp,
        notes: `Withdrawal from ${creatorName} to ${account.bankName}`
      };
      
      // 7. UPDATE CREATOR BALANCES
      const updatedCreator = {
        ...creator,
        platformBalance: creator.platformBalance - amount,
        totalBalance: creator.totalBalance, // Total balance remains same (just moved)
        lastWithdrawal: timestamp,
        updatedAt: timestamp
      };
      
      // 8. UPDATE ACCOUNT BALANCE (optional - if you track account balance)
      const accountIndex = accounts.findIndex(acc => acc.id === accountId);
      if (accountIndex !== -1) {
        accounts[accountIndex] = {
          ...accounts[accountIndex],
          balance: (accounts[accountIndex].balance || 0) + amount,
          updatedAt: timestamp
        };
      }
      
      // 9. ADD TO WITHDRAWAL HISTORY
      const withdrawalRecord = {
        id: generateId(),
        transactionId,
        creatorId,
        creatorName,
        amount,
        accountId,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        status: 'completed',
        timestamp,
        processedAt: new Date().toISOString()
      };
      
      // 10. SAVE ALL UPDATES
      creators[creatorIndex] = updatedCreator;
      transactions.push(transaction);
      withdrawalHistory.push(withdrawalRecord);
      
      // Save to localStorage
      saveStorageData(CREATORS_KEY, creators);
      saveStorageData(ACCOUNTS_KEY, accounts);
      saveStorageData(TRANSACTIONS_KEY, transactions);
      saveStorageData(WITHDRAWAL_HISTORY_KEY, withdrawalHistory);
      
      console.log('✅ Withdrawal processed successfully:', withdrawalRecord);
      
      // 11. RETURN SUCCESS RESPONSE
      return {
        success: true,
        message: `Successfully withdrew Rp ${amount.toLocaleString('id-ID')} from ${creatorName}`,
        data: {
          withdrawalId: withdrawalRecord.id,
          transactionId,
          amount,
          newPlatformBalance: updatedCreator.platformBalance,
          destination: `${account.bankName} (${account.accountNumber})`,
          timestamp: formatTimestamp(timestamp)
        }
      };
      
    } catch (error) {
      console.error('❌ Withdrawal error:', error);
      
      // Log failed transaction
      const failedTransaction = {
        id: generateId(),
        type: 'withdrawal',
        creatorId: withdrawData.creatorId,
        creatorName: withdrawData.creatorName,
        amount: withdrawData.amount,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      const transactions = getStorageData(TRANSACTIONS_KEY);
      transactions.push(failedTransaction);
      saveStorageData(TRANSACTIONS_KEY, transactions);
      
      return {
        success: false,
        message: error.message || 'Withdrawal failed',
        error: error.message
      };
    }
  },
  
  // Get withdrawal history for a creator
  async getWithdrawalHistory(creatorId) {
    try {
      const withdrawalHistory = getStorageData(WITHDRAWAL_HISTORY_KEY);
      const creatorHistory = withdrawalHistory
        .filter(record => record.creatorId === creatorId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return {
        success: true,
        data: creatorHistory.map(record => ({
          ...record,
          formattedAmount: `Rp ${record.amount.toLocaleString('id-ID')}`,
          formattedDate: formatTimestamp(record.timestamp),
          shortAccount: `•••• ${record.accountNumber?.slice(-4) || ''}`
        }))
      };
    } catch (error) {
      console.error('Error getting withdrawal history:', error);
      return {
        success: false,
        message: 'Failed to load withdrawal history',
        data: []
      };
    }
  },
  
  // Get all withdrawal history
  async getAllWithdrawals() {
    try {
      const withdrawalHistory = getStorageData(WITHDRAWAL_HISTORY_KEY);
      
      return {
        success: true,
        data: withdrawalHistory
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .map(record => ({
            ...record,
            formattedAmount: `Rp ${record.amount.toLocaleString('id-ID')}`,
            formattedDate: formatTimestamp(record.timestamp)
          }))
      };
    } catch (error) {
      console.error('Error getting all withdrawals:', error);
      return {
        success: false,
        message: 'Failed to load withdrawals',
        data: []
      };
    }
  },
  
  // Get bank and digital bank accounts
  async getBankAccounts() {
    try {
      const accounts = getStorageData(ACCOUNTS_KEY);
      const bankAccounts = accounts.filter(acc => 
        acc.type === 'bank' || acc.type === 'digital_bank'
      );
      
      return {
        success: true,
        data: bankAccounts.map(account => ({
          ...account,
          displayName: `${account.bankName} •••• ${account.accountNumber?.slice(-4) || ''}`,
          formattedBalance: account.balance ? `Rp ${account.balance.toLocaleString('id-ID')}` : 'Rp 0'
        }))
      };
    } catch (error) {
      console.error('Error getting bank accounts:', error);
      return {
        success: false,
        message: 'Failed to load bank accounts',
        data: []
      };
    }
  },
  
  // Get creator by ID
  async getCreator(creatorId) {
    try {
      const creators = getStorageData(CREATORS_KEY);
      const creator = creators.find(c => c.id === creatorId);
      
      if (!creator) {
        throw new Error('Creator not found');
      }
      
      return {
        success: true,
        data: {
          ...creator,
          formattedPlatformBalance: `Rp ${creator.platformBalance?.toLocaleString('id-ID') || '0'}`,
          formattedTotalBalance: `Rp ${creator.totalBalance?.toLocaleString('id-ID') || '0'}`
        }
      };
    } catch (error) {
      console.error('Error getting creator:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  },
  
  // Add a withdrawal record (for testing or manual entry)
  async addWithdrawalRecord(record) {
    try {
      const withdrawalHistory = getStorageData(WITHDRAWAL_HISTORY_KEY);
      
      const newRecord = {
        id: generateId(),
        ...record,
        timestamp: record.timestamp || new Date().toISOString(),
        status: record.status || 'completed'
      };
      
      withdrawalHistory.push(newRecord);
      saveStorageData(WITHDRAWAL_HISTORY_KEY, withdrawalHistory);
      
      return {
        success: true,
        message: 'Withdrawal record added',
        data: newRecord
      };
    } catch (error) {
      console.error('Error adding withdrawal record:', error);
      return {
        success: false,
        message: 'Failed to add withdrawal record'
      };
    }
  },
  
  // Get withdrawal statistics
  async getWithdrawalStats(creatorId = null) {
    try {
      const withdrawalHistory = getStorageData(WITHDRAWAL_HISTORY_KEY);
      const creators = getStorageData(CREATORS_KEY);
      
      let filteredHistory = withdrawalHistory;
      if (creatorId) {
        filteredHistory = withdrawalHistory.filter(record => record.creatorId === creatorId);
      }
      
      const completed = filteredHistory.filter(record => record.status === 'completed');
      const failed = filteredHistory.filter(record => record.status === 'failed');
      const pending = filteredHistory.filter(record => record.status === 'pending');
      
      const totalAmount = completed.reduce((sum, record) => sum + record.amount, 0);
      
      // Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentWithdrawals = completed.filter(record => 
        new Date(record.timestamp) > thirtyDaysAgo
      );
      
      const recentAmount = recentWithdrawals.reduce((sum, record) => sum + record.amount, 0);
      
      return {
        success: true,
        data: {
          totalWithdrawals: completed.length,
          totalAmount,
          formattedTotalAmount: `Rp ${totalAmount.toLocaleString('id-ID')}`,
          failedCount: failed.length,
          pendingCount: pending.length,
          recent30Days: {
            count: recentWithdrawals.length,
            amount: recentAmount,
            formattedAmount: `Rp ${recentAmount.toLocaleString('id-ID')}`
          },
          averageAmount: completed.length > 0 ? totalAmount / completed.length : 0
        }
      };
    } catch (error) {
      console.error('Error getting withdrawal stats:', error);
      return {
        success: false,
        message: 'Failed to load withdrawal statistics'
      };
    }
  },
  
  // Initialize sample data (for testing/demo)
  async initSampleData() {
    try {
      // Sample creators with platform balances
      const sampleCreators = [
        {
          id: 'creator_1',
          name: 'John Doe',
          platformBalance: 5000000,
          totalBalance: 15000000,
          type: 'youtube',
          createdAt: new Date().toISOString()
        },
        {
          id: 'creator_2', 
          name: 'Jane Smith',
          platformBalance: 7500000,
          totalBalance: 22000000,
          type: 'instagram',
          createdAt: new Date().toISOString()
        },
        {
          id: 'creator_3',
          name: 'Tech Reviews',
          platformBalance: 12000000,
          totalBalance: 35000000,
          type: 'youtube',
          createdAt: new Date().toISOString()
        }
      ];
      
      // Sample bank accounts
      const sampleAccounts = [
        {
          id: 'acc_1',
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountHolder: 'John Doe',
          type: 'bank',
          balance: 5000000,
          createdAt: new Date().toISOString()
        },
        {
          id: 'acc_2',
          bankName: 'Mandiri',
          accountNumber: '0987654321',
          accountHolder: 'Jane Smith',
          type: 'bank',
          balance: 10000000,
          createdAt: new Date().toISOString()
        },
        {
          id: 'acc_3',
          bankName: 'GoPay',
          accountNumber: '081234567890',
          accountHolder: 'John Doe',
          type: 'digital_bank',
          balance: 2500000,
          createdAt: new Date().toISOString()
        },
        {
          id: 'acc_4',
          bankName: 'OVO',
          accountNumber: '081987654321',
          accountHolder: 'Jane Smith',
          type: 'digital_bank',
          balance: 1500000,
          createdAt: new Date().toISOString()
        }
      ];
      
      // Save sample data
      saveStorageData(CREATORS_KEY, sampleCreators);
      saveStorageData(ACCOUNTS_KEY, sampleAccounts);
      saveStorageData(TRANSACTIONS_KEY, []);
      saveStorageData(WITHDRAWAL_HISTORY_KEY, []);
      
      return {
        success: true,
        message: 'Sample data initialized successfully'
      };
    } catch (error) {
      console.error('Error initializing sample data:', error);
      return {
        success: false,
        message: 'Failed to initialize sample data'
      };
    }
  },
  
  // Clear all withdrawal data (for testing)
  async clearAllData() {
    try {
      localStorage.removeItem(WITHDRAWAL_HISTORY_KEY);
      localStorage.removeItem(TRANSACTIONS_KEY);
      return {
        success: true,
        message: 'Withdrawal data cleared'
      };
    } catch (error) {
      console.error('Error clearing data:', error);
      return {
        success: false,
        message: 'Failed to clear data'
      };
    }
  }
};

export default withdrawService;