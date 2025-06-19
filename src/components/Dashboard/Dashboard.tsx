import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { DashboardStats } from './DashboardStats';
import { RecentSubscribers } from './RecentSubscribers';
import { ExpiringSubscriptions } from './ExpiringSubscriptions';
import { QuickActions } from './QuickActions';
import { SalesChart } from './SalesChart';
import { MessageCircle, Sparkles } from 'lucide-react';

export function Dashboard() {
  const { state } = useApp();
  const { settings } = state;

  return (
    <div className="space-y-6">
      {/* Message d'accueil personnalisé */}
      {settings.welcomeMessage && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Bienvenue dans {settings.companyName || 'Digital Manager'}
              </h3>
              <p className="text-blue-700">
                {settings.welcomeMessage}
              </p>
            </div>
          </div>
        </div>
      )}

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
  );
}