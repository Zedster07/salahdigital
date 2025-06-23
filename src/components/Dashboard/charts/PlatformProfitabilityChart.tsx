import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/helpers';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  DollarSign,
  Target,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface PlatformMetric {
  platform: any;
  revenue: number;
  profit: number;
  creditUsed: number;
  creditAdded: number;
  profitMargin: number;
  utilizationRate: number;
  salesCount: number;
}

interface PlatformProfitabilityChartProps {
  platformMetrics: PlatformMetric[];
  settings: any;
}

export function PlatformProfitabilityChart({ platformMetrics, settings }: PlatformProfitabilityChartProps) {
  const [viewMode, setViewMode] = useState<'revenue' | 'profit' | 'margin'>('revenue');
  const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'margin' | 'sales'>('revenue');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Sort platforms based on selected criteria
  const sortedMetrics = [...platformMetrics].sort((a, b) => {
    switch (sortBy) {
      case 'revenue':
        return b.revenue - a.revenue;
      case 'profit':
        return b.profit - a.profit;
      case 'margin':
        return b.profitMargin - a.profitMargin;
      case 'sales':
        return b.salesCount - a.salesCount;
      default:
        return 0;
    }
  });

  // Calculate max values for scaling
  const maxRevenue = Math.max(...platformMetrics.map(m => m.revenue), 1);
  const maxProfit = Math.max(...platformMetrics.map(m => m.profit), 1);
  const maxMargin = Math.max(...platformMetrics.map(m => m.profitMargin), 1);

  const getBarWidth = (value: number, max: number) => {
    return max > 0 ? (value / max) * 100 : 0;
  };

  const getValueByMode = (metric: PlatformMetric) => {
    switch (viewMode) {
      case 'revenue':
        return metric.revenue;
      case 'profit':
        return metric.profit;
      case 'margin':
        return metric.profitMargin;
      default:
        return metric.revenue;
    }
  };

  const getMaxByMode = () => {
    switch (viewMode) {
      case 'revenue':
        return maxRevenue;
      case 'profit':
        return maxProfit;
      case 'margin':
        return maxMargin;
      default:
        return maxRevenue;
    }
  };

  const formatValueByMode = (value: number) => {
    switch (viewMode) {
      case 'margin':
        return `${value.toFixed(1)}%`;
      default:
        return formatCurrency(value, settings.currency);
    }
  };

  const getBarColor = (metric: PlatformMetric, index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500'
    ];
    
    if (viewMode === 'profit' && metric.profit < 0) {
      return 'bg-red-500';
    }
    
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Rentabilité par Plateforme
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Performance financière des plateformes fournisseurs
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'revenue', label: 'CA', icon: DollarSign },
              { key: 'profit', label: 'Profit', icon: TrendingUp },
              { key: 'margin', label: 'Marge', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                  viewMode === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </button>
            ))}
          </div>
          
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="revenue">Trier par CA</option>
            <option value="profit">Trier par Profit</option>
            <option value="margin">Trier par Marge</option>
            <option value="sales">Trier par Ventes</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {sortedMetrics.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune donnée de plateforme disponible</p>
          </div>
        ) : (
          sortedMetrics.map((metric, index) => {
            const value = getValueByMode(metric);
            const maxValue = getMaxByMode();
            const barWidth = getBarWidth(value, maxValue);
            const isExpanded = showDetails === metric.platform.id;

            return (
              <div key={metric.platform.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {metric.platform.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {metric.platform.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                          {formatValueByMode(value)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getBarColor(metric, index)}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                          {metric.salesCount} ventes
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowDetails(isExpanded ? null : metric.platform.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="ml-11 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="block text-gray-600 dark:text-gray-400">Chiffre d'Affaires</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(metric.revenue, settings.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-600 dark:text-gray-400">Bénéfice</span>
                        <span className={`font-semibold ${
                          metric.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(metric.profit, settings.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-600 dark:text-gray-400">Marge</span>
                        <span className={`font-semibold ${
                          metric.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {metric.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-600 dark:text-gray-400">Utilisation</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {metric.utilizationRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-gray-600 dark:text-gray-400">Crédits Utilisés</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(metric.creditUsed, settings.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-600 dark:text-gray-400">Solde Actuel</span>
                        <span className={`font-semibold ${
                          metric.platform.creditBalance > metric.platform.lowBalanceThreshold
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {formatCurrency(metric.platform.creditBalance, settings.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {platformMetrics.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(platformMetrics.reduce((sum, m) => sum + m.revenue, 0), settings.currency)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">CA Total</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                platformMetrics.reduce((sum, m) => sum + m.profit, 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(platformMetrics.reduce((sum, m) => sum + m.profit, 0), settings.currency)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Profit Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {platformMetrics.reduce((sum, m) => sum + m.salesCount, 0)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Ventes Totales</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
