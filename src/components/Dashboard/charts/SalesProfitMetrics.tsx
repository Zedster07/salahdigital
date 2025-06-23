import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/helpers';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  Target,
  ShoppingCart,
  Clock
} from 'lucide-react';

interface Sale {
  id: string;
  saleDate: string;
  totalPrice: number;
  profit: number;
  quantity: number;
  platformId?: string;
  paymentType?: string;
  productName: string;
}

interface SalesProfitMetricsProps {
  sales: Sale[];
  settings: any;
}

export function SalesProfitMetrics({ sales, settings }: SalesProfitMetricsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [metricType, setMetricType] = useState<'revenue' | 'profit' | 'count'>('revenue');

  // Process sales data by timeframe
  const processedData = useMemo(() => {
    const groupedData = new Map();
    
    sales.forEach(sale => {
      const date = new Date(sale.saleDate);
      let key: string;
      
      switch (timeframe) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          date: key,
          revenue: 0,
          profit: 0,
          count: 0,
          sales: []
        });
      }
      
      const group = groupedData.get(key);
      group.revenue += sale.totalPrice;
      group.profit += sale.profit;
      group.count += 1;
      group.sales.push(sale);
    });
    
    return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [sales, timeframe]);

  // Calculate trends
  const trends = useMemo(() => {
    if (processedData.length < 2) return { revenue: 0, profit: 0, count: 0 };
    
    const recent = processedData.slice(-7); // Last 7 periods
    const previous = processedData.slice(-14, -7); // Previous 7 periods
    
    const recentAvg = recent.reduce((sum, d) => sum + d.revenue, 0) / recent.length;
    const previousAvg = previous.length > 0 ? previous.reduce((sum, d) => sum + d.revenue, 0) / previous.length : 0;
    
    const recentProfitAvg = recent.reduce((sum, d) => sum + d.profit, 0) / recent.length;
    const previousProfitAvg = previous.length > 0 ? previous.reduce((sum, d) => sum + d.profit, 0) / previous.length : 0;
    
    const recentCountAvg = recent.reduce((sum, d) => sum + d.count, 0) / recent.length;
    const previousCountAvg = previous.length > 0 ? previous.reduce((sum, d) => sum + d.count, 0) / previous.length : 0;
    
    return {
      revenue: previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0,
      profit: previousProfitAvg > 0 ? ((recentProfitAvg - previousProfitAvg) / previousProfitAvg) * 100 : 0,
      count: previousCountAvg > 0 ? ((recentCountAvg - previousCountAvg) / previousCountAvg) * 100 : 0
    };
  }, [processedData]);

  // Get max value for scaling
  const maxValue = useMemo(() => {
    if (processedData.length === 0) return 1;
    
    switch (metricType) {
      case 'revenue':
        return Math.max(...processedData.map(d => d.revenue), 1);
      case 'profit':
        return Math.max(...processedData.map(d => Math.abs(d.profit)), 1);
      case 'count':
        return Math.max(...processedData.map(d => d.count), 1);
      default:
        return 1;
    }
  }, [processedData, metricType]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (timeframe) {
      case 'daily':
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      case 'weekly':
        return `Sem. ${date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      default:
        return dateStr;
    }
  };

  const getValue = (data: any) => {
    switch (metricType) {
      case 'revenue':
        return data.revenue;
      case 'profit':
        return data.profit;
      case 'count':
        return data.count;
      default:
        return data.revenue;
    }
  };

  const formatValue = (value: number) => {
    switch (metricType) {
      case 'count':
        return value.toString();
      default:
        return formatCurrency(value, settings.currency);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600 dark:text-green-400';
    if (trend < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Métriques de Vente et Profit
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Évolution des performances de vente dans le temps
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Timeframe Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'daily', label: 'Jour', icon: Calendar },
              { key: 'weekly', label: 'Semaine', icon: Clock },
              { key: 'monthly', label: 'Mois', icon: BarChart3 }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTimeframe(key as any)}
                className={`flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                  timeframe === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </button>
            ))}
          </div>
          
          {/* Metric Type Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'revenue', label: 'CA', icon: DollarSign },
              { key: 'profit', label: 'Profit', icon: Target },
              { key: 'count', label: 'Ventes', icon: ShoppingCart }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMetricType(key as any)}
                className={`flex items-center px-3 py-1 text-xs rounded-md transition-colors ${
                  metricType === key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tendance CA</p>
              <p className={`text-lg font-bold ${getTrendColor(trends.revenue)}`}>
                {trends.revenue > 0 ? '+' : ''}{trends.revenue.toFixed(1)}%
              </p>
            </div>
            {getTrendIcon(trends.revenue)}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tendance Profit</p>
              <p className={`text-lg font-bold ${getTrendColor(trends.profit)}`}>
                {trends.profit > 0 ? '+' : ''}{trends.profit.toFixed(1)}%
              </p>
            </div>
            {getTrendIcon(trends.profit)}
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tendance Ventes</p>
              <p className={`text-lg font-bold ${getTrendColor(trends.count)}`}>
                {trends.count > 0 ? '+' : ''}{trends.count.toFixed(1)}%
              </p>
            </div>
            {getTrendIcon(trends.count)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {processedData.length === 0 ? (
          <div className="text-center py-8">
            <PieChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune donnée de vente disponible</p>
          </div>
        ) : (
          processedData.slice(-20).map((data, index) => { // Show last 20 periods
            const value = getValue(data);
            const barWidth = maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
            const isNegative = value < 0;
            
            return (
              <div key={data.date} className="flex items-center space-x-3">
                <div className="w-20 text-xs text-gray-600 dark:text-gray-400 text-right">
                  {formatDate(data.date)}
                </div>
                
                <div className="flex-1 flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                    <div
                      className={`h-6 rounded-full transition-all duration-300 ${
                        isNegative ? 'bg-red-500' : 
                        metricType === 'profit' ? 'bg-green-500' :
                        metricType === 'revenue' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-white">
                        {formatValue(value)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="w-16 text-xs text-gray-600 dark:text-gray-400 text-right">
                  {data.count} vente{data.count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {processedData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(processedData.reduce((sum, d) => sum + d.revenue, 0), settings.currency)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">CA Total</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                processedData.reduce((sum, d) => sum + d.profit, 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(processedData.reduce((sum, d) => sum + d.profit, 0), settings.currency)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Profit Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {processedData.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Ventes Totales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {processedData.length > 0 
                  ? (processedData.reduce((sum, d) => sum + d.revenue, 0) / processedData.reduce((sum, d) => sum + d.count, 0)).toFixed(0)
                  : '0'
                } DZD
              </div>
              <div className="text-gray-600 dark:text-gray-400">Panier Moyen</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
