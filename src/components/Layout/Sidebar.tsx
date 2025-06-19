import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { t } from '../../utils/translations';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Warehouse
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ activeView, onViewChange, isOpen, onToggle }: SidebarProps) {
  const { state, dispatch } = useApp();
  const { settings } = state;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard', settings.language) },
    { id: 'subscribers', icon: Users, label: 'Base de Données Clients' },
    { 
      id: 'inventory', 
      icon: Warehouse, 
      label: 'Gestion de Stock',
      submenu: [
        { id: 'products', icon: Package, label: 'Articles (Produits)' },
        { id: 'purchases', icon: ShoppingCart, label: 'Achats de Stock' },
        { id: 'sales', icon: TrendingUp, label: 'Ventes de Stock' },
      ]
    },
    { id: 'reports', icon: BarChart3, label: 'Rapports Financiers' },
    { id: 'settings', icon: Settings, label: t('settings', settings.language) },
  ];

  const handleLogout = () => {
    dispatch({ type: 'SET_USER', payload: null });
  };

  const isInventoryActive = ['inventory', 'products', 'purchases', 'sales'].includes(activeView);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 ${settings.language === 'ar' ? 'right-0' : 'left-0'} h-full bg-white shadow-lg z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : settings.language === 'ar' ? 'translate-x-full' : '-translate-x-full'
      } lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {settings.companyLogo ? (
                <img 
                  src={settings.companyLogo} 
                  alt="Logo" 
                  className="w-10 h-10 object-contain rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {settings.companyName || 'Digital Manager'}
                </h1>
                <p className="text-sm text-gray-500">v2.0</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id || (item.submenu && item.submenu.some(sub => sub.id === activeView));
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.submenu) {
                        onViewChange('inventory');
                      } else {
                        onViewChange(item.id);
                      }
                      if (window.innerWidth < 1024) onToggle();
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                  
                  {/* Submenu for Inventory */}
                  {item.submenu && isInventoryActive && (
                    <div className="ml-4 mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeView === subItem.id;
                        
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              onViewChange(subItem.id);
                              if (window.innerWidth < 1024) onToggle();
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors text-sm ${
                              isSubActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span className="font-medium">{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {state.user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{state.user?.username}</p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('logout', settings.language)}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}