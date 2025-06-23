import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DashboardStats } from './DashboardStats';
import { RecentSubscribers } from './RecentSubscribers';
import { ExpiringSubscriptions } from './ExpiringSubscriptions';
import { QuickActions } from './QuickActions';
import { SalesChart } from './SalesChart';
import { FinancialDashboard } from './FinancialDashboard';
import {
  MessageCircle,
  Sparkles,
  BarChart3,
  DollarSign,
  Home,
  TrendingUp
} from 'lucide-react';

export function Dashboard() {
  const { state } = useApp();
  const { settings } = state;
  const [activeTab, setActiveTab] = useState<'overview' | 'financial'>('overview');

  const tabs = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: Home,
      description: 'Aperçu général des activités'
    },
    {
      id: 'financial',
      label: 'Analyse Financière',
      icon: TrendingUp,
      description: 'Métriques financières et plateformes'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Message d'accueil personnalisé */}
      {settings.welcomeMessage && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Bienvenue dans {settings.companyName || 'Digital Manager'}
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                {settings.welcomeMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Tab Navigation (Task 18) */}
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
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <DashboardStats />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesChart />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentSubscribers />
            <ExpiringSubscriptions />
          </div>
        </div>
      )}

      {activeTab === 'financial' && (
        <FinancialDashboard />
      )}
    </div>
  );
}