import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Plus, TrendingUp, Package, Users, AlertTriangle } from 'lucide-react';

export function QuickActions() {
  const { state } = useApp();
  const { digitalProducts } = state;

  const lowStockProducts = digitalProducts.filter(product => 
    product.currentStock <= product.minStockAlert
  );

  const quickActions = [
    {
      title: 'Nouvelle Vente',
      description: 'Enregistrer une vente rapide',
      icon: TrendingUp,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => {/* Navigation vers nouvelle vente */}
    },
    {
      title: 'Nouvel Achat',
      description: 'Ajouter du stock',
      icon: Package,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {/* Navigation vers nouvel achat */}
    },
    {
      title: 'Nouveau Client',
      description: 'Ajouter un client',
      icon: Users,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => {/* Navigation vers nouveau client */}
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white p-4 rounded-lg transition-colors flex items-center space-x-3`}
            >
              <Icon className="w-6 h-6" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm opacity-90">{action.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alertes Stock Bas */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h4 className="font-medium text-orange-900">
              {lowStockProducts.length} produit(s) en stock bas
            </h4>
          </div>
          <div className="space-y-1">
            {lowStockProducts.slice(0, 3).map(product => (
              <div key={product.id} className="text-sm text-orange-700">
                • {product.name}: {product.currentStock} restant(s)
              </div>
            ))}
            {lowStockProducts.length > 3 && (
              <div className="text-sm text-orange-600">
                +{lowStockProducts.length - 3} autres produits...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}