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
  Tag
} from 'lucide-react';

export function ProductsList() {
  const { state } = useApp();
  const { deleteDigitalProduct } = useDatabase();
  const { digitalProducts, settings } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    stockStatus: '',
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredProducts = digitalProducts.filter(product => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!product.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.category && product.category !== filters.category) {
      return false;
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

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            <option value="iptv">IPTV</option>
            <option value="digital-account">Compte Numérique</option>
            <option value="digitali">Offre Digitali</option>
          </select>
          
          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les stocks</option>
            <option value="good">En stock</option>
            <option value="low">Stock bas</option>
            <option value="out">Rupture</option>
          </select>
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix Moyen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix Suggéré
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const StatusIcon = stockStatus.icon;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {getCategoryIcon(product.category)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category} - {product.durationType}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.currentStock} unités
                        </div>
                        <div className="text-sm text-gray-500">
                          Seuil: {product.minStockAlert}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.averagePurchasePrice, settings.currency)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.suggestedSellPrice, settings.currency)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {stockStatus.label}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={isDeleting === product.id}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
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