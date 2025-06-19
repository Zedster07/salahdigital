import React, { useState, useEffect } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { DigitalProduct } from '../../types';
import { ArrowLeft, Save, X } from 'lucide-react';

interface ProductFormProps {
  product?: DigitalProduct | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const { state } = useApp();
  const { addDigitalProduct, updateDigitalProduct } = useDatabase();
  const { settings } = state;
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: '',
    category: 'iptv' as 'iptv' | 'digital-account' | 'digitali',
    durationType: '1month' as '1month' | '3months' | '6months' | '12months' | 'custom',
    description: '',
    currentStock: 0,
    minStockAlert: 5,
    averagePurchasePrice: 0,
    suggestedSellPrice: 0,
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        durationType: product.durationType,
        description: product.description || '',
        currentStock: product.currentStock,
        minStockAlert: product.minStockAlert,
        averagePurchasePrice: product.averagePurchasePrice,
        suggestedSellPrice: product.suggestedSellPrice,
        isActive: product.isActive,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const productData: DigitalProduct = {
        id: product?.id || generateId(),
        name: formData.name,
        category: formData.category,
        durationType: formData.durationType,
        description: formData.description,
        currentStock: formData.currentStock,
        minStockAlert: formData.minStockAlert,
        averagePurchasePrice: formData.averagePurchasePrice,
        suggestedSellPrice: formData.suggestedSellPrice,
        isActive: formData.isActive,
        createdAt: product?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isEditing) {
        await updateDigitalProduct(productData);
      } else {
        await addDigitalProduct(productData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Utiliser les catégories depuis les paramètres
  const availableCategories = settings.productCategories || ['iptv', 'digital-account', 'digitali'];
  
  const categories = availableCategories.map(cat => ({
    value: cat,
    label: cat === 'iptv' ? 'IPTV' : 
          cat === 'digital-account' ? t('digitalAccount', settings.language) :
          cat === 'digitali' ? t('digitali', settings.language) :
          cat.charAt(0).toUpperCase() + cat.slice(1)
  }));

  const durations = [
    { value: '1month', label: t('1month', settings.language) },
    { value: '3months', label: t('3months', settings.language) },
    { value: '6months', label: t('6months', settings.language) },
    { value: '12months', label: t('12months', settings.language) },
    { value: 'custom', label: t('custom', settings.language) },
  ];

  const margin = formData.averagePurchasePrice > 0 ? 
    ((formData.suggestedSellPrice - formData.averagePurchasePrice) / formData.averagePurchasePrice * 100).toFixed(1) : 0;

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
            {isEditing ? 'Modifier l\'article' : 'Ajouter un article'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Modifiez les informations de l\'article' : 'Ajoutez un nouvel article à votre catalogue'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Informations de base
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'article *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Netflix Premium, IPTV Gold, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('category', settings.language)} *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                💡 Vous pouvez ajouter de nouvelles catégories dans les Paramètres
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de durée *
              </label>
              <select
                required
                value={formData.durationType}
                onChange={(e) => handleInputChange('durationType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description de l'article..."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Article actif
              </label>
            </div>
          </div>

          {/* Stock and Pricing */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Stock et tarification
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock actuel
              </label>
              <input
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil d'alerte stock bas *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minStockAlert}
                onChange={(e) => handleInputChange('minStockAlert', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix d'achat moyen
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.averagePurchasePrice}
                onChange={(e) => handleInputChange('averagePurchasePrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix de vente suggéré
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.suggestedSellPrice}
                onChange={(e) => handleInputChange('suggestedSellPrice', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              {settings.categoryPricing && settings.categoryPricing[formData.category as keyof typeof settings.categoryPricing] && (
                <p className="text-sm text-gray-500 mt-1">
                  💡 Prix suggéré par défaut: {settings.categoryPricing[formData.category as keyof typeof settings.categoryPricing]} DZD
                </p>
              )}
            </div>
            
            {/* Margin Display */}
            {formData.averagePurchasePrice > 0 && formData.suggestedSellPrice > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Marge bénéficiaire:</span>
                  <span className="text-lg font-bold text-blue-600">{margin}%</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-blue-700">Bénéfice par vente:</span>
                  <span className="text-sm font-semibold text-blue-800">
                    {(formData.suggestedSellPrice - formData.averagePurchasePrice).toFixed(2)} DZD
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 inline mr-2" />
            {t('cancel', settings.language)}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
            ) : (
              <Save className="w-4 h-4 inline mr-2" />
            )}
            {isLoading ? 'Sauvegarde...' : t('save', settings.language)}
          </button>
        </div>
      </form>
    </div>
  );
}