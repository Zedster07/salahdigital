import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/helpers';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3
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

interface CreditUtilizationChartProps {
  platformMetrics: PlatformMetric[];
  settings: any;
}

export function CreditUtilizationChart({ platformMetrics, settings }: CreditUtilizationChartProps) {
  const [viewMode, setViewMode] = useState<'utilization' | 'balance' | 'efficiency'>('utilization');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Filter and sort platforms
  const filteredMetrics = platformMetrics.filter(metric => 
    !showOnlyActive || metric.platform.isActive
  );

  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    switch (viewMode) {
      case 'utilization':
        return b.utilizationRate - a.utilizationRate;
      case 'balance':
        return b.platform.creditBalance - a.platform.creditBalance;
      case 'efficiency':
        return (b.profit / Math.max(b.creditUsed, 1)) - (a.profit / Math.max(a.creditUsed, 1));
      default:
        return 0;
    }
  });

  const getUtilizationStatus = (rate: number) => {
    if (rate >= 90) return { status: 'high', color: 'red', label: 'Très élevé' };
    if (rate >= 70) return { status: 'medium-high', color: 'orange', label: 'Élevé' };
    if (rate >= 50) return { status: 'medium', color: 'yellow', label: 'Moyen' };
    if (rate >= 30) return { status: 'low', color: 'blue', label: 'Faible' };
    return { status: 'very-low', color: 'gray', label: 'Très faible' };
  };

  const getBalanceStatus = (platform: any) => {
    const ratio = platform.creditBalance / platform.lowBalanceThreshold;
    if (ratio <= 0.1) return { status: 'critical', color: 'red', label: 'Critique' };
    if (ratio <= 0.5) return { status: 'low', color: 'orange', label: 'Bas' };
    if (ratio <= 1) return { status: 'medium', color: 'yellow', label: 'Moyen' };
    return { status: 'good', color: 'green', label: 'Bon' };
  };

  const getEfficiency = (metric: PlatformMetric) => {
    return metric.creditUsed > 0 ? metric.profit / metric.creditUsed : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      red: {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-600 dark:text-red-400',
        bar: 'bg-red-500',
        border: 'border-red-200 dark:border-red-700'
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        bar: 'bg-orange-500',
        border: 'border-orange-200 dark:border-orange-700'
      },
      yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-600 dark:text-yellow-400',
        bar: 'bg-yellow-500',
        border: 'border-yellow-200 dark:border-yellow-700'
      },
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        bar: 'bg-blue-500',
        border: 'border-blue-200 dark:border-blue-700'
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        bar: 'bg-green-500',
        border: 'border-green-200 dark:border-green-700'
      },
      gray: {
        bg: 'bg-gray-100 dark:bg-gray-900/20',
        text: 'text-gray-600 dark:text-gray-400',
        bar: 'bg-gray-500',
        border: 'border-gray-200 dark:border-gray-700'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            Utilisation des Crédits
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analyse de l'utilisation des crédits par plateforme
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'utilization', label: 'Utilisation', icon: BarChart3 },
              { key: 'balance', label: 'Solde', icon: CreditCard },
              { key: 'efficiency', label: 'Efficacité', icon: Zap }
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
          
          {/* Filter Toggle */}
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(e) => setShowOnlyActive(e.target.checked)}
              className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Actives seulement
          </label>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {sortedMetrics.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune donnée de crédit disponible</p>
          </div>
        ) : (
          sortedMetrics.map((metric, index) => {
            let status, value, maxValue, displayValue;
            
            switch (viewMode) {
              case 'utilization':
                status = getUtilizationStatus(metric.utilizationRate);
                value = metric.utilizationRate;
                maxValue = 100;
                displayValue = `${value.toFixed(1)}%`;
                break;
              case 'balance':
                status = getBalanceStatus(metric.platform);
                value = metric.platform.creditBalance;
                maxValue = Math.max(...sortedMetrics.map(m => m.platform.creditBalance), 1);
                displayValue = formatCurrency(value, settings.currency);
                break;
              case 'efficiency':
                const efficiency = getEfficiency(metric);
                status = efficiency > 1 ? { status: 'good', color: 'green', label: 'Excellent' } :
                        efficiency > 0.5 ? { status: 'medium', color: 'blue', label: 'Bon' } :
                        efficiency > 0 ? { status: 'low', color: 'yellow', label: 'Faible' } :
                        { status: 'very-low', color: 'gray', label: 'Très faible' };
                value = efficiency;
                maxValue = Math.max(...sortedMetrics.map(m => getEfficiency(m)), 1);
                displayValue = `${efficiency.toFixed(2)}x`;
                break;
              default:
                status = { status: 'medium', color: 'gray', label: 'N/A' };
                value = 0;
                maxValue = 1;
                displayValue = 'N/A';
            }

            const colors = getColorClasses(status.color);
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;

            return (
              <div key={metric.platform.id} className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {metric.platform.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {metric.platform.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                          {getStatusIcon(status.status)}
                          <span className="ml-1">{status.label}</span>
                        </span>
                        {!metric.platform.isActive && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            Inactif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {displayValue}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {metric.salesCount} ventes
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${colors.bar}`}
                    style={{ width: `${Math.min(barWidth, 100)}%` }}
                  />
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-gray-600 dark:text-gray-400">Utilisé</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(metric.creditUsed, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-600 dark:text-gray-400">Ajouté</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(metric.creditAdded, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-600 dark:text-gray-400">Solde</span>
                    <span className={`font-semibold ${
                      metric.platform.creditBalance > metric.platform.lowBalanceThreshold
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {formatCurrency(metric.platform.creditBalance, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-600 dark:text-gray-400">Profit</span>
                    <span className={`font-semibold ${
                      metric.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(metric.profit, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {platformMetrics.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {(platformMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / platformMetrics.length).toFixed(1)}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Utilisation Moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(platformMetrics.reduce((sum, m) => sum + m.platform.creditBalance, 0), settings.currency)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Solde Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(platformMetrics.reduce((sum, m) => sum + m.creditUsed, 0), settings.currency)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Crédits Utilisés</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {platformMetrics.filter(m => m.platform.creditBalance <= m.platform.lowBalanceThreshold).length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Alertes Actives</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
