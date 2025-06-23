import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Target,
  Zap
} from 'lucide-react';

// Import dashboard components
import { PlatformProfitabilityChart } from './charts/PlatformProfitabilityChart';
import { CreditUtilizationChart } from './charts/CreditUtilizationChart';
import { SalesProfitMetrics } from './charts/SalesProfitMetrics';
import { LowCreditAlerts } from './alerts/LowCreditAlerts';
import { KPICards } from './kpi/KPICards';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { PlatformFilter } from './filters/PlatformFilter';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface FilterState {
  dateRange: DateRange;
  platformId: string;
  refreshInterval: number; // in seconds
}

export function FinancialDashboard() {
  const { state } = useApp();
  const { platforms, stockSales, platformCreditMovements, digitalProducts, settings } = state;
  
  // Dashboard state management
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      endDate: new Date().toISOString().split('T')[0] // today
    },
    platformId: '',
    refreshInterval: 300 // 5 minutes
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (filters.refreshInterval > 0) {
      const interval = setInterval(() => {
        handleRefresh();
      }, filters.refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [filters.refreshInterval]);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const filteredSales = stockSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      
      const isInDateRange = saleDate >= startDate && saleDate <= endDate;
      const isInPlatform = !filters.platformId || sale.platformId === filters.platformId;
      
      return isInDateRange && isInPlatform;
    });

    const filteredMovements = platformCreditMovements.filter(movement => {
      const movementDate = new Date(movement.createdAt);
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      
      const isInDateRange = movementDate >= startDate && movementDate <= endDate;
      const isInPlatform = !filters.platformId || movement.platformId === filters.platformId;
      
      return isInDateRange && isInPlatform;
    });

    // Calculate key metrics
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalCreditUsed = filteredSales.reduce((sum, sale) => 
      sum + (sale.platformBuyingPrice || 0) * sale.quantity, 0
    );
    const totalCreditAdded = filteredMovements
      .filter(m => m.type === 'credit_added')
      .reduce((sum, movement) => sum + movement.amount, 0);

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const creditUtilizationRate = totalCreditAdded > 0 ? (totalCreditUsed / totalCreditAdded) * 100 : 0;

    // Platform-specific metrics
    const platformMetrics = platforms.map(platform => {
      const platformSales = filteredSales.filter(sale => sale.platformId === platform.id);
      const platformMovements = filteredMovements.filter(movement => movement.platformId === platform.id);
      
      const revenue = platformSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const profit = platformSales.reduce((sum, sale) => sum + sale.profit, 0);
      const creditUsed = platformSales.reduce((sum, sale) => 
        sum + (sale.platformBuyingPrice || 0) * sale.quantity, 0
      );
      const creditAdded = platformMovements
        .filter(m => m.type === 'credit_added')
        .reduce((sum, movement) => sum + movement.amount, 0);

      return {
        platform,
        revenue,
        profit,
        creditUsed,
        creditAdded,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
        utilizationRate: creditAdded > 0 ? (creditUsed / creditAdded) * 100 : 0,
        salesCount: platformSales.length
      };
    });

    // Low credit platforms
    const lowCreditPlatforms = platforms.filter(platform => 
      platform.isActive && platform.creditBalance <= platform.lowBalanceThreshold
    );

    return {
      totalRevenue,
      totalProfit,
      totalCreditUsed,
      totalCreditAdded,
      profitMargin,
      creditUtilizationRate,
      platformMetrics,
      lowCreditPlatforms,
      salesCount: filteredSales.length,
      activeMovements: filteredMovements.length
    };
  }, [stockSales, platformCreditMovements, platforms, filters]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate API refresh - in real implementation, this would fetch fresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      metrics: dashboardMetrics,
      filters,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls (Task 18) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tableau de Bord Financier
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analyse des performances financières et des plateformes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-2 text-sm border rounded-lg transition-colors ${
              showFilters 
                ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Last Refresh Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
        </span>
        {filters.refreshInterval > 0 && (
          <span className="flex items-center">
            <Zap className="h-4 w-4 mr-1" />
            Auto-actualisation: {filters.refreshInterval}s
          </span>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtres et Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateRangeFilter 
              dateRange={filters.dateRange}
              onChange={(dateRange) => updateFilters({ dateRange })}
            />
            <PlatformFilter 
              platforms={platforms}
              selectedPlatformId={filters.platformId}
              onChange={(platformId) => updateFilters({ platformId })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-actualisation
              </label>
              <select
                value={filters.refreshInterval}
                onChange={(e) => updateFilters({ refreshInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={0}>Désactivée</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={1800}>30 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Key Performance Indicators */}
      <KPICards metrics={dashboardMetrics} settings={settings} />

      {/* Low Credit Alerts */}
      {dashboardMetrics.lowCreditPlatforms.length > 0 && (
        <LowCreditAlerts platforms={dashboardMetrics.lowCreditPlatforms} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformProfitabilityChart 
          platformMetrics={dashboardMetrics.platformMetrics}
          settings={settings}
        />
        <CreditUtilizationChart 
          platformMetrics={dashboardMetrics.platformMetrics}
          settings={settings}
        />
      </div>

      {/* Sales Profit Metrics */}
      <SalesProfitMetrics 
        sales={stockSales.filter(sale => {
          const saleDate = new Date(sale.saleDate);
          const startDate = new Date(filters.dateRange.startDate);
          const endDate = new Date(filters.dateRange.endDate);
          const isInDateRange = saleDate >= startDate && saleDate <= endDate;
          const isInPlatform = !filters.platformId || sale.platformId === filters.platformId;
          return isInDateRange && isInPlatform;
        })}
        settings={settings}
      />
    </div>
  );
}
