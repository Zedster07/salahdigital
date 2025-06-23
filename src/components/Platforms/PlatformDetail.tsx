import React, { useState, useEffect } from 'react';
import { Platform, PlatformCreditMovement, DigitalProduct } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { 
  Edit, 
  CreditCard, 
  Calendar, 
  Globe, 
  Key, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface PlatformDetailProps {
  platform: Platform;
  onEdit: (platform: Platform) => void;
  onManageCredits: (platform: Platform) => void;
}

export function PlatformDetail({ platform, onEdit, onManageCredits }: PlatformDetailProps) {
  const { state } = useApp();
  const { platformCreditMovements, digitalProducts } = state;
  
  const [recentMovements, setRecentMovements] = useState<PlatformCreditMovement[]>([]);
  const [associatedProducts, setAssociatedProducts] = useState<DigitalProduct[]>([]);

  useEffect(() => {
    // Filter recent credit movements for this platform
    const movements = platformCreditMovements
      .filter(movement => movement.platformId === platform.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentMovements(movements);

    // Filter products associated with this platform
    const products = digitalProducts.filter(product => product.platformId === platform.id);
    setAssociatedProducts(products);
  }, [platform.id, platformCreditMovements, digitalProducts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
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

  const getStatusIcon = () => {
    if (!platform.isActive) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    if (platform.creditBalance < 100) {
      return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  };

  const getStatusText = () => {
    if (!platform.isActive) return 'Inactive';
    if (platform.creditBalance < 100) return 'Low Credit';
    return 'Active';
  };

  const getStatusColor = () => {
    if (!platform.isActive) return 'text-red-600 dark:text-red-400';
    if (platform.creditBalance < 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'credit_added':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'credit_deducted':
      case 'sale_deduction':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementDescription = (movement: PlatformCreditMovement) => {
    switch (movement.type) {
      case 'credit_added':
        return 'Credits Added';
      case 'credit_deducted':
        return 'Credits Deducted';
      case 'sale_deduction':
        return 'Sale Transaction';
      case 'adjustment':
        return 'Balance Adjustment';
      default:
        return movement.type;
    }
  };

  return (
    <div className="platform-detail space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {platform.name}
              </h2>
              <p className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </p>
              {platform.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {platform.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onManageCredits(platform)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Credits
            </button>
            <button
              onClick={() => onEdit(platform)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Platform
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(platform.creditBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Associated Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {associatedProducts.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Movements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recentMovements.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Platform Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API URL</p>
                <p className="text-sm text-gray-900 dark:text-white font-mono">
                  {platform.apiUrl || 'Not configured'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Key</p>
                <p className="text-sm text-gray-900 dark:text-white font-mono">
                  {platform.apiKey ? '••••••••••••••••' : 'Not configured'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(platform.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {formatDate(platform.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Credit Movements */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Credit Movements
        </h3>
        {recentMovements.length > 0 ? (
          <div className="space-y-3">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getMovementIcon(movement.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getMovementDescription(movement)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(movement.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    movement.type === 'credit_added' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {movement.type === 'credit_added' ? '+' : '-'}{formatCurrency(movement.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Balance: {formatCurrency(movement.newBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No credit movements found for this platform.
          </p>
        )}
      </div>

      {/* Associated Products */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Associated Products ({associatedProducts.length})
        </h3>
        {associatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associatedProducts.map((product) => (
              <div key={product.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{product.category}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stock: {product.currentStock}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(product.suggestedSellPrice)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No products associated with this platform.
          </p>
        )}
      </div>
    </div>
  );
}
