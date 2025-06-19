import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { DollarSign, TrendingUp, RefreshCw, Save, CheckCircle } from 'lucide-react';

export function PricingSettings() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  
  const [pricingSettings, setPricingSettings] = useState({
    defaultProfitMargin: settings.defaultProfitMargin,
    exchangeRates: { ...settings.exchangeRates },
    categoryPricing: { ...settings.categoryPricing },
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: pricingSettings,
    });
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateExchangeRate = (currency: string, rate: number) => {
    setPricingSettings(prev => ({
      ...prev,
      exchangeRates: {
        ...prev.exchangeRates,
        [currency]: rate,
      },
    }));
  };

  const updateCategoryPrice = (category: string, price: number) => {
    setPricingSettings(prev => ({
      ...prev,
      categoryPricing: {
        ...prev.categoryPricing,
        [category]: price,
      },
    }));
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Sauvegarde...
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Sauvegardé !
          </>
        );
      default:
        return (
          <>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Paramètres de Tarification
            </h3>
            <p className="text-gray-600 mt-1">
              Configurez vos marges, taux de change et prix par catégorie
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'saving'
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {getSaveButtonContent()}
          </button>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Marge Bénéficiaire par Défaut
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marge par défaut (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={pricingSettings.defaultProfitMargin}
              onChange={(e) => setPricingSettings(prev => ({
                ...prev,
                defaultProfitMargin: parseFloat(e.target.value) || 0,
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Cette marge sera appliquée automatiquement aux nouveaux produits
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Exemple de Calcul</h5>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Prix d'achat: 100 DZD</div>
              <div>Marge: {pricingSettings.defaultProfitMargin}%</div>
              <div className="font-semibold">
                Prix de vente: {(100 * (1 + pricingSettings.defaultProfitMargin / 100)).toFixed(0)} DZD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2" />
          Taux de Change
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EUR → DZD
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricingSettings.exchangeRates.EUR_DZD}
              onChange={(e) => updateExchangeRate('EUR_DZD', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              1 EUR = {pricingSettings.exchangeRates.EUR_DZD} DZD
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              USD → DZD
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricingSettings.exchangeRates.USD_DZD}
              onChange={(e) => updateExchangeRate('USD_DZD', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              1 USD = {pricingSettings.exchangeRates.USD_DZD} DZD
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Conseil:</strong> Mettez à jour régulièrement ces taux pour refléter les fluctuations du marché
          </p>
        </div>
      </div>

      {/* Category Pricing */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Prix Standards par Catégorie
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IPTV (DZD)
            </label>
            <input
              type="number"
              min="0"
              value={pricingSettings.categoryPricing.iptv}
              onChange={(e) => updateCategoryPrice('iptv', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Prix suggéré pour les abonnements IPTV
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compte Numérique (DZD)
            </label>
            <input
              type="number"
              min="0"
              value={pricingSettings.categoryPricing['digital-account']}
              onChange={(e) => updateCategoryPrice('digital-account', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Prix suggéré pour les comptes numériques
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offre Digitali (DZD)
            </label>
            <input
              type="number"
              min="0"
              value={pricingSettings.categoryPricing.digitali}
              onChange={(e) => updateCategoryPrice('digitali', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Prix suggéré pour les offres Digitali
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Résumé des Prix
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(pricingSettings.categoryPricing).map(([category, price]) => {
            const categoryNames = {
              iptv: 'IPTV',
              'digital-account': 'Compte Numérique',
              digitali: 'Offre Digitali',
            };
            
            return (
              <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {categoryNames[category as keyof typeof categoryNames]}
                </h5>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(price, settings.currency)}
                </p>
                <p className="text-sm text-gray-500">
                  Prix standard
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}