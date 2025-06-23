import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { PlatformList } from './PlatformList';
import { PlatformDetail } from './PlatformDetail';
import { PlatformForm } from './PlatformForm';
import { CreditManagement } from './CreditManagement';
import { Platform } from '../../types';
import { apiClient } from '../../utils/api';
import { 
  Plus, 
  ArrowLeft, 
  CreditCard, 
  Settings,
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

type ViewMode = 'list' | 'detail' | 'form' | 'credit';

interface PlatformManagementProps {
  className?: string;
}

export function PlatformManagement({ className = '' }: PlatformManagementProps) {
  const { state, dispatch } = useApp();
  const { platforms, isLoading } = state;
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);

  // Load platforms on component mount
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        console.log('Loading platforms from API...');
        const response = await apiClient.getPlatforms();
        const platformsData = response?.data || response || [];
        console.log('Platforms loaded from API:', platformsData.length);

        // Update the context with fresh data from API
        dispatch({ type: 'SET_PLATFORMS', payload: platformsData });
      } catch (error) {
        console.error('Failed to load platforms from API:', error);
        console.log('Using platforms from context:', platforms.length);
      }
    };

    loadPlatforms();
  }, []);

  // Calculate platform statistics
  const platformStats = {
    total: platforms.length,
    active: platforms.filter(p => p.isActive).length,
    inactive: platforms.filter(p => !p.isActive).length,
    lowCredit: platforms.filter(p => p.creditBalance < 100).length,
    totalBalance: platforms.reduce((sum, p) => sum + p.creditBalance, 0)
  };

  const handleViewPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    setViewMode('detail');
  };

  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform);
    setIsFormOpen(true);
    setViewMode('form');
  };

  const handleCreatePlatform = () => {
    setEditingPlatform(null);
    setIsFormOpen(true);
    setViewMode('form');
  };

  const handleManageCredits = (platform: Platform) => {
    setSelectedPlatform(platform);
    setViewMode('credit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPlatform(null);
    setEditingPlatform(null);
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (platformData: Partial<Platform>) => {
    try {
      if (editingPlatform) {
        // Update existing platform
        const response = await apiClient.updatePlatform(editingPlatform.id, platformData);
        if (response.data) {
          dispatch({ type: 'UPDATE_PLATFORM', payload: response.data });
        }
      } else {
        // Create new platform - use API to save to database
        const response = await apiClient.createPlatform({
          name: platformData.name || '',
          description: platformData.description || '',
          contactName: platformData.contactName || '',
          contactEmail: platformData.contactEmail || '',
          contactPhone: platformData.contactPhone || '',
          creditBalance: platformData.creditBalance || 0,
          lowBalanceThreshold: platformData.lowBalanceThreshold || 100,
          isActive: platformData.isActive ?? true,
          metadata: {}
        });

        if (response.data) {
          // Add to local state after successful API call
          dispatch({ type: 'ADD_PLATFORM', payload: response.data });
        }
      }

      handleBackToList();
    } catch (error) {
      console.error('Failed to save platform:', error);
      // You might want to show a user-friendly error message here
      alert('Failed to save platform. Please try again.');
    }
  };

  const renderHeader = () => {
    const getTitle = () => {
      switch (viewMode) {
        case 'detail':
          return selectedPlatform?.name || 'Platform Details';
        case 'form':
          return editingPlatform ? 'Edit Platform' : 'Create Platform';
        case 'credit':
          return `Credit Management - ${selectedPlatform?.name}`;
        default:
          return 'Platform Management';
      }
    };

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {viewMode !== 'list' && (
              <button
                onClick={handleBackToList}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getTitle()}
            </h1>
          </div>
          
          {viewMode === 'list' && (
            <div className="flex space-x-3">
              <button
                onClick={handleCreatePlatform}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Platform
              </button>
            </div>
          )}
        </div>

        {viewMode === 'list' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Platforms</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{platformStats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{platformStats.active}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{platformStats.inactive}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Credit</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{platformStats.lowCredit}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {platformStats.totalBalance.toFixed(2)} DZD
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (viewMode) {
      case 'detail':
        return selectedPlatform ? (
          <PlatformDetail
            platform={selectedPlatform}
            onEdit={handleEditPlatform}
            onManageCredits={handleManageCredits}
          />
        ) : null;

      case 'form':
        return (
          <PlatformForm
            platform={editingPlatform}
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
          />
        );

      case 'credit':
        return selectedPlatform ? (
          <CreditManagement
            platform={selectedPlatform}
            onBack={handleBackToList}
          />
        ) : null;

      default:
        return (
          <PlatformList
            platforms={platforms}
            onView={handleViewPlatform}
            onEdit={handleEditPlatform}
            onManageCredits={handleManageCredits}
          />
        );
    }
  };

  return (
    <div className={`platform-management ${className}`}>
      {renderHeader()}
      {renderContent()}
    </div>
  );
}
