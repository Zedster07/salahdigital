import React, { useState, useEffect } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import { generateId } from '../../utils/helpers';
import { StockSale, StockMovement, Platform, DigitalProduct } from '../../types';
import {
  ArrowLeft,
  Save,
  X,
  User,
  Plus,
  DollarSign,
  CreditCard,
  Calendar,
  Package,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Clock
} from 'lucide-react';

interface SaleFormProps {
  sale?: StockSale | null;
  onSave: () => void;
  onCancel: () => void;
}

export function SaleForm({ sale, onSave, onCancel }: SaleFormProps) {
  const { state } = useApp();
  const { addStockSale, updateStockSale, addStockMovement, updateDigitalProduct } = useDatabase();
  const { digitalProducts, subscribers, settings, platforms } = state;
  const isEditing = !!sale;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced state for platform-based workflow (Task 17)
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<DigitalProduct[]>([]);
  const [profitCalculation, setProfitCalculation] = useState({
    buyingPrice: 0,
    sellingPrice: 0,
    profit: 0,
    profitMargin: 0
  });

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
    // Platform-related fields (Task 11)
    platformId: '',
    platformBuyingPrice: 0,
    paymentType: 'one-time' as 'one-time' | 'recurring',
    subscriptionDuration: 1,
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
        // Platform-related fields (Task 11)
        platformId: sale.platformId || '',
        platformBuyingPrice: sale.platformBuyingPrice || 0,
        paymentType: sale.paymentType || 'one-time',
        subscriptionDuration: sale.subscriptionDuration || 1,
        notes: sale.notes || '',
      });
      setUseExistingCustomer(!!sale.subscriberId);

      // Set selected platform if editing
      if (sale.platformId) {
        const platform = platforms.find(p => p.id === sale.platformId);
        setSelectedPlatform(platform || null);
      }
    }
  }, [sale, platforms]);

  // Filter products based on selected platform (Task 17)
  useEffect(() => {
    if (selectedPlatform) {
      const platformProducts = digitalProducts.filter(product =>
        product.platformId === selectedPlatform.id && product.isActive
      );
      setFilteredProducts(platformProducts);
    } else {
      // Show all products if no platform selected
      setFilteredProducts(digitalProducts.filter(product => product.isActive));
    }
  }, [selectedPlatform, digitalProducts]);

  // Calculate profit in real-time (Task 17)
  useEffect(() => {
    const buyingPrice = formData.platformBuyingPrice || 0;
    const sellingPrice = formData.unitPrice || 0;
    const quantity = formData.quantity || 1;

    const totalBuyingCost = buyingPrice * quantity;
    const totalSellingPrice = sellingPrice * quantity;
    const profit = totalSellingPrice - totalBuyingCost;
    const profitMargin = totalSellingPrice > 0 ? (profit / totalSellingPrice) * 100 : 0;

    setProfitCalculation({
      buyingPrice: totalBuyingCost,
      sellingPrice: totalSellingPrice,
      profit,
      profitMargin
    });
  }, [formData.platformBuyingPrice, formData.unitPrice, formData.quantity]);

  const selectedProduct = digitalProducts.find(p => p.id === formData.productId);
  const selectedSubscriber = subscribers.find(s => s.id === formData.subscriberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      setError('Veuillez sélectionner un produit');
      return;
    }

    if (formData.quantity > selectedProduct.currentStock) {
      setError('Quantité insuffisante en stock !');
      return;
    }

    // Enhanced validation for platform-based workflow (Task 17)
    if (selectedPlatform && !validatePlatformCredits()) {
      setError(`Crédits insuffisants sur la plateforme ${selectedPlatform.name}. Solde actuel: ${selectedPlatform.creditBalance} DZD, Requis: ${(formData.platformBuyingPrice * formData.quantity).toFixed(2)} DZD`);
      return;
    }

    if (formData.paymentType === 'recurring' && (!formData.subscriptionDuration || formData.subscriptionDuration < 1)) {
      setError('Veuillez spécifier une durée d\'abonnement valide pour les paiements récurrents');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const totalPrice = formData.quantity * formData.unitPrice;
      // Use platform buying price if available, otherwise fall back to average purchase price (Task 11)
      const unitCost = formData.platformBuyingPrice > 0
        ? formData.platformBuyingPrice
        : selectedProduct.averagePurchasePrice;
      const costPrice = unitCost * formData.quantity;
      const profit = totalPrice - costPrice;

      // Enhanced subscription handling (Task 17)
      const subscriptionStartDate = formData.paymentType === 'recurring' ? formData.saleDate + 'T00:00:00.000Z' : undefined;
      const subscriptionEndDate = formData.paymentType === 'recurring' && subscriptionStartDate
        ? getSubscriptionEndDate(subscriptionStartDate, formData.subscriptionDuration)
        : undefined;

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
        // Enhanced platform-related fields (Task 17)
        platformId: formData.platformId || undefined,
        platformBuyingPrice: formData.platformBuyingPrice,
        paymentType: formData.paymentType,
        subscriptionDuration: formData.paymentType === 'recurring' ? formData.subscriptionDuration : undefined,
        subscriptionStartDate,
        subscriptionEndDate,
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
      // Auto-populate platform information if product has platform association (Task 17)
      platformId: product?.platformId || '',
      platformBuyingPrice: product?.platformBuyingPrice || 0,
    }));

    // Update selected platform if product has platform association
    if (product?.platformId) {
      const platform = platforms.find(p => p.id === product.platformId);
      setSelectedPlatform(platform || null);
    }
  };

  // Enhanced platform selection handler (Task 17)
  const handlePlatformChange = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    setSelectedPlatform(platform || null);

    setFormData(prev => ({
      ...prev,
      platformId,
      // Reset product selection when platform changes
      productId: '',
      unitPrice: 0,
      platformBuyingPrice: 0,
    }));
  };

  // Validate platform credits (Task 17)
  const validatePlatformCredits = (): boolean => {
    if (!selectedPlatform || !formData.platformBuyingPrice) {
      return true; // No platform selected or no buying price
    }

    const requiredCredits = formData.platformBuyingPrice * formData.quantity;
    return selectedPlatform.creditBalance >= requiredCredits;
  };

  // Get subscription end date (Task 17)
  const getSubscriptionEndDate = (startDate: string, duration: number): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + duration);
    return end.toISOString();
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
  // Use platform buying price if available, otherwise fall back to average purchase price (Task 11)
  const unitCost = formData.platformBuyingPrice > 0
    ? formData.platformBuyingPrice
    : selectedProduct?.averagePurchasePrice || 0;
  const costPrice = unitCost * formData.quantity;
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

      {/* Enhanced Form with Platform Integration (Task 17) */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-8">
          {/* Platform Selection Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Sélection de Plateforme
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plateforme Fournisseur
                </label>
                <select
                  value={formData.platformId}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner une plateforme</option>
                  {platforms.filter(p => p.isActive).map(platform => (
                    <option key={platform.id} value={platform.id}>
                      {platform.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlatform && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Solde Crédit:</span>
                    <span className={`text-lg font-bold ${
                      selectedPlatform.creditBalance < 100
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {selectedPlatform.creditBalance.toFixed(2)} DZD
                    </span>
                  </div>
                  {selectedPlatform.creditBalance < 100 && (
                    <div className="flex items-center mt-2 text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Solde faible</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Selection */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Sélection Produit
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Produit *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un produit</option>
                  {filteredProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.currentStock}
                    </option>
                  ))}
                </select>
                {selectedPlatform && filteredProducts.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    Aucun produit disponible pour cette plateforme
                  </p>
                )}
              </div>

              {selectedProduct && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Détails du Produit</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Catégorie:</span>
                      <span className="text-gray-900 dark:text-white capitalize">{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Stock disponible:</span>
                      <span className={`font-medium ${
                        selectedProduct.currentStock <= selectedProduct.minStockAlert
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {selectedProduct.currentStock} unités
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Prix suggéré:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {selectedProduct.suggestedSellPrice.toFixed(2)} DZD
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct?.currentStock || 999}
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prix unitaire (DZD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Payment and Pricing Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Paiement et Tarification
              </h3>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Type de Paiement *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="paymentType"
                      value="one-time"
                      checked={formData.paymentType === 'one-time'}
                      onChange={(e) => handleInputChange('paymentType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.paymentType === 'one-time'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.paymentType === 'one-time' && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Paiement Unique</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Achat ponctuel</div>
                    </div>
                  </label>

                  <label className="relative flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="paymentType"
                      value="recurring"
                      checked={formData.paymentType === 'recurring'}
                      onChange={(e) => handleInputChange('paymentType', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.paymentType === 'recurring'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.paymentType === 'recurring' && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Abonnement</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Paiement récurrent</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Subscription Duration (only for recurring payments) */}
              {formData.paymentType === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Durée d'Abonnement (mois) *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 6, 12].map(duration => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => handleInputChange('subscriptionDuration', duration)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.subscriptionDuration === duration
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {duration} mois
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.subscriptionDuration}
                    onChange={(e) => handleInputChange('subscriptionDuration', parseInt(e.target.value) || 1)}
                    placeholder="Durée personnalisée"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              )}

              {/* Platform Buying Price */}
              {selectedPlatform && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prix d'Achat Plateforme (DZD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.platformBuyingPrice}
                    onChange={(e) => handleInputChange('platformBuyingPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Profit Calculation Display */}
              {(formData.unitPrice > 0 || formData.platformBuyingPrice > 0) && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center mb-3">
                    <Calculator className="h-4 w-4 mr-2 text-green-600" />
                    Calcul de Rentabilité
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Coût d'achat:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {profitCalculation.buyingPrice.toFixed(2)} DZD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Prix de vente:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {profitCalculation.sellingPrice.toFixed(2)} DZD
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Bénéfice:</span>
                        <span className={`font-bold ${
                          profitCalculation.profit >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {profitCalculation.profit >= 0 ? '+' : ''}{profitCalculation.profit.toFixed(2)} DZD
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Marge:</span>
                        <span className={`font-bold ${
                          profitCalculation.profitMargin >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {profitCalculation.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Credit requirement validation */}
                  {selectedPlatform && formData.platformBuyingPrice > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Crédits requis:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {(formData.platformBuyingPrice * formData.quantity).toFixed(2)} DZD
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Solde disponible:</span>
                        <span className={`text-sm font-medium ${
                          validatePlatformCredits()
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {selectedPlatform.creditBalance.toFixed(2)} DZD
                        </span>
                      </div>
                      {!validatePlatformCredits() && (
                        <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Crédits insuffisants</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Informations Client
            </h3>

            <div className="space-y-4">
              {/* Customer Type Selection */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerType"
                    checked={useExistingCustomer}
                    onChange={() => setUseExistingCustomer(true)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Client existant</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerType"
                    checked={!useExistingCustomer}
                    onChange={() => setUseExistingCustomer(false)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Nouveau client</span>
                </label>
              </div>

              {useExistingCustomer ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sélectionner un client
                  </label>
                  <select
                    value={formData.subscriberId}
                    onChange={(e) => handleInputChange('subscriberId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Choisir un client</option>
                    {subscribers.map(subscriber => (
                      <option key={subscriber.id} value={subscriber.id}>
                        {subscriber.name} - {subscriber.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du client *
                    </label>
                    <input
                      type="text"
                      value={formData.customCustomerName}
                      onChange={(e) => handleInputChange('customCustomerName', e.target.value)}
                      required={!useExistingCustomer}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.customCustomerPhone}
                      onChange={(e) => handleInputChange('customCustomerPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de vente *
              </label>
              <input
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleInputChange('saleDate', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Méthode de paiement *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
                <option value="transfer">Virement</option>
                <option value="check">Chèque</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut du paiement *
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="partial">Partiel</option>
                <option value="failed">Échoué</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>

          {/* Subscription Summary (for recurring payments) */}
          {formData.paymentType === 'recurring' && formData.subscriptionDuration > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center mb-3">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Résumé de l'Abonnement
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Durée:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formData.subscriptionDuration} mois
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date de début:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(formData.saleDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Date de fin:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {(() => {
                      const endDate = new Date(formData.saleDate);
                      endDate.setMonth(endDate.getMonth() + formData.subscriptionDuration);
                      return endDate.toLocaleDateString('fr-FR');
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </button>

          <div className="flex items-center space-x-4">
            {/* Total Price Display */}
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {(formData.unitPrice * formData.quantity).toFixed(2)} DZD
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedProduct || !validatePlatformCredits()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Enregistrement...' : (isEditing ? 'Modifier la vente' : 'Enregistrer la vente')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}