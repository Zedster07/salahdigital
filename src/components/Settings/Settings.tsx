import React, { useState } from 'react';
import { useApp, useDatabase } from '../../contexts/AppContext';
import { PricingSettings } from './PricingSettings';
import { ProductSettings } from './ProductSettings';
import { NotificationSettings } from './NotificationSettings';
import { FinancialSettings } from './FinancialSettings';
import { CustomizationSettings } from './CustomizationSettings';
import { BackupSettings } from './BackupSettings';
import { UserManagementSettings } from './UserManagementSettings';
import { 
  DollarSign, 
  Package, 
  Bell, 
  CreditCard, 
  Palette, 
  Download,
  Users,
  Settings as SettingsIcon
} from 'lucide-react';

export function Settings() {
  const { state } = useApp();
  const { updateSettings } = useDatabase();
  const { settings } = state;
  const [activeTab, setActiveTab] = useState('pricing');

  const tabs = [
    { id: 'pricing', label: 'Tarification', icon: DollarSign },
    { id: 'products', label: 'Produits Digitaux', icon: Package },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'financial', label: 'Paramètres Financiers', icon: CreditCard },
    { id: 'customization', label: 'Personnalisation', icon: Palette },
    { id: 'users', label: 'Gestion des Utilisateurs', icon: Users },
    { id: 'backup', label: 'Sauvegarde & Export', icon: Download },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pricing':
        return <PricingSettings />;
      case 'products':
        return <ProductSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'financial':
        return <FinancialSettings />;
      case 'customization':
        return <CustomizationSettings />;
      case 'users':
        return <UserManagementSettings />;
      case 'backup':
        return <BackupSettings />;
      default:
        return <PricingSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-600 mt-1">
            Configurez votre application selon vos besoins
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}