import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Package, Plus, Trash2, Save, Edit2, CheckCircle } from 'lucide-react';

export function ProductSettings() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  
  const [productSettings, setProductSettings] = useState({
    productCategories: [...settings.productCategories],
    productStatuses: [...settings.productStatuses],
  });

  const [newCategory, setNewCategory] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: productSettings,
    });
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const addCategory = () => {
    if (newCategory.trim() && !productSettings.productCategories.includes(newCategory.trim().toLowerCase())) {
      setProductSettings(prev => ({
        ...prev,
        productCategories: [...prev.productCategories, newCategory.trim().toLowerCase()],
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    // Empêcher la suppression des catégories de base
    const baseCategories = ['iptv', 'digital-account', 'digitali'];
    if (baseCategories.includes(category)) {
      alert('Impossible de supprimer cette catégorie de base');
      return;
    }
    
    setProductSettings(prev => ({
      ...prev,
      productCategories: prev.productCategories.filter(c => c !== category),
    }));
  };

  const addStatus = () => {
    if (newStatus.trim() && !productSettings.productStatuses.includes(newStatus.trim().toLowerCase())) {
      setProductSettings(prev => ({
        ...prev,
        productStatuses: [...prev.productStatuses, newStatus.trim().toLowerCase()],
      }));
      setNewStatus('');
    }
  };

  const removeStatus = (status: string) => {
    // Empêcher la suppression des statuts de base
    const baseStatuses = ['actif', 'en rupture', 'expiré', 'archivé'];
    if (baseStatuses.includes(status)) {
      alert('Impossible de supprimer ce statut de base');
      return;
    }
    
    setProductSettings(prev => ({
      ...prev,
      productStatuses: prev.productStatuses.filter(s => s !== status),
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
              <Package className="w-5 h-5 mr-2" />
              Paramètres des Produits Digitaux
            </h3>
            <p className="text-gray-600 mt-1">
              Gérez les catégories et statuts de vos produits
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

      {/* Product Categories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Catégories de Produits
        </h4>
        
        <div className="space-y-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nouvelle catégorie (ex: Netflix, Spotify, Adobe...)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productSettings.productCategories.map((category) => {
              const isBaseCategory = ['iptv', 'digital-account', 'digitali'].includes(category);
              return (
                <div
                  key={category}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isBaseCategory ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {category}
                    {isBaseCategory && <span className="text-xs text-blue-600 ml-2">(Base)</span>}
                  </span>
                  {!isBaseCategory && (
                    <button
                      onClick={() => removeCategory(category)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Info:</strong> Les nouvelles catégories seront automatiquement disponibles 
              lors de l'ajout de produits. Les catégories de base (IPTV, Compte Numérique, Digitali) 
              ne peuvent pas être supprimées.
            </p>
          </div>
        </div>
      </div>

      {/* Product Statuses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Statuts des Produits
        </h4>
        
        <div className="space-y-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="Nouveau statut (ex: en promotion, suspendu...)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addStatus()}
            />
            <button
              onClick={addStatus}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {productSettings.productStatuses.map((status) => {
              const isBaseStatus = ['actif', 'en rupture', 'expiré', 'archivé'].includes(status);
              return (
                <div
                  key={status}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isBaseStatus ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {status}
                    {isBaseStatus && <span className="text-xs text-green-600 ml-2">(Base)</span>}
                  </span>
                  {!isBaseStatus && (
                    <button
                      onClick={() => removeStatus(status)}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Gestion des Alertes de Stock
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil d'alerte global par défaut
            </label>
            <input
              type="number"
              min="0"
              defaultValue="5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Nombre d'unités minimum avant alerte
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAlert"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoAlert" className="ml-2 block text-sm text-gray-900">
                Alertes automatiques activées
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailAlert"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailAlert" className="ml-2 block text-sm text-gray-900">
                Envoyer par email
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dashboardAlert"
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="dashboardAlert" className="ml-2 block text-sm text-gray-900">
                Afficher sur le tableau de bord
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Default Subscription Periods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Périodes d'Abonnement par Défaut
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-gray-700">Durées Prédéfinies</h5>
            
            {[
              { value: '1month', label: '1 Mois', days: 30 },
              { value: '3months', label: '3 Mois', days: 90 },
              { value: '6months', label: '6 Mois', days: 180 },
              { value: '12months', label: '12 Mois', days: 365 },
            ].map((period) => (
              <div key={period.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-900">{period.label}</span>
                  <span className="text-sm text-gray-500 ml-2">({period.days} jours)</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-gray-700">Notifications d'Expiration</h5>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alerter avant expiration (jours)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                defaultValue="7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="expirationEmail"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="expirationEmail" className="ml-2 block text-sm text-gray-900">
                  Notification par email
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="expirationDashboard"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="expirationDashboard" className="ml-2 block text-sm text-gray-900">
                  Afficher sur le tableau de bord
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}