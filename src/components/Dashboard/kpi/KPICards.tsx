import React from 'react';
import { formatCurrency } from '../../../utils/helpers';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Target,
  BarChart3,
  Percent,
  ShoppingCart
} from 'lucide-react';

interface KPIMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalCreditUsed: number;
  totalCreditAdded: number;
  profitMargin: number;
  creditUtilizationRate: number;
  salesCount: number;
  activeMovements: number;
}

interface KPICardsProps {
  metrics: KPIMetrics;
  settings: any;
}

export function KPICards({ metrics, settings }: KPICardsProps) {
  const kpiCards = [
    {
      title: 'Chiffre d\'Affaires',
      value: formatCurrency(metrics.totalRevenue, settings.currency),
      subtitle: `${metrics.salesCount} ventes`,
      icon: DollarSign,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-700',
      trend: metrics.totalRevenue > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Bénéfice Total',
      value: formatCurrency(metrics.totalProfit, settings.currency),
      subtitle: `${metrics.profitMargin.toFixed(1)}% marge`,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-700',
      trend: metrics.totalProfit > 0 ? 'up' : metrics.totalProfit < 0 ? 'down' : 'neutral'
    },
    {
      title: 'Crédits Utilisés',
      value: formatCurrency(metrics.totalCreditUsed, settings.currency),
      subtitle: `${metrics.creditUtilizationRate.toFixed(1)}% utilisation`,
      icon: CreditCard,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-700',
      trend: metrics.creditUtilizationRate > 80 ? 'up' : metrics.creditUtilizationRate < 50 ? 'down' : 'neutral'
    },
    {
      title: 'Crédits Ajoutés',
      value: formatCurrency(metrics.totalCreditAdded, settings.currency),
      subtitle: `${metrics.activeMovements} mouvements`,
      icon: Target,
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-700',
      trend: 'neutral'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${card.borderColor} p-6 hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  {getTrendIcon(card.trend)}
                </div>
                
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </p>
                
                <p className={`text-xs ${getTrendColor(card.trend)}`}>
                  {card.subtitle}
                </p>
              </div>
              
              <div className={`${card.bgColor} p-3 rounded-lg ml-4`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>

            {/* Additional metrics bar */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {index === 0 && ( // Revenue card
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Ventes moyennes</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {metrics.salesCount > 0 
                      ? formatCurrency(metrics.totalRevenue / metrics.salesCount, settings.currency)
                      : formatCurrency(0, settings.currency)
                    }
                  </span>
                </div>
              )}
              
              {index === 1 && ( // Profit card
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Profit par vente</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {metrics.salesCount > 0 
                      ? formatCurrency(metrics.totalProfit / metrics.salesCount, settings.currency)
                      : formatCurrency(0, settings.currency)
                    }
                  </span>
                </div>
              )}
              
              {index === 2 && ( // Credit used card
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Coût moyen</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {metrics.salesCount > 0 
                      ? formatCurrency(metrics.totalCreditUsed / metrics.salesCount, settings.currency)
                      : formatCurrency(0, settings.currency)
                    }
                  </span>
                </div>
              )}
              
              {index === 3 && ( // Credit added card
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Solde restant</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(metrics.totalCreditAdded - metrics.totalCreditUsed, settings.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Additional KPI Summary Component
export function KPISummary({ metrics, settings }: KPICardsProps) {
  const netCreditFlow = metrics.totalCreditAdded - metrics.totalCreditUsed;
  const averageSaleValue = metrics.salesCount > 0 ? metrics.totalRevenue / metrics.salesCount : 0;
  const averageProfit = metrics.salesCount > 0 ? metrics.totalProfit / metrics.salesCount : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
        Résumé des Performances
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(averageSaleValue, settings.currency)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Vente Moyenne</div>
          <div className="flex items-center justify-center mt-2">
            <ShoppingCart className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {metrics.salesCount} transactions
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            averageProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(averageProfit, settings.currency)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Profit Moyen</div>
          <div className="flex items-center justify-center mt-2">
            <Percent className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs text-green-600 dark:text-green-400">
              {metrics.profitMargin.toFixed(1)}% marge
            </span>
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            netCreditFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {formatCurrency(Math.abs(netCreditFlow), settings.currency)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {netCreditFlow >= 0 ? 'Solde Crédit' : 'Déficit Crédit'}
          </div>
          <div className="flex items-center justify-center mt-2">
            <CreditCard className="h-4 w-4 text-purple-500 mr-1" />
            <span className="text-xs text-purple-600 dark:text-purple-400">
              {metrics.creditUtilizationRate.toFixed(1)}% utilisé
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
