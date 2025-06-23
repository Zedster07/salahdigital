import React, { useState, useEffect } from 'react';
import { Platform, PlatformCreditMovement } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { CreditMovementHistory } from './CreditMovementHistory';
import { 
  Plus, 
  Minus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  History,
  ArrowLeft
} from 'lucide-react';

interface CreditManagementProps {
  platform: Platform;
  onBack: () => void;
}

interface CreditFormData {
  amount: number;
  description: string;
  referenceType: string;
  referenceId: string;
}

export function CreditManagement({ platform, onBack }: CreditManagementProps) {
  const { state, dispatch } = useApp();
  const { platformCreditMovements } = state;
  
  const [activeTab, setActiveTab] = useState<'add' | 'deduct' | 'history'>('add');
  const [formData, setFormData] = useState<CreditFormData>({
    amount: 0,
    description: '',
    referenceType: 'manual',
    referenceId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Filter movements for this platform
  const platformMovements = platformCreditMovements
    .filter(movement => movement.platformId === platform.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate recent activity stats
  const recentStats = {
    totalAdded: platformMovements
      .filter(m => m.type === 'credit_added' && new Date(m.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.amount, 0),
    totalDeducted: platformMovements
      .filter(m => m.type === 'credit_deducted' && new Date(m.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, m) => sum + m.amount, 0),
    transactionCount: platformMovements
      .filter(m => new Date(m.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .length
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (activeTab === 'deduct' && formData.amount > platform.creditBalance) {
      newErrors.amount = 'Amount cannot exceed current balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const movementType = activeTab === 'add' ? 'credit_added' : 'credit_deducted';
      const newBalance = activeTab === 'add' 
        ? platform.creditBalance + formData.amount
        : platform.creditBalance - formData.amount;

      // Create new credit movement
      const newMovement: PlatformCreditMovement = {
        id: `movement-${Date.now()}`,
        platformId: platform.id,
        type: movementType,
        amount: formData.amount,
        previousBalance: platform.creditBalance,
        newBalance,
        reference: formData.referenceId || null,
        description: `${formData.referenceType}: ${formData.description}`,
        createdBy: 'current-user', // This would come from auth context
        createdAt: new Date().toISOString()
      };

      // Update platform balance
      const updatedPlatform: Platform = {
        ...platform,
        creditBalance: newBalance,
        updatedAt: new Date().toISOString()
      };

      // Dispatch updates
      dispatch({ type: 'ADD_PLATFORM_CREDIT_MOVEMENT', payload: newMovement });
      dispatch({ type: 'UPDATE_PLATFORM', payload: updatedPlatform });

      // Reset form
      setFormData({
        amount: 0,
        description: '',
        referenceType: 'manual',
        referenceId: ''
      });

      setSuccessMessage(`Successfully ${activeTab === 'add' ? 'added' : 'deducted'} ${formData.amount} DZD`);
      
      // Switch to history tab to show the new movement
      setTimeout(() => {
        setActiveTab('history');
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Failed to process credit transaction:', error);
      setErrors({ submit: 'Failed to process transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getBalanceColor = () => {
    if (platform.creditBalance < 50) return 'text-red-600 dark:text-red-400';
    if (platform.creditBalance < 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const renderCreditForm = () => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <div className={`p-2 rounded-lg mr-4 ${
          activeTab === 'add' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
        }`}>
          {activeTab === 'add' ? 
            <Plus className={`h-6 w-6 ${activeTab === 'add' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} /> :
            <Minus className="h-6 w-6 text-red-600 dark:text-red-400" />
          }
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {activeTab === 'add' ? 'Add Credits' : 'Deduct Credits'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === 'add' ? 'Add credits to platform balance' : 'Deduct credits from platform balance'}
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (DZD) *
          </label>
          <input
            type="number"
            id="amount"
            min="0.01"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.amount ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.amount}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="referenceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reference Type
          </label>
          <select
            id="referenceType"
            value={formData.referenceType}
            onChange={(e) => setFormData(prev => ({ ...prev, referenceType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="manual">Manual</option>
            <option value="deposit">Deposit</option>
            <option value="refund">Refund</option>
            <option value="adjustment">Adjustment</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        <div>
          <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reference ID
          </label>
          <input
            type="text"
            id="referenceId"
            value={formData.referenceId}
            onChange={(e) => setFormData(prev => ({ ...prev, referenceId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Optional reference ID"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
              errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Enter description for this transaction"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.description}
            </p>
          )}
        </div>

        {errors.submit && (
          <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-800 dark:text-red-200">{errors.submit}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium transition-colors ${
            activeTab === 'add' 
              ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
              : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
          } disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            activeTab === 'add' ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? 'Processing...' : (activeTab === 'add' ? 'Add Credits' : 'Deduct Credits')}
        </button>
      </form>
    </div>
  );

  return (
    <div className="credit-management space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Platform
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Credit Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{platform.name}</p>
          </div>
        </div>
      </div>

      {/* Current Balance Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Balance</h3>
            <p className={`text-3xl font-bold ${getBalanceColor()}`}>
              {formatCurrency(platform.creditBalance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 days</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  +{formatCurrency(recentStats.totalAdded)}
                </span>
              </div>
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  -{formatCurrency(recentStats.totalDeducted)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('add')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'add'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Plus className="h-4 w-4 inline mr-2" />
            Add Credits
          </button>
          <button
            onClick={() => setActiveTab('deduct')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deduct'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Minus className="h-4 w-4 inline mr-2" />
            Deduct Credits
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Transaction History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'history' ? (
        <CreditMovementHistory movements={platformMovements} />
      ) : (
        renderCreditForm()
      )}
    </div>
  );
}
