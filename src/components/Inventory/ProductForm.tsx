import React, { useState, useEffect } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { DigitalProduct } from '../../types';
import {
  ArrowLeft,
  Save,
  X,
  Package,
  DollarSign,
  CreditCard,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

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
    // Platform-related fields (Task 9)
    platformId: '',
    platformBuyingPrice: 0,
    profitMargin: 30,
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
        // Platform-related fields (Task 9)
        platformId: product.platformId || '',
        platformBuyingPrice: product.platformBuyingPrice || 0,
        profitMargin: product.profitMargin || 30,
        isActive: product.isActive,
      });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Calculate selling price based on platform buying price and margin
      const calculatedSellPrice = formData.platformBuyingPrice && formData.profitMargin
        ? formData.platformBuyingPrice * (1 + formData.profitMargin / 100)
        : formData.suggestedSellPrice;

      const productData: DigitalProduct = {
        id: product?.id || generateId(),
        name: formData.name,
        category: formData.category,
        durationType: formData.durationType,
        description: formData.description,
        currentStock: formData.currentStock,
        minStockAlert: formData.minStockAlert,
        averagePurchasePrice: formData.averagePurchasePrice,
        suggestedSellPrice: calculatedSellPrice,
        // Platform-related fields (Task 9)
        platformId: formData.platformId || undefined,
        platformBuyingPrice: formData.platformBuyingPrice,
        profitMargin: formData.profitMargin,
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

  // Calculate margin based on platform pricing or traditional pricing
  const margin = formData.platformId && formData.platformBuyingPrice > 0 ?
    formData.profitMargin.toFixed(1) :
    formData.averagePurchasePrice > 0 ?
      ((formData.suggestedSellPrice - formData.averagePurchasePrice) / formData.averagePurchasePrice * 100).toFixed(1) : 0;

  const profitAmount = formData.platformId && formData.platformBuyingPrice > 0 ?
    (formData.suggestedSellPrice - formData.platformBuyingPrice) :
    (formData.suggestedSellPrice - formData.averagePurchasePrice);

  return (
    <div className="space-y-6">
      {/* Enhanced Header (Task 16) */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Modifier l\'article' : 'Ajouter un article'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Modifiez les informations de l\'article' : 'Ajoutez un nouvel article à votre catalogue'}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Form (Task 16) */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Informations de base
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de l'article *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Netflix Premium, IPTV Gold, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('category', settings.language)} *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

            {/* Enhanced Platform Association (Task 16) */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                Plateforme fournisseur
              </label>
              <select
                value={formData.platformId}
                onChange={(e) => handleInputChange('platformId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Aucune plateforme sélectionnée</option>
                {state.platforms?.filter(p => p.isActive).map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name} (Solde: {platform.creditBalance.toFixed(2)} DZD)
                  </option>
                ))}
              </select>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Associez ce produit à une plateforme fournisseur pour la gestion automatique des crédits
              </p>
              {formData.platformId && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Plateforme associée - Gestion automatique des crédits activée
                  </div>
                </div>
              )}
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

          {/* Enhanced Stock and Pricing Section (Task 16) */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
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
            
            {/* Platform-specific pricing (Task 9) */}
            {formData.platformId ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix d'achat plateforme *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={!!formData.platformId}
                    value={formData.platformBuyingPrice}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      handleInputChange('platformBuyingPrice', newPrice);
                      // Auto-calculate selling price when buying price changes
                      if (formData.profitMargin > 0) {
                        const calculatedPrice = newPrice * (1 + formData.profitMargin / 100);
                        handleInputChange('suggestedSellPrice', calculatedPrice);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prix d'achat depuis la plateforme"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    💰 Coût d'achat de ce produit depuis la plateforme sélectionnée
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marge bénéficiaire (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required={!!formData.platformId}
                    value={formData.profitMargin}
                    onChange={(e) => {
                      const newMargin = parseFloat(e.target.value) || 0;
                      handleInputChange('profitMargin', newMargin);
                      // Auto-calculate selling price when margin changes
                      if (formData.platformBuyingPrice > 0) {
                        const calculatedPrice = formData.platformBuyingPrice * (1 + newMargin / 100);
                        handleInputChange('suggestedSellPrice', calculatedPrice);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    📈 Pourcentage de marge bénéficiaire souhaité
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de vente calculé
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.suggestedSellPrice}
                    onChange={(e) => handleInputChange('suggestedSellPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Prix calculé automatiquement"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    🧮 Calculé automatiquement: Prix d'achat + Marge
                  </p>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
            
            {/* Enhanced Profit Calculation Display (Task 16) */}
            {((formData.platformId && formData.platformBuyingPrice > 0) ||
              (!formData.platformId && formData.averagePurchasePrice > 0)) &&
              formData.suggestedSellPrice > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-3 flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Analyse de Rentabilité
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 dark:text-green-300">Marge bénéficiaire:</span>
                    <span className={`text-lg font-bold ${
                      parseFloat(margin) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {margin}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 dark:text-green-300">Bénéfice par vente:</span>
                    <span className={`text-sm font-semibold ${
                      profitAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {profitAmount >= 0 ? '+' : ''}{profitAmount.toFixed(2)} DZD
                    </span>
                  </div>

                  {formData.platformId && (
                    <>
                      <div className="border-t border-green-200 dark:border-green-700 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Coût plateforme:</span>
                          <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                            {formData.platformBuyingPrice.toFixed(2)} DZD
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-green-700 dark:text-green-300">Prix de vente:</span>
                          <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                            {formData.suggestedSellPrice.toFixed(2)} DZD
                          </span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-600">
                        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Gestion automatique des crédits plateforme activée
                        </div>
                      </div>
                    </>
                  )}
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