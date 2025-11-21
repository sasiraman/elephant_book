import { useState, useEffect } from 'react';
import { ledgerAPI, accountsAPI, categoriesAPI } from '../api';
import { format } from 'date-fns';

export default function Ledger() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    account_id: '',
    category_id: '',
    start_date: '',
    end_date: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    account_id: '',
    category_id: '',
    start_date: '',
    end_date: '',
  });
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    category_id: '',
    narration: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
  });
  const [transferData, setTransferData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    narration: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
  });

  useEffect(() => {
    loadData();
    loadTransactions();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [appliedFilters]);

  const loadData = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setAccounts(accountsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (appliedFilters.account_id) params.account_id = appliedFilters.account_id;
      if (appliedFilters.category_id) params.category_id = appliedFilters.category_id;
      if (appliedFilters.start_date) params.start_date = appliedFilters.start_date;
      if (appliedFilters.end_date) params.end_date = appliedFilters.end_date;

      const response = await ledgerAPI.getAll(params);
      setTransactions(response.data);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setShowFilters(false);
    loadTransactions();
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      account_id: '',
      category_id: '',
      start_date: '',
      end_date: '',
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setShowFilters(false);
  };

  const hasActiveFilters = () => {
    return appliedFilters.account_id || appliedFilters.category_id || appliedFilters.start_date || appliedFilters.end_date;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        ...formData,
        account_id: parseInt(formData.account_id),
        amount: parseFloat(formData.amount),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        transaction_date: new Date(formData.transaction_date).toISOString(),
      };

      if (editingTransaction) {
        await ledgerAPI.update(editingTransaction.id, data);
      } else {
        await ledgerAPI.create(data);
      }
      setShowModal(false);
      setEditingTransaction(null);
      setFormData({
        account_id: '',
        amount: '',
        category_id: '',
        narration: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      });
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        ...transferData,
        from_account_id: parseInt(transferData.from_account_id),
        to_account_id: parseInt(transferData.to_account_id),
        amount: parseFloat(transferData.amount),
        transaction_date: new Date(transferData.transaction_date).toISOString(),
      };

      await ledgerAPI.transfer(data);
      setShowTransferModal(false);
      setTransferData({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        narration: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      });
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.detail || 'Transfer failed');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      account_id: transaction.account_id.toString(),
      amount: Math.abs(parseFloat(transaction.amount)).toString(),
      category_id: transaction.category_id ? transaction.category_id.toString() : '',
      narration: transaction.narration || '',
      transaction_date: format(new Date(transaction.transaction_date), 'yyyy-MM-dd\'T\'HH:mm'),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await ledgerAPI.delete(id);
      loadTransactions();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  const openModal = () => {
    setEditingTransaction(null);
    setFormData({
      account_id: '',
      amount: '',
      category_id: '',
      narration: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    });
    setShowModal(true);
  };

  const openTransferModal = () => {
    setTransferData({
      from_account_id: '',
      to_account_id: '',
      amount: '',
      narration: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    });
    setShowTransferModal(true);
  };

  const getAccountName = (accountId) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.account_name : 'Unknown';
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Transfer';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (loading && transactions.length === 0) {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your financial transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all transform hover:scale-105 active:scale-95 font-medium text-base flex items-center justify-center gap-2 ${
                showFilters || hasActiveFilters()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters() && (
                <span className="bg-white text-blue-600 rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                  !
                </span>
              )}
            </button>
            <button
              onClick={openTransferModal}
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transition-all transform hover:scale-105 active:scale-95 font-medium text-base"
            >
              💸 Transfer
            </button>
            <button
              onClick={openModal}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all transform hover:scale-105 active:scale-95 font-medium text-base"
            >
              + Add Transaction
            </button>
          </div>
        </div>
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

      {/* Active Filters Badge */}
      {hasActiveFilters() && !showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {appliedFilters.account_id && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Account: {accounts.find(a => a.id === parseInt(appliedFilters.account_id))?.account_name}
              <button
                onClick={() => {
                  const newFilters = { ...appliedFilters, account_id: '' };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                }}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          {appliedFilters.category_id && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Category: {categories.find(c => c.id === parseInt(appliedFilters.category_id))?.name}
              <button
                onClick={() => {
                  const newFilters = { ...appliedFilters, category_id: '' };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                }}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          {appliedFilters.start_date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              From: {appliedFilters.start_date}
              <button
                onClick={() => {
                  const newFilters = { ...appliedFilters, start_date: '' };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                }}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          {appliedFilters.end_date && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              To: {appliedFilters.end_date}
              <button
                onClick={() => {
                  const newFilters = { ...appliedFilters, end_date: '' };
                  setAppliedFilters(newFilters);
                  setFilters(newFilters);
                }}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
              <select
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.account_id}
                onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
              >
                <option value="">All Accounts</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.category_id}
                onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleClearFilters}
              className="px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all font-medium text-base"
            >
              Clear Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-medium text-base shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-base sm:text-lg">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {getAccountName(transaction.account_id)}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {getCategoryName(transaction.category_id)}
                      </span>
                    </div>
                    {transaction.narration && (
                      <p className="text-sm text-gray-600 mb-2">{transaction.narration}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {format(new Date(transaction.transaction_date), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                    <p className={`text-2xl sm:text-3xl font-bold ${
                      parseFloat(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${parseFloat(transaction.amount).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-6 pb-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                    {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
                      <select
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                        value={formData.account_id}
                        onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                      >
                        <option value="">Select Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                      <select
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Narration</label>
                      <input
                        type="text"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        placeholder="Transaction description"
                        value={formData.narration}
                        onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                      <input
                        type="datetime-local"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    {editingTransaction ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setShowTransferModal(false)}>
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleTransfer}>
                <div className="bg-white px-4 pt-6 pb-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">💸 Transfer Money</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Account</label>
                      <select
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base bg-white"
                        value={transferData.from_account_id}
                        onChange={(e) => setTransferData({ ...transferData, from_account_id: e.target.value })}
                      >
                        <option value="">Select Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To Account</label>
                      <select
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base bg-white"
                        value={transferData.to_account_id}
                        onChange={(e) => setTransferData({ ...transferData, to_account_id: e.target.value })}
                      >
                        <option value="">Select Account</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                        placeholder="0.00"
                        value={transferData.amount}
                        onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Narration</label>
                      <input
                        type="text"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                        placeholder="Transfer description"
                        value={transferData.narration}
                        onChange={(e) => setTransferData({ ...transferData, narration: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                      <input
                        type="datetime-local"
                        required
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                        value={transferData.transaction_date}
                        onChange={(e) => setTransferData({ ...transferData, transaction_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-base font-medium text-white hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                  >
                    Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
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


