import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { SaleForm } from './SaleForm';
import { PaymentStatusDropdown } from './PaymentStatusDropdown';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  User,
  Eye,
  Receipt
} from 'lucide-react';

export function SalesList() {
  const { state, dispatch } = useApp();
  const { stockSales, digitalProducts, settings } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    productId: '',
    paymentStatus: '',
    customer: '',
  });

  const filteredSales = stockSales.filter(sale => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!sale.productName.toLowerCase().includes(searchLower) &&
          !sale.customerName?.toLowerCase().includes(searchLower) &&
          !sale.customerPhone?.includes(searchTerm)) {
        return false;
      }
    }
    
    if (filters.productId && sale.productId !== filters.productId) {
      return false;
    }
    
    if (filters.paymentStatus && sale.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    
    if (filters.customer) {
      const customerLower = filters.customer.toLowerCase();
      if (!sale.customerName?.toLowerCase().includes(customerLower) &&
          !sale.customerPhone?.includes(filters.customer)) {
        return false;
      }
    }
    
    return true;
  });

  const handleEditSale = (sale: any) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleDeleteSale = (saleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      dispatch({ type: 'DELETE_STOCK_SALE', payload: saleId });
    }
  };

  const handleUpdateSale = (updatedSale: any) => {
    dispatch({ type: 'UPDATE_STOCK_SALE', payload: updatedSale });
  };

  const handleViewSaleDetails = (sale: any) => {
    // Afficher les détails de la vente dans une modal
    alert(`Détails de la vente:\n\nProduit: ${sale.productName}\nClient: ${sale.customerName || 'Client anonyme'}\nMontant: ${formatCurrency(sale.totalPrice, settings.currency)}\nStatut: ${sale.paymentStatus}`);
  };

  // Calculer les statistiques avec les nouveaux champs de paiement
  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalPaid = filteredSales.reduce((sum, s) => sum + (s.paidAmount || (s.paymentStatus === 'paid' ? s.totalPrice : 0)), 0);
  const totalPending = totalSales - totalPaid;
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);

  if (showForm) {
    return (
      <SaleForm
        sale={editingSale}
        onSave={() => {
          setShowForm(false);
          setEditingSale(null);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingSale(null);
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
            Ventes de Stock
          </h2>
          <p className="text-gray-600 mt-1">
            Gérez vos ventes et sorties de stock avec suivi des paiements
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle vente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Ventes</p>
              <p className="text-2xl font-bold text-gray-900">{stockSales.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalSales, settings.currency)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Montant Encaissé</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid, settings.currency)}
              </p>
              <p className="text-xs text-gray-500">
                En attente: {formatCurrency(totalPending, settings.currency)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Bénéfice Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalProfit, settings.currency)}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.productId}
            onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les produits</option>
            {digitalProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.paymentStatus}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
          </select>
          
          <input
            type="text"
            placeholder="Client..."
            value={filters.customer}
            onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune vente trouvée</h3>
            <p className="text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Aucune vente ne correspond à vos critères de recherche'
                : 'Commencez par enregistrer votre première vente'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bénéfice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {filteredSales.map((sale) => {
                  const paidAmount = sale.paidAmount || (sale.paymentStatus === 'paid' ? sale.totalPrice : 0);
                  const remainingAmount = sale.totalPrice - paidAmount;
                  
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {sale.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(sale.unitPrice, settings.currency)} / unité
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sale.customerName ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {sale.customerName}
                              </div>
                              {sale.customerPhone && (
                                <div className="text-sm text-gray-500">
                                  {sale.customerPhone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Client anonyme</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.quantity} unités
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(sale.totalPrice, settings.currency)}
                        </div>
                        {sale.paymentStatus === 'partial' && (
                          <div className="text-xs text-gray-500">
                            Payé: {formatCurrency(paidAmount, settings.currency)}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className={`font-medium ${
                            sale.paymentStatus === 'paid' ? 'text-green-600' : 
                            sale.paymentStatus === 'partial' ? 'text-yellow-600' : 
                            'text-orange-600'
                          }`}>
                            {formatCurrency(paidAmount, settings.currency)}
                          </div>
                          {remainingAmount > 0 && (
                            <div className="text-xs text-red-600">
                              Reste: {formatCurrency(remainingAmount, settings.currency)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(sale.profit, settings.currency)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(sale.saleDate, settings.language)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusDropdown 
                          sale={sale} 
                          onUpdate={handleUpdateSale}
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewSaleDetails(sale)}
                            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-50"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSale(sale)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
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