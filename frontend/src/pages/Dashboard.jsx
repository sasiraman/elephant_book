import { useState, useEffect } from 'react';
import { accountsAPI, ledgerAPI, categoriesAPI } from '../api';
import { format } from 'date-fns';

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactionFormData, setTransactionFormData] = useState({
    account_id: '',
    amount: '',
    category_id: '',
    narration: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
  });

  useEffect(() => {
    loadAccounts();
    loadCategories();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await accountsAPI.getAll();
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      // Silently fail for categories
    }
  };

  const handleOpenTransaction = (account) => {
    setSelectedAccount(account);
    setTransactionFormData({
      account_id: account.id.toString(),
      amount: '',
      category_id: '',
      narration: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    });
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        ...transactionFormData,
        account_id: parseInt(transactionFormData.account_id),
        amount: parseFloat(transactionFormData.amount),
        category_id: transactionFormData.category_id ? parseInt(transactionFormData.category_id) : null,
        transaction_date: new Date(transactionFormData.transaction_date).toISOString(),
      };

      await ledgerAPI.create(data);
      setShowTransactionModal(false);
      setSelectedAccount(null);
      setTransactionFormData({
        account_id: '',
        amount: '',
        category_id: '',
        narration: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      });
      loadAccounts(); // Refresh accounts to update balances
    } catch (err) {
      setError(err.response?.data?.detail || 'Transaction failed');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Overview of your financial accounts
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-xl p-3 sm:p-4">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 sm:ml-6">
                  <p className="text-sm sm:text-base font-medium text-white text-opacity-90">Total Balance</p>
                  <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    ${totalBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Accounts</h2>
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-base sm:text-lg">No accounts yet.</p>
            <p className="text-gray-400 text-sm mt-2">Create your first account to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-100">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{account.account_name}</h3>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-2">
                        {account.account_type}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Balance</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${
                      parseFloat(account.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${parseFloat(account.balance || 0).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenTransaction(account)}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium text-sm shadow-md"
                  >
                    💰 Add Transaction
                  </button>
                  <p className="text-xs text-gray-400 mt-4">
                    Created {format(new Date(account.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && selectedAccount && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setShowTransactionModal(false)}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleTransactionSubmit}>
                <div className="bg-white px-4 pt-6 pb-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Add Transaction</h3>
                  <p className="text-sm text-gray-600 mb-6">Account: <span className="font-semibold">{selectedAccount.account_name}</span></p>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                      <select
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                        value={transactionFormData.category_id}
                        onChange={(e) => setTransactionFormData({ ...transactionFormData, category_id: e.target.value })}
                      >
                        <option value="">None (Transfer)</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="0.00"
                        value={transactionFormData.amount}
                        onChange={(e) => setTransactionFormData({ ...transactionFormData, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Narration</label>
                      <input
                        type="text"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Transaction description"
                        value={transactionFormData.narration}
                        onChange={(e) => setTransactionFormData({ ...transactionFormData, narration: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                      <input
                        type="datetime-local"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        value={transactionFormData.transaction_date}
                        onChange={(e) => setTransactionFormData({ ...transactionFormData, transaction_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Create Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransactionModal(false);
                      setSelectedAccount(null);
                    }}
                    className="w-full sm:w-auto mt-3 sm:mt-0 inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


