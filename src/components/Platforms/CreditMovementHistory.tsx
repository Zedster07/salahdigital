import React, { useState, useMemo } from 'react';
import { PlatformCreditMovement } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Filter,
  Download,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CreditMovementHistoryProps {
  movements: PlatformCreditMovement[];
}

type FilterType = 'all' | 'credit_added' | 'credit_deducted' | 'sale_deduction' | 'adjustment';

export function CreditMovementHistory({ movements }: CreditMovementHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter and search movements
  const filteredMovements = useMemo(() => {
    let filtered = movements;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(movement => movement.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(movement => 
        movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(movement => 
        new Date(movement.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(movement => 
        new Date(movement.createdAt) <= new Date(dateRange.end)
      );
    }

    return filtered;
  }, [movements, filterType, searchTerm, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'credit_added':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'credit_deducted':
      case 'sale_deduction':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'credit_added':
        return 'Credit Added';
      case 'credit_deducted':
        return 'Credit Deducted';
      case 'sale_deduction':
        return 'Sale Transaction';
      case 'adjustment':
        return 'Balance Adjustment';
      default:
        return type;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'credit_added':
        return 'text-green-600 dark:text-green-400';
      case 'credit_deducted':
      case 'sale_deduction':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Previous Balance', 'New Balance', 'Reference'];
    const csvData = filteredMovements.map(movement => [
      formatDate(movement.createdAt),
      getMovementTypeLabel(movement.type),
      movement.description,
      movement.amount.toFixed(2),
      movement.previousBalance.toFixed(2),
      movement.newBalance.toFixed(2),
      movement.reference || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-movements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="credit-movement-history">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Transaction History
            </h3>
            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="credit_added">Credits Added</option>
              <option value="credit_deducted">Credits Deducted</option>
              <option value="sale_deduction">Sale Transactions</option>
              <option value="adjustment">Adjustments</option>
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="Start date"
            />

            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              placeholder="End date"
            />
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {paginatedMovements.length} of {filteredMovements.length} transactions
            </span>
            {(filterType !== 'all' || searchTerm || dateRange.start || dateRange.end) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setSearchTerm('');
                  setDateRange({ start: '', end: '' });
                  setCurrentPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Movements List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedMovements.length > 0 ? (
            paginatedMovements.map((movement) => (
              <div key={movement.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getMovementIcon(movement.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getMovementTypeLabel(movement.type)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {movement.description}
                      </p>
                      {movement.reference && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Ref: {movement.reference}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getAmountColor(movement.type)}`}>
                      {movement.type === 'credit_added' ? '+' : '-'}{formatCurrency(movement.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Balance: {formatCurrency(movement.newBalance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(movement.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filteredMovements.length === 0 && movements.length > 0
                  ? 'No transactions match your filters.'
                  : 'No credit movements found for this platform.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
