import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Menu, Bell, Globe, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  const { state, dispatch } = useApp();
  const { settings } = state;

  const toggleLanguage = () => {
    const newLanguage = settings.language === 'fr' ? 'ar' : 'fr';
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { language: newLanguage } 
    });
    
    // Update document direction
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { theme: newTheme } 
    });
    
    // Apply theme immediately
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1F2937';
      document.body.style.color = '#F9FAFB';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#1F2937';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            title={`Passer au thème ${settings.theme === 'light' ? 'sombre' : 'clair'}`}
          >
            {settings.theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Globe className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {settings.language === 'fr' ? 'العربية' : 'Français'}
            </span>
          </button>
          
          <button className="p-2 rounded-md hover:bg-gray-100 relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}