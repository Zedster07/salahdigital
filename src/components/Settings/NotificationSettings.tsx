import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Bell, Mail, Smartphone, AlertTriangle, Save } from 'lucide-react';

export function NotificationSettings() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockNotifications: settings.lowStockNotifications,
    expirationNotifications: settings.expirationNotifications,
    emailNotifications: settings.emailNotifications,
    notifications: settings.notifications,
  });

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: notificationSettings,
    });
    alert('Paramètres de notification sauvegardés !');
  };

  const updateSetting = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Paramètres de Notifications
            </h3>
            <p className="text-gray-600 mt-1">
              Configurez vos préférences de notifications et alertes
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

      {/* General Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notifications Générales
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Notifications Push</h5>
              <p className="text-sm text-gray-600">Recevoir des notifications dans l'application</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Notifications Email</h5>
              <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Alertes de Stock
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Alertes Stock Bas</h5>
              <p className="text-sm text-gray-600">Être alerté quand un produit atteint le seuil minimum</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.lowStockNotifications}
                onChange={(e) => updateSetting('lowStockNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <h5 className="text-sm font-medium text-gray-900">Alertes d'Expiration</h5>
              <p className="text-sm text-gray-600">Être alerté avant l'expiration des abonnements</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.expirationNotifications}
                onChange={(e) => updateSetting('expirationNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Types de Notifications à Recevoir
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'sales', label: 'Nouvelles Ventes', description: 'Notification à chaque vente réalisée' },
            { id: 'purchases', label: 'Nouveaux Achats', description: 'Notification à chaque achat de stock' },
            { id: 'lowStock', label: 'Stock Bas', description: 'Alerte quand le stock est faible' },
            { id: 'expiration', label: 'Expirations', description: 'Alerte avant expiration des abonnements' },
            { id: 'newCustomer', label: 'Nouveaux Clients', description: 'Notification pour chaque nouveau client' },
            { id: 'dailyReport', label: 'Rapport Quotidien', description: 'Résumé quotidien des activités' },
          ].map((notification) => (
            <div key={notification.id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id={notification.id}
                defaultChecked
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <div className="flex-1">
                <label htmlFor={notification.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                  {notification.label}
                </label>
                <p className="text-sm text-gray-600">{notification.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2" />
          Configuration Email
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse Email de Notification
            </label>
            <input
              type="email"
              defaultValue="admin@digitalmanager.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              Adresse où recevoir les notifications
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence des Rapports
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="never">Jamais</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Fréquence d'envoi des rapports automatiques
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Notifications Mobiles
        </h4>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="text-sm font-medium text-blue-900 mb-2">📱 Application Mobile (Bientôt)</h5>
            <p className="text-sm text-blue-700">
              Les notifications push mobiles seront disponibles avec la version mobile de l'application.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Notifications Push</span>
              <span className="text-sm text-gray-500">Bientôt disponible</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">SMS Notifications</span>
              <span className="text-sm text-gray-500">Bientôt disponible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}