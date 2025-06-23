import React, { useState, useEffect } from 'react';
import { notificationService, NotificationSettings as INotificationSettings, AlertThreshold } from '../../services/NotificationService';
import { emailAlertService, EmailRecipient } from '../../services/EmailAlertService';
import { useApp } from '../../contexts/AppContext';
import { formatCurrency } from '../../utils/helpers';
import { 
  Bell, 
  Mail, 
  Clock, 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  Test,
  AlertTriangle,
  CheckCircle,
  Settings,
  User,
  CreditCard
} from 'lucide-react';

export function NotificationSettings() {
  const { state } = useApp();
  const { platforms } = state;
  
  const [notificationSettings, setNotificationSettings] = useState<INotificationSettings>(
    notificationService.getSettings()
  );
  const [emailSettings, setEmailSettings] = useState(emailAlertService.getSettings());
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [newRecipient, setNewRecipient] = useState<Partial<EmailRecipient>>({});
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'thresholds'>('general');

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = () => {
    const allThresholds = notificationService.getAllAlertThresholds();
    setThresholds(allThresholds);
  };

  const handleNotificationSettingsChange = (key: keyof INotificationSettings, value: any) => {
    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);
    notificationService.updateSettings({ [key]: value });
  };

  const handleEmailSettingsChange = (key: string, value: any) => {
    const updated = { ...emailSettings, [key]: value };
    setEmailSettings(updated);
    emailAlertService.updateSettings({ [key]: value });
  };

  const handleQuietHoursChange = (key: string, value: any) => {
    const updated = {
      ...notificationSettings,
      quietHours: { ...notificationSettings.quietHours, [key]: value }
    };
    setNotificationSettings(updated);
    notificationService.updateSettings({ quietHours: updated.quietHours });
  };

  const handleThresholdChange = (platformId: string, field: keyof AlertThreshold, value: any) => {
    const existingThreshold = thresholds.find(t => t.platformId === platformId);
    const updatedThreshold = existingThreshold 
      ? { ...existingThreshold, [field]: value }
      : { 
          platformId, 
          lowBalanceThreshold: 1000, 
          criticalBalanceThreshold: 100, 
          customThresholdEnabled: false,
          alertFrequency: 'daily' as const,
          [field]: value 
        };

    notificationService.setAlertThreshold(platformId, updatedThreshold);
    loadThresholds();
  };

  const addEmailRecipient = () => {
    if (newRecipient.email) {
      emailAlertService.addRecipient({
        email: newRecipient.email,
        name: newRecipient.name || '',
        role: newRecipient.role || 'operator',
        platformIds: newRecipient.platformIds || []
      });
      setNewRecipient({});
      setEmailSettings(emailAlertService.getSettings());
    }
  };

  const removeEmailRecipient = (email: string) => {
    emailAlertService.removeRecipient(email);
    setEmailSettings(emailAlertService.getSettings());
  };

  const testEmailConfiguration = async () => {
    setIsTestingEmail(true);
    setTestResult(null);
    
    try {
      const result = await emailAlertService.testEmailConfiguration();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Bell },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'thresholds', label: 'Seuils', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres de Notification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configurez les alertes et notifications du système
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Paramètres Généraux
              </h3>

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">Types de Notifications</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.lowCreditEnabled}
                      onChange={(e) => handleNotificationSettingsChange('lowCreditEnabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Alertes crédit faible
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.criticalCreditEnabled}
                      onChange={(e) => handleNotificationSettingsChange('criticalCreditEnabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Alertes crédit critique
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.dailySummaryEnabled}
                      onChange={(e) => handleNotificationSettingsChange('dailySummaryEnabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Résumé quotidien
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationSettings.inAppNotificationsEnabled}
                      onChange={(e) => handleNotificationSettingsChange('inAppNotificationsEnabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Notifications dans l'application
                    </span>
                  </label>
                </div>
              </div>

              {/* Check Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intervalle de vérification (minutes)
                </label>
                <select
                  value={notificationSettings.checkInterval}
                  onChange={(e) => handleNotificationSettingsChange('checkInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>

              {/* Quiet Hours */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Heures Silencieuses
                </h4>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationSettings.quietHours.enabled}
                    onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                    Activer les heures silencieuses
                  </span>
                </label>

                {notificationSettings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 ml-7">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Début
                      </label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.startTime}
                        onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Fin
                      </label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.endTime}
                        onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configuration Email
                </h3>
                <button
                  onClick={testEmailConfiguration}
                  disabled={isTestingEmail}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isTestingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Test className="h-4 w-4 mr-2" />
                  )}
                  Tester Configuration
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                }`}>
                  <div className="flex items-center">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    )}
                    <span className={`text-sm ${
                      testResult.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                </div>
              )}

              {/* Email Enable */}
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.enabled}
                  onChange={(e) => handleEmailSettingsChange('enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Activer les notifications par email
                </span>
              </label>

              {/* Email Recipients */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Destinataires Email
                </h4>

                {/* Add New Recipient */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ajouter un destinataire
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newRecipient.email || ''}
                      onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Nom (optionnel)"
                      value={newRecipient.name || ''}
                      onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <select
                      value={newRecipient.role || 'operator'}
                      onChange={(e) => setNewRecipient({ ...newRecipient, role: e.target.value as any })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="admin">Administrateur</option>
                      <option value="manager">Manager</option>
                      <option value="operator">Opérateur</option>
                    </select>
                    <button
                      onClick={addEmailRecipient}
                      disabled={!newRecipient.email}
                      className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Recipients List */}
                <div className="space-y-2">
                  {emailSettings.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {recipient.name || recipient.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {recipient.email} • {recipient.role}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeEmailRecipient(recipient.email)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Threshold Settings */}
          {activeTab === 'thresholds' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Seuils d'Alerte par Plateforme
              </h3>

              <div className="space-y-4">
                {platforms.map((platform) => {
                  const threshold = thresholds.find(t => t.platformId === platform.id);
                  const isCustom = threshold?.customThresholdEnabled || false;
                  
                  return (
                    <div key={platform.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                          {platform.name}
                        </h4>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isCustom}
                            onChange={(e) => handleThresholdChange(platform.id, 'customThresholdEnabled', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Seuils personnalisés
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Seuil Crédit Faible
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={isCustom ? (threshold?.lowBalanceThreshold || platform.lowBalanceThreshold) : platform.lowBalanceThreshold}
                            onChange={(e) => handleThresholdChange(platform.id, 'lowBalanceThreshold', parseFloat(e.target.value) || 0)}
                            disabled={!isCustom}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(isCustom ? (threshold?.lowBalanceThreshold || platform.lowBalanceThreshold) : platform.lowBalanceThreshold, 'DZD')}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Seuil Critique
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={isCustom ? (threshold?.criticalBalanceThreshold || platform.lowBalanceThreshold * 0.1) : platform.lowBalanceThreshold * 0.1}
                            onChange={(e) => handleThresholdChange(platform.id, 'criticalBalanceThreshold', parseFloat(e.target.value) || 0)}
                            disabled={!isCustom}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatCurrency(isCustom ? (threshold?.criticalBalanceThreshold || platform.lowBalanceThreshold * 0.1) : platform.lowBalanceThreshold * 0.1, 'DZD')}
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Fréquence d'Alerte
                          </label>
                          <select
                            value={threshold?.alertFrequency || 'daily'}
                            onChange={(e) => handleThresholdChange(platform.id, 'alertFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="immediate">Immédiate</option>
                            <option value="hourly">Toutes les heures</option>
                            <option value="daily">Quotidienne</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Solde actuel: {formatCurrency(platform.creditBalance, 'DZD')}
                        {platform.creditBalance <= (isCustom ? (threshold?.lowBalanceThreshold || platform.lowBalanceThreshold) : platform.lowBalanceThreshold) && (
                          <span className="ml-2 text-orange-600 dark:text-orange-400">• En dessous du seuil</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
