import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export function SalesChart() {
  const { state } = useApp();
  const { stockSales, settings } = state;

  // Données des 7 derniers jours
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const dailySales = last7Days.map(date => {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const daySales = stockSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      return saleDate >= dayStart && saleDate < dayEnd;
    });

    const totalAmount = daySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = daySales.reduce((sum, sale) => sum + sale.profit, 0);

    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      amount: totalAmount,
      profit: totalProfit,
      count: daySales.length
    };
  });

  const maxAmount = Math.max(...dailySales.map(d => d.amount));
  const totalWeekSales = dailySales.reduce((sum, d) => sum + d.amount, 0);
  const totalWeekProfit = dailySales.reduce((sum, d) => sum + d.profit, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Ventes des 7 derniers jours
          </h3>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">
                CA: {formatCurrency(totalWeekSales, settings.currency)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                Profit: {formatCurrency(totalWeekProfit, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {dailySales.map((day, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-12 text-sm text-gray-600 font-medium">
              {day.date}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(day.amount, settings.currency)}
                </span>
                <span className="text-xs text-gray-500">
                  {day.count} vente(s)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: maxAmount > 0 ? `${(day.amount / maxAmount) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}