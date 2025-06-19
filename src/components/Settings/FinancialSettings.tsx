import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { CreditCard, Plus, Trash2, Save, DollarSign } from 'lucide-react';

export function FinancialSettings() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  
  const [financialSettings, setFinancialSettings] = useState({
    paymentMethods: [...settings.paymentMethods],
    transactionFees: { ...settings.transactionFees },
    currency: settings.currency,
  });

  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: financialSettings,
    });
    alert('Paramètres financiers sauvegardés !');
  };

  const addPaymentMethod = () => {
    if (newPaymentMethod.trim() && !financialSettings.paymentMethods.includes(newPaymentMethod.trim())) {
      setFinancialSettings(prev => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, newPaymentMethod.trim()],
      }));
      setNewPaymentMethod('');
    }
  };

  const removePaymentMethod = (method: string) => {
    setFinancialSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(m => m !== method),
    }));
  };

  const updateTransactionFee = (method: string, fee: number) => {
    setFinancialSettings(prev => ({
      ...prev,
      transactionFees: {
        ...prev.transactionFees,
        [method]: fee,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Paramètres Financiers
            </h3>
            <p className="text-gray-600 mt-1">
              Configurez les modes de paiement et frais de transaction
            </p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Devise Principale
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Devise de Gestion
            </label>
            <select
              value={financialSettings.currency}
              onChange={(e) => setFinancialSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DZD">Dinar Algérien (DZD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar US (USD)</option>
              <option value="MAD">Dirham Marocain (MAD)</option>
              <option value="TND">Dinar Tunisien (TND)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Devise utilisée pour tous les calculs et affichages
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Information</h5>
            <p className="text-sm text-blue-700">
              Changer la devise n'affecte pas les données existantes. 
              Seuls les nouveaux affichages utiliseront la nouvelle devise.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Modes de Paiement Acceptés
        </h4>
        
        <div className="space-y-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              placeholder="Nouveau mode de paiement (ex: CCP, PayPal, Crypto...)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addPaymentMethod()}
            />
            <button
              onClick={addPaymentMethod}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {financialSettings.paymentMethods.map((method) => (
              <div
                key={method}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <span className="text-sm font-medium text-gray-900 capitalize">{method}</span>
                <button
                  onClick={() => removePaymentMethod(method)}
                  className="text-red-600 hover:text-red-800 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Fees */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Frais de Transaction
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BaridiMob (%)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={financialSettings.transactionFees.baridimob}
              onChange={(e) => updateTransactionFee('baridimob', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Commission prélevée par BaridiMob
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Virement Bancaire (%)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={financialSettings.transactionFees.transfer}
              onChange={(e) => updateTransactionFee('transfer', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Frais de virement bancaire
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Autres Méthodes (%)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={financialSettings.transactionFees.other}
              onChange={(e) => updateTransactionFee('other', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Frais pour autres modes de paiement
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h5 className="text-sm font-medium text-yellow-900 mb-2">💰 Calcul des Frais</h5>
          <p className="text-sm text-yellow-800">
            Ces frais seront automatiquement déduits du montant reçu lors des ventes. 
            Par exemple, avec 2.5% de frais sur 1000 DZD, vous recevrez 975 DZD.
          </p>
        </div>
      </div>

      {/* Payment Status Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Gestion des Statuts de Paiement
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h5 className="text-sm font-medium text-green-900 mb-2">✅ Payé</h5>
            <p className="text-sm text-green-700">
              Paiement reçu intégralement
            </p>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h5 className="text-sm font-medium text-orange-900 mb-2">⏳ En Attente</h5>
            <p className="text-sm text-orange-700">
              Paiement en cours de traitement
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h5 className="text-sm font-medium text-yellow-900 mb-2">🔄 Partiel</h5>
            <p className="text-sm text-yellow-700">
              Paiement reçu partiellement
            </p>
          </div>
        </div>
      </div>

      {/* Financial Reports Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Paramètres des Rapports Financiers
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeFees"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeFees" className="ml-2 block text-sm text-gray-900">
                Inclure les frais de transaction dans les rapports
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showNetProfit"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showNetProfit" className="ml-2 block text-sm text-gray-900">
                Afficher le bénéfice net (après frais)
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="currencyConversion"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="currencyConversion" className="ml-2 block text-sm text-gray-900">
                Conversion automatique des devises
              </label>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h5 className="text-sm font-medium text-purple-900 mb-2">📊 Rapports Avancés</h5>
            <p className="text-sm text-purple-700">
              Les rapports incluront automatiquement les calculs de frais, 
              marges nettes et conversions de devises selon vos paramètres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}