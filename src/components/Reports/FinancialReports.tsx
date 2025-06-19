import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

export function FinancialReports() {
  const { state } = useApp();
  const { stockSales, stockPurchases, digitalProducts, settings } = state;
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('');

  const filteredData = useMemo(() => {
    let sales = [...stockSales];
    let purchases = [...stockPurchases];

    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (selectedPeriod) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      sales = sales.filter(sale => new Date(sale.saleDate) >= startDate);
      purchases = purchases.filter(purchase => new Date(purchase.purchaseDate) >= startDate);
    }

    // Filter by product
    if (selectedProduct) {
      sales = sales.filter(sale => sale.productId === selectedProduct);
      purchases = purchases.filter(purchase => purchase.productId === selectedProduct);
    }

    return { sales, purchases };
  }, [stockSales, stockPurchases, selectedPeriod, selectedProduct]);

  const reportData = useMemo(() => {
    const { sales, purchases } = filteredData;

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    // Top products by revenue
    const productStats = digitalProducts.map(product => {
      const productSales = sales.filter(sale => sale.productId === product.id);
      const productPurchases = purchases.filter(purchase => purchase.productId === product.id);
      
      const revenue = productSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const profit = productSales.reduce((sum, sale) => sum + sale.profit, 0);
      const quantity = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const purchaseCost = productPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

      return {
        productName: product.name,
        revenue,
        profit,
        quantity,
        purchaseCost,
      };
    }).filter(stat => stat.revenue > 0 || stat.purchaseCost > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // Monthly data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      const monthPurchases = purchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate);
        return purchaseDate >= monthStart && purchaseDate <= monthEnd;
      });

      const monthSalesTotal = monthSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const monthPurchasesTotal = monthPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
      const monthProfit = monthSales.reduce((sum, sale) => sum + sale.profit, 0);

      monthlyData.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        sales: monthSalesTotal,
        purchases: monthPurchasesTotal,
        profit: monthProfit,
      });
    }

    return {
      totalSales,
      totalPurchases,
      totalProfit,
      profitMargin,
      salesCount: sales.length,
      purchasesCount: purchases.length,
      topProducts: productStats.slice(0, 5),
      monthlyData,
    };
  }, [filteredData, digitalProducts]);

  const periods = [
    { value: 'all', label: 'Toute la période' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
  ];

  const exportToCSV = () => {
    const csvData = [
      ['Période', selectedPeriod],
      [''],
      ['Résumé Financier'],
      ['Total Ventes', reportData.totalSales],
      ['Total Achats', reportData.totalPurchases],
      ['Bénéfice Net', reportData.totalProfit],
      ['Marge Bénéficiaire (%)', reportData.profitMargin.toFixed(2)],
      [''],
      ['Top Produits'],
      ['Produit', 'Chiffre d\'Affaires', 'Bénéfice', 'Quantité Vendue'],
      ...reportData.topProducts.map(product => [
        product.productName,
        product.revenue,
        product.profit,
        product.quantity
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_financier_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Rapports Financiers
          </h2>
          <p className="text-gray-600 mt-1">
            Analyse détaillée de vos ventes et achats
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Période
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Produit
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les produits</option>
              {digitalProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.totalSales, settings.currency)}
              </p>
              <p className="text-sm text-gray-500">{reportData.salesCount} ventes</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Achats</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.totalPurchases, settings.currency)}
              </p>
              <p className="text-sm text-gray-500">{reportData.purchasesCount} achats</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Bénéfice Net</p>
              <p className={`text-2xl font-bold ${reportData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.totalProfit, settings.currency)}
              </p>
              <p className="text-sm text-gray-500">
                Marge: {reportData.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Marge Moyenne</p>
              <p className={`text-2xl font-bold ${reportData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.profitMargin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Performance</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Top Produits par CA
            </h3>
          </div>
          
          {reportData.topProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune donnée pour cette période</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.topProducts.map((product, index) => (
                <div
                  key={product.productName}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{product.productName}</h4>
                      <p className="text-sm text-gray-600">
                        {product.quantity} unités vendues
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(product.revenue, settings.currency)}
                    </div>
                    <div className={`text-sm ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Profit: {formatCurrency(product.profit, settings.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution Mensuelle
            </h3>
          </div>
          
          <div className="space-y-4">
            {reportData.monthlyData.map((month) => (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <span className={`text-sm font-medium ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.profit, settings.currency)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>Ventes: {formatCurrency(month.sales, settings.currency)}</div>
                  <div>Achats: {formatCurrency(month.purchases, settings.currency)}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${month.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      width: `${Math.min(100, Math.abs(month.profit) / Math.max(...reportData.monthlyData.map(m => Math.abs(m.profit))) * 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Analyse Détaillée
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Rentabilité</h4>
            <p className={`text-2xl font-bold ${reportData.profitMargin >= 20 ? 'text-green-600' : reportData.profitMargin >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
              {reportData.profitMargin >= 20 ? 'Excellente' : reportData.profitMargin >= 10 ? 'Bonne' : 'À améliorer'}
            </p>
            <p className="text-sm text-blue-700">Marge: {reportData.profitMargin.toFixed(1)}%</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-2">Volume d'Activité</h4>
            <p className="text-2xl font-bold text-green-600">
              {reportData.salesCount + reportData.purchasesCount}
            </p>
            <p className="text-sm text-green-700">Transactions totales</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-purple-900 mb-2">Panier Moyen</h4>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                reportData.salesCount > 0 ? reportData.totalSales / reportData.salesCount : 0,
                settings.currency
              )}
            </p>
            <p className="text-sm text-purple-700">Par vente</p>
          </div>
        </div>
      </div>
    </div>
  );
}