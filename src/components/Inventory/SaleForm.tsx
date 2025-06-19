import React, { useState, useEffect } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { StockSale, StockMovement } from '../../types';
import { ArrowLeft, Save, X, User, Plus } from 'lucide-react';

interface SaleFormProps {
  sale?: StockSale | null;
  onSave: () => void;
  onCancel: () => void;
}

export function SaleForm({ sale, onSave, onCancel }: SaleFormProps) {
  const { state } = useApp();
  const { addStockSale, updateStockSale, addStockMovement, updateDigitalProduct } = useDatabase();
  const { digitalProducts, subscribers, settings } = state;
  const isEditing = !!sale;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    subscriberId: '',
    customCustomerName: '',
    customCustomerPhone: '',
    quantity: 1,
    unitPrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'baridimob' | 'other',
    paymentStatus: 'paid' as 'paid' | 'pending' | 'partial',
    notes: '',
  });

  const [useExistingCustomer, setUseExistingCustomer] = useState(true);

  useEffect(() => {
    if (sale) {
      setFormData({
        productId: sale.productId,
        subscriberId: sale.subscriberId || '',
        customCustomerName: sale.customerName || '',
        customCustomerPhone: sale.customerPhone || '',
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        saleDate: sale.saleDate.split('T')[0],
        paymentMethod: sale.paymentMethod,
        paymentStatus: sale.paymentStatus,
        notes: sale.notes || '',
      });
      setUseExistingCustomer(!!sale.subscriberId);
    }
  }, [sale]);

  const selectedProduct = digitalProducts.find(p => p.id === formData.productId);
  const selectedSubscriber = subscribers.find(s => s.id === formData.subscriberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    if (formData.quantity > selectedProduct.currentStock) {
      setError('Quantité insuffisante en stock !');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const totalPrice = formData.quantity * formData.unitPrice;
      const costPrice = selectedProduct.averagePurchasePrice * formData.quantity;
      const profit = totalPrice - costPrice;

      const saleData: StockSale = {
        id: sale?.id || generateId(),
        productId: formData.productId,
        productName: selectedProduct.name,
        subscriberId: useExistingCustomer ? formData.subscriberId || undefined : undefined,
        customerName: useExistingCustomer
          ? selectedSubscriber?.name
          : formData.customCustomerName || undefined,
        customerPhone: useExistingCustomer
          ? selectedSubscriber?.phone
          : formData.customCustomerPhone || undefined,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalPrice,
        saleDate: formData.saleDate + 'T00:00:00.000Z',
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        profit,
        notes: formData.notes,
        createdAt: sale?.createdAt || new Date().toISOString(),
      };

      if (isEditing) {
        await updateStockSale(saleData);
      } else {
        // Create the sale
        await addStockSale(saleData);

        // Update product stock
        const updatedProduct = {
          ...selectedProduct,
          currentStock: selectedProduct.currentStock - formData.quantity,
          updatedAt: new Date().toISOString(),
        };
        await updateDigitalProduct(updatedProduct);

        // Add stock movement
        const movement: StockMovement = {
          id: generateId(),
          productId: formData.productId,
          type: 'sale',
          quantity: -formData.quantity,
          previousStock: selectedProduct.currentStock,
          newStock: selectedProduct.currentStock - formData.quantity,
          reference: saleData.id,
          date: new Date().toISOString(),
          notes: `Vente de ${formData.quantity} unités`,
        };
        await addStockMovement(movement);
      }

      onSave();
    } catch (error) {
      console.error('Error saving sale:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (productId: string) => {
    const product = digitalProducts.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      unitPrice: product?.suggestedSellPrice || 0,
    }));
  };

  const paymentMethods = [
    { value: 'cash', label: t('cash', settings.language) },
    { value: 'transfer', label: t('transfer', settings.language) },
    { value: 'baridimob', label: t('baridimob', settings.language) },
    { value: 'other', label: t('other', settings.language) },
  ];

  const paymentStatuses = [
    { value: 'paid', label: 'Payé' },
    { value: 'pending', label: 'En attente' },
    { value: 'partial', label: 'Partiel' },
  ];

  const totalPrice = formData.quantity * formData.unitPrice;
  const costPrice = selectedProduct ? selectedProduct.averagePurchasePrice * formData.quantity : 0;
  const profit = totalPrice - costPrice;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Modifier la vente' : 'Nouvelle vente'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modifiez les informations de la vente' : 'Enregistrez une nouvelle vente'}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sale Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Informations de vente
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produit *
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un produit</option>
                {digitalProducts.filter(p => p.currentStock > 0).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.currentStock})
                  </option>
                ))}
              </select>
              {selectedProduct && selectedProduct.currentStock <= selectedProduct.minStockAlert && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ Stock bas ({selectedProduct.currentStock} restants)
                </p>
              )}
            </div>

            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Client
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useExistingCustomer}
                      onChange={() => setUseExistingCustomer(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Client existant</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useExistingCustomer}
                      onChange={() => setUseExistingCustomer(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Nouveau client</span>
                  </label>
                </div>

                {useExistingCustomer ? (
                  <select
                    value={formData.subscriberId}
                    onChange={(e) => handleInputChange('subscriberId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un client</option>
                    {subscribers.map((subscriber) => (
                      <option key={subscriber.id} value={subscriber.id}>
                        {subscriber.name} - {subscriber.phone}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.customCustomerName}
                      onChange={(e) => handleInputChange('customCustomerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom du client"
                    />
                    <input
                      type="tel"
                      value={formData.customCustomerPhone}
                      onChange={(e) => handleInputChange('customCustomerPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Téléphone du client"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                min="1"
                max={selectedProduct?.currentStock || 1}
                required
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
              {selectedProduct && (
                <p className="text-sm text-gray-500 mt-1">
                  Maximum disponible: {selectedProduct.currentStock}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix unitaire *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              {selectedProduct && (
                <p className="text-sm text-gray-500 mt-1">
                  Prix suggéré: {selectedProduct.suggestedSellPrice.toFixed(2)} DZD
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de vente *
              </label>
              <input
                type="date"
                required
                value={formData.saleDate}
                onChange={(e) => handleInputChange('saleDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Informations de paiement
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('paymentMethod', settings.language)} *
              </label>
              <select
                required
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut du paiement *
              </label>
              <select
                required
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sale Summary */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Prix total:</span>
                <span className="text-lg font-bold text-blue-600">
                  {totalPrice.toFixed(2)} DZD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Coût d'achat:</span>
                <span className="text-sm font-medium text-blue-800">
                  {costPrice.toFixed(2)} DZD
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                <span className="text-sm font-medium text-blue-900">Bénéfice:</span>
                <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit.toFixed(2)} DZD
                </span>
              </div>
              <div className="text-xs text-blue-600">
                {formData.quantity} × {formData.unitPrice.toFixed(2)} DZD
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('notes', settings.language)}
              </label>
              <textarea
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notes ou remarques sur cette vente..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4 inline mr-2" />
            {t('cancel', settings.language)}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {isLoading ? 'Sauvegarde...' : t('save', settings.language)}
          </button>
        </div>
      </form>
    </div>
  );
}