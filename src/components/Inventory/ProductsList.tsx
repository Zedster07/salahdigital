import React, { useState } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { ProductForm } from './ProductForm';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Tag,
  Filter,
  CreditCard,
  DollarSign,
  TrendingUp,
  Eye,
  Settings
} from 'lucide-react';

export function ProductsList() {
  const { state } = useApp();
  const { deleteDigitalProduct } = useDatabase();
  const { digitalProducts, settings, platforms } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: '',
    platformId: '', // Enhanced filtering for Task 16
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false); // Enhanced UI for Task 16

  const filteredProducts = digitalProducts.filter(product => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!product.name.toLowerCase().includes(searchLower) &&
          !product.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filters.category && product.category !== filters.category) {
      return false;
    }

    // Enhanced platform filtering for Task 16
    if (filters.platformId) {
      if (filters.platformId === 'no-platform' && product.platformId) {
        return false;
      }
      if (filters.platformId !== 'no-platform' && product.platformId !== filters.platformId) {
        return false;
      }
    }

    if (filters.stockStatus) {
      const isLowStock = product.currentStock <= product.minStockAlert;
      const isOutOfStock = product.currentStock === 0;

      if (filters.stockStatus === 'low' && !isLowStock) return false;
      if (filters.stockStatus === 'out' && !isOutOfStock) return false;
      if (filters.stockStatus === 'good' && (isLowStock || isOutOfStock)) return false;
    }

    return true;
  });

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setIsDeleting(productId);
      try {
        await deleteDigitalProduct(productId);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erreur lors de la suppression. Veuillez réessayer.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const getStockStatus = (product: any) => {
    if (product.currentStock === 0) {
      return { status: 'out', label: 'Rupture', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle };
    } else if (product.currentStock <= product.minStockAlert) {
      return { status: 'low', label: 'Stock bas', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle };
    } else {
      return { status: 'good', label: 'En stock', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'iptv':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'digital-account':
        return <Tag className="w-5 h-5 text-blue-600" />;
      case 'digitali':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  // Enhanced helper functions for Task 16
  const getPlatformInfo = (platformId?: string) => {
    if (!platformId) return null;
    return platforms.find(p => p.id === platformId);
  };

  const calculateProfitMargin = (product: any) => {
    const buyingPrice = product.platformBuyingPrice || product.averagePurchasePrice || 0;
    const sellingPrice = product.suggestedSellPrice || 0;

    if (buyingPrice === 0 || sellingPrice === 0) return 0;

    const profit = sellingPrice - buyingPrice;
    return (profit / sellingPrice) * 100;
  };

  const getProfitAmount = (product: any) => {
    const buyingPrice = product.platformBuyingPrice || product.averagePurchasePrice || 0;
    const sellingPrice = product.suggestedSellPrice || 0;
    return sellingPrice - buyingPrice;
  };

  const getStockStatusColor = (product: any) => {
    if (product.currentStock === 0) return 'text-red-600 bg-red-100';
    if (product.currentStock <= product.minStockAlert) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusText = (product: any) => {
    if (product.currentStock === 0) return 'Rupture';
    if (product.currentStock <= product.minStockAlert) return 'Stock bas';
    return 'En stock';
  };

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSave={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Articles (Produits)
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez votre catalogue de produits digitaux
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un article
        </button>
      </div>

      {/* Enhanced Product Statistics Cards (Task 16) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{digitalProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {digitalProducts.filter(p => p.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Stock Bas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {digitalProducts.filter(p => p.currentStock <= p.minStockAlert).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avec Plateforme</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {digitalProducts.filter(p => p.platformId).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters (Task 16) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres et Recherche</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Masquer' : 'Afficher'} Filtres
          </button>
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article par nom ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes les catégories</option>
                  <option value="iptv">IPTV</option>
                  <option value="digital-account">Compte Numérique</option>
                  <option value="digitali">Offre Digitali</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plateforme
                </label>
                <select
                  value={filters.platformId}
                  onChange={(e) => setFilters({ ...filters, platformId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes les plateformes</option>
                  <option value="no-platform">Sans plateforme</option>
                  {platforms.filter(p => p.isActive).map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut Stock
                </label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Tous les stocks</option>
                  <option value="good">En stock</option>
                  <option value="low">Stock bas</option>
                  <option value="out">Rupture</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ category: '', stockStatus: '', platformId: '' });
                    setSearchTerm('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
            </span>
            {(searchTerm || Object.values(filters).some(f => f)) && (
              <span className="text-blue-600 dark:text-blue-400">
                Filtres actifs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun article trouvé</h3>
            <p className="text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Aucun article ne correspond à vos critères de recherche'
                : 'Commencez par ajouter votre premier article'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plateforme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix Achat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prix Vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Marge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const StatusIcon = stockStatus.icon;
                  const platformInfo = getPlatformInfo(product.platformId);
                  const profitMargin = calculateProfitMargin(product);
                  const profitAmount = getProfitAmount(product);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            {getCategoryIcon(product.category)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.category} - {product.durationType}
                            </div>
                            {product.description && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs truncate">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Platform Information Column (Task 16) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {platformInfo ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {platformInfo.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Solde: {platformInfo.creditBalance.toFixed(2)} DZD
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                            Aucune plateforme
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.currentStock} unités
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${getStockStatusColor(product)}`}>
                          {getStockStatusText(product)}
                        </div>
                      </td>

                      {/* Enhanced Pricing Columns (Task 16) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(product.platformBuyingPrice || product.averagePurchasePrice, settings.currency)}
                        </div>
                        {product.platformBuyingPrice && product.averagePurchasePrice &&
                         product.platformBuyingPrice !== product.averagePurchasePrice && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Moy: {formatCurrency(product.averagePurchasePrice, settings.currency)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(product.suggestedSellPrice, settings.currency)}
                        </div>
                      </td>

                      {/* Profit Margin Column (Task 16) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`text-sm font-medium ${
                            profitAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {profitAmount >= 0 ? '+' : ''}{profitAmount.toFixed(2)} DZD
                          </div>
                        </div>
                        <div className={`text-xs ${
                          profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {profitMargin.toFixed(1)}% marge
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                            <StatusIcon className="w-4 h-4 mr-1" />
                            {stockStatus.label}
                          </div>
                          {product.isActive ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Actif
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              Inactif
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Modifier le produit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isDeleting === product.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            title="Supprimer le produit"
                          >
                            {isDeleting === product.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}