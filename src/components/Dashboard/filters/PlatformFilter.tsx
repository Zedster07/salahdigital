import React, { useState } from 'react';
import { CreditCard, ChevronDown, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface Platform {
  id: string;
  name: string;
  isActive: boolean;
  creditBalance: number;
  lowBalanceThreshold: number;
}

interface PlatformFilterProps {
  platforms: Platform[];
  selectedPlatformId: string;
  onChange: (platformId: string) => void;
}

export function PlatformFilter({ platforms, selectedPlatformId, onChange }: PlatformFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedPlatform = platforms.find(p => p.id === selectedPlatformId);
  
  const activePlatforms = platforms.filter(p => p.isActive);
  const inactivePlatforms = platforms.filter(p => !p.isActive);
  
  const getPlatformStatus = (platform: Platform) => {
    if (!platform.isActive) return { status: 'inactive', color: 'gray', label: 'Inactif' };
    if (platform.creditBalance <= platform.lowBalanceThreshold * 0.1) return { status: 'critical', color: 'red', label: 'Critique' };
    if (platform.creditBalance <= platform.lowBalanceThreshold * 0.5) return { status: 'low', color: 'orange', label: 'Bas' };
    if (platform.creditBalance <= platform.lowBalanceThreshold) return { status: 'medium', color: 'yellow', label: 'Moyen' };
    return { status: 'good', color: 'green', label: 'Bon' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-3 w-3" />;
      case 'good':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <CreditCard className="h-3 w-3" />;
    }
  };

  const getStatusColors = (color: string) => {
    const colorMap = {
      red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
      orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
      yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
      green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
      gray: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const handlePlatformSelect = (platformId: string) => {
    onChange(platformId);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    onChange('');
    setShowDropdown(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Plateforme
      </label>
      
      <div className="relative">
        {/* Selected Platform Display */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {selectedPlatform ? (
              <>
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{selectedPlatform.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(selectedPlatform.creditBalance, 'DZD')}
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${getStatusColors(getPlatformStatus(selectedPlatform).color)}`}>
                  {getPlatformStatus(selectedPlatform).label}
                </div>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Toutes les plateformes</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {selectedPlatformId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            <div className="p-2">
              {/* All Platforms Option */}
              <button
                onClick={() => handlePlatformSelect('')}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  !selectedPlatformId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Toutes les plateformes</span>
                </div>
              </button>

              {/* Active Platforms */}
              {activePlatforms.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    Plateformes Actives ({activePlatforms.length})
                  </div>
                  {activePlatforms.map((platform) => {
                    const status = getPlatformStatus(platform);
                    const isSelected = selectedPlatformId === platform.id;
                    
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handlePlatformSelect(platform.id)}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                {platform.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{platform.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Solde: {formatCurrency(platform.creditBalance, 'DZD')}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-full ${getStatusColors(status.color)}`}>
                            {getStatusIcon(status.status)}
                            <span>{status.label}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Inactive Platforms */}
              {inactivePlatforms.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                    Plateformes Inactives ({inactivePlatforms.length})
                  </div>
                  {inactivePlatforms.map((platform) => {
                    const isSelected = selectedPlatformId === platform.id;
                    
                    return (
                      <button
                        key={platform.id}
                        onClick={() => handlePlatformSelect(platform.id)}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-60 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {platform.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{platform.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Solde: {formatCurrency(platform.creditBalance, 'DZD')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            Inactif
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* No Platforms */}
              {platforms.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Aucune plateforme disponible
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Platform Summary */}
      {platforms.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Total plateformes:</span>
            <span>{platforms.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Actives:</span>
            <span className="text-green-600 dark:text-green-400">{activePlatforms.length}</span>
          </div>
          {platforms.filter(p => p.isActive && p.creditBalance <= p.lowBalanceThreshold).length > 0 && (
            <div className="flex items-center justify-between">
              <span>Alertes crédit:</span>
              <span className="text-orange-600 dark:text-orange-400">
                {platforms.filter(p => p.isActive && p.creditBalance <= p.lowBalanceThreshold).length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
