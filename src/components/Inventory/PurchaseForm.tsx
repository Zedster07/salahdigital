import React, { useState, useEffect } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { StockPurchase, StockMovement } from '../../types';
import { ArrowLeft, Save, X } from 'lucide-react';

interface PurchaseFormProps {
  purchase?: StockPurchase | null;
  onSave: () => void;
  onCancel: () => void;
}

export function PurchaseForm({ purchase, onSave, onCancel }: PurchaseFormProps) {
  const { state } = useApp();
  const { addStockPurchase, updateStockPurchase, addStockMovement, updateDigitalProduct } = useDatabase();
  const { digitalProducts, settings } = state;
  const isEditing = !!purchase;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    supplier: '',
    quantity: 1,
    unitCost: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'transfer' | 'baridimob' | 'other',
    paymentStatus: 'paid' as 'paid' | 'pending' | 'partial',
    invoiceNumber: '',
    notes: '',
  });

  useEffect(() => {
    if (purchase) {
      setFormData({
        productId: purchase.productId,
        supplier: purchase.supplier,
        quantity: purchase.quantity,
        unitCost: purchase.unitCost,
        purchaseDate: purchase.purchaseDate.split('T')[0],
        paymentMethod: purchase.paymentMethod,
        paymentStatus: purchase.paymentStatus,
        invoiceNumber: purchase.invoiceNumber || '',
        notes: purchase.notes || '',
      });
    }
  }, [purchase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProduct = digitalProducts.find(p => p.id === formData.productId);
    if (!selectedProduct) return;

    setIsLoading(true);
    setError(null);

    try {
      const totalCost = formData.quantity * formData.unitCost;

      const purchaseData: StockPurchase = {
        id: purchase?.id || generateId(),
        productId: formData.productId,
        productName: selectedProduct.name,
        supplier: formData.supplier,
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        totalCost,
        purchaseDate: formData.purchaseDate + 'T00:00:00.000Z',
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        invoiceNumber: formData.invoiceNumber,
        notes: formData.notes,
        createdAt: purchase?.createdAt || new Date().toISOString(),
      };

      if (isEditing) {
        await updateStockPurchase(purchaseData);
      } else {
        // Create the purchase
        await addStockPurchase(purchaseData);

        // Update product stock
        const updatedProduct = {
          ...selectedProduct,
          currentStock: selectedProduct.currentStock + formData.quantity,
          averagePurchasePrice: ((selectedProduct.averagePurchasePrice * selectedProduct.currentStock) + totalCost) / (selectedProduct.currentStock + formData.quantity),
          updatedAt: new Date().toISOString(),
        };
        await updateDigitalProduct(updatedProduct);

        // Add stock movement
        const movement: StockMovement = {
          id: generateId(),
          productId: formData.productId,
          type: 'purchase',
          quantity: formData.quantity,
          previousStock: selectedProduct.currentStock,
          newStock: selectedProduct.currentStock + formData.quantity,
          reference: purchaseData.id,
          date: new Date().toISOString(),
          notes: `Achat de ${formData.quantity} unités`,
        };
        await addStockMovement(movement);
      }

      onSave();
    } catch (error) {
      console.error('Error saving purchase:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const totalCost = formData.quantity * formData.unitCost;

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
            {isEditing ? 'Modifier l\'achat' : 'Nouvel achat de stock'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modifiez les informations de l\'achat' : 'Enregistrez un nouvel achat de stock'}
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
          {/* Purchase Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Informations d'achat
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produit *
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => handleInputChange('productId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un produit</option>
                {digitalProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.currentStock})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur *
              </label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom du fournisseur"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coût unitaire *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.unitCost}
                onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'achat *
              </label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Numéro de facture (optionnel)"
              />
            </div>
            
            {/* Total Cost Display */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">Coût total:</span>
                <span className="text-lg font-bold text-green-600">
                  {totalCost.toFixed(2)} DZD
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-green-700">
                  {formData.quantity} × {formData.unitCost.toFixed(2)} DZD
                </span>
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
                placeholder="Notes ou remarques sur cet achat..."
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
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {isLoading ? 'Sauvegarde...' : t('save', settings.language)}
          </button>
        </div>
      </form>
    </div>
  );
}