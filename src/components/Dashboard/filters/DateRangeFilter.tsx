import React, { useState } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onChange: (dateRange: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onChange }: DateRangeFilterProps) {
  const [showPresets, setShowPresets] = useState(false);

  const presets = [
    {
      label: 'Aujourd\'hui',
      getValue: () => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today };
      }
    },
    {
      label: '7 derniers jours',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: '30 derniers jours',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Ce mois',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Mois dernier',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    {
      label: 'Cette année',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    }
  ];

  const handlePresetClick = (preset: any) => {
    onChange(preset.getValue());
    setShowPresets(false);
  };

  const formatDateRange = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    if (dateRange.startDate === dateRange.endDate) {
      return start.toLocaleDateString('fr-FR');
    }
    
    return `${start.toLocaleDateString('fr-FR')} - ${end.toLocaleDateString('fr-FR')}`;
  };

  const getDaysDifference = () => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Période d'analyse
      </label>
      
      <div className="relative">
        {/* Quick Presets Button */}
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm">{formatDateRange()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getDaysDifference()} jour{getDaysDifference() !== 1 ? 's' : ''}
            </span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Presets Dropdown */}
        {showPresets && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <div className="p-2 space-y-1">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetClick(preset)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  {preset.label}
                </button>
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">
                  Période personnalisée
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Date Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Date de début
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onChange({ ...dateRange, startDate: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onChange({ ...dateRange, endDate: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Date Range Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Période: {getDaysDifference()} jour{getDaysDifference() !== 1 ? 's' : ''}</span>
        </div>
        
        {(() => {
          const start = new Date(dateRange.startDate);
          const end = new Date(dateRange.endDate);
          const now = new Date();
          
          if (end > now) {
            return (
              <span className="text-orange-500 dark:text-orange-400">
                Inclut des dates futures
              </span>
            );
          }
          
          if (start > end) {
            return (
              <span className="text-red-500 dark:text-red-400">
                Date de début après date de fin
              </span>
            );
          }
          
          return null;
        })()}
      </div>
    </div>
  );
}
