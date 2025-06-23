import React, { useState, useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { t } from './utils/translations';

// Components
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SubscribersList } from './components/Subscribers/SubscribersList';
import { PlatformManagement } from './components/Platforms/PlatformManagement';
import { InventoryDashboard } from './components/Inventory/InventoryDashboard';
import { ProductsList } from './components/Inventory/ProductsList';
// Note: PurchasesList removed as part of platform migration
import { SalesList } from './components/Inventory/SalesList';
import { FinancialReports } from './components/Reports/FinancialReports';
import { Settings } from './components/Settings/Settings';

function App() {
  const { state } = useApp();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = state.settings.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.settings.language;
  }, [state.settings.language]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1F2937';
      document.body.style.color = '#F9FAFB';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#1F2937';
    }
  }, [state.settings.theme]);

  // Apply custom colors if they exist
  useEffect(() => {
    if (state.settings.customColors) {
      const root = document.documentElement;
      Object.entries(state.settings.customColors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
  }, [state.settings.customColors]);

  // Show loading screen while initializing
  if (!state.isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialisation...</h2>
          <p className="text-gray-600">Connexion à la base de données</p>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return <LoginForm />;
  }

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return t('dashboard', state.settings.language);
      case 'subscribers':
        return 'Base de Données Clients';
      case 'platforms':
        return 'Gestion des Plateformes';
      case 'inventory':
        return 'Gestion de Stock';
      case 'products':
        return 'Articles (Produits)';
      case 'purchases':
        return 'Achats de Stock';
      case 'sales':
        return 'Ventes de Stock';
      case 'reports':
        return 'Rapports Financiers';
      case 'settings':
        return t('settings', state.settings.language);
      default:
        return t('dashboard', state.settings.language);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'subscribers':
        return <SubscribersList />;
      case 'platforms':
        return <PlatformManagement />;
      case 'inventory':
        return <InventoryDashboard />;
      case 'products':
        return <ProductsList />;
      case 'purchases':
        // Note: Purchases feature removed - redirect to products
        return <ProductsList />;
      case 'sales':
        return <SalesList />;
      case 'reports':
        return <FinancialReports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={getViewTitle()}
        />
        
        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;