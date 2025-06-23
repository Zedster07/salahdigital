import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  BarChart3
} from 'lucide-react';

export function InventoryDashboard() {
  const { state } = useApp();
  const { digitalProducts, stockPurchases, stockSales, settings } = state;

  const stats = React.useMemo(() => {
    // Add defensive programming to handle undefined arrays
    const safeDigitalProducts = digitalProducts || [];
    const safeStockPurchases = stockPurchases || [];
    const safeStockSales = stockSales || [];

    const totalProducts = safeDigitalProducts.length;
    const totalStock = safeDigitalProducts.reduce((sum, product) => sum + product.currentStock, 0);
    const lowStockProducts = safeDigitalProducts.filter(product =>
      product.currentStock <= product.minStockAlert
    ).length;

    const totalPurchaseValue = safeStockPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    const totalSalesValue = safeStockSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = safeStockSales.reduce((sum, sale) => sum + sale.profit, 0);

    const currentStockValue = safeDigitalProducts.reduce((sum, product) =>
      sum + (product.currentStock * product.averagePurchasePrice), 0
    );

    return {
      totalProducts,
      totalStock,
      lowStockProducts,
      totalPurchaseValue,
      totalSalesValue,
      totalProfit,
      currentStockValue
    };
  }, [digitalProducts, stockPurchases, stockSales]);

  const statCards = [
    {
      title: 'Articles en Stock',
      value: stats.totalProducts.toString(),
      subtitle: `${stats.totalStock} unités totales`,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Valeur du Stock',
      value: formatCurrency(stats.currentStockValue, settings.currency),
      subtitle: 'Valeur actuelle',
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Alertes Stock Bas',
      value: stats.lowStockProducts.toString(),
      subtitle: 'Articles à réapprovisionner',
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Bénéfice Total',
      value: formatCurrency(stats.totalProfit, settings.currency),
      subtitle: 'Profit réalisé',
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  const recentPurchases = (stockPurchases || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentSales = (stockSales || [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lowStockProducts = (digitalProducts || []).filter(product =>
    product.currentStock <= product.minStockAlert
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Alertes Stock Bas
            </h3>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tous les stocks sont suffisants</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Stock actuel: {product.currentStock} | Seuil: {product.minStockAlert}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Stock bas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Activité Récente
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Derniers Achats</h4>
              {recentPurchases.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun achat récent</p>
              ) : (
                <div className="space-y-2">
                  {recentPurchases.slice(0, 3).map((purchase) => (
                    <div key={purchase.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{purchase.productName}</span>
                      <span className="font-medium">+{purchase.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Dernières Ventes</h4>
              {recentSales.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune vente récente</p>
              ) : (
                <div className="space-y-2">
                  {recentSales.slice(0, 3).map((sale) => (
                    <div key={sale.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{sale.productName}</span>
                      <span className="font-medium text-red-600">-{sale.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}