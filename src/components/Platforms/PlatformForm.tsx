import React, { useState, useEffect } from 'react';
import { Platform } from '../../types';
import { 
  Save, 
  X, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Globe,
  Key,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';

interface PlatformFormProps {
  platform?: Platform | null;
  onSubmit: (platformData: Partial<Platform>) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  apiUrl: string;
  apiKey: string;
  isActive: boolean;
  creditBalance: number;
}

interface FormErrors {
  name?: string;
  description?: string;
  apiUrl?: string;
  apiKey?: string;
  creditBalance?: string;
}

export function PlatformForm({ platform, onSubmit, onCancel }: PlatformFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    apiUrl: '',
    apiKey: '',
    isActive: true,
    creditBalance: 0
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize form data when platform prop changes
  useEffect(() => {
    if (platform) {
      setFormData({
        name: platform.name || '',
        description: platform.description || '',
        apiUrl: platform.apiUrl || '',
        apiKey: platform.apiKey || '',
        isActive: platform.isActive ?? true,
        creditBalance: platform.creditBalance || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        apiUrl: '',
        apiKey: '',
        isActive: true,
        creditBalance: 0
      });
    }
  }, [platform]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Platform name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Platform name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Platform name must be less than 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // API URL validation
    if (formData.apiUrl) {
      try {
        new URL(formData.apiUrl);
      } catch {
        newErrors.apiUrl = 'Please enter a valid URL';
      }
    }

    // API Key validation
    if (formData.apiKey && formData.apiKey.length < 10) {
      newErrors.apiKey = 'API key must be at least 10 characters';
    }

    // Credit balance validation
    if (formData.creditBalance < 0) {
      newErrors.creditBalance = 'Credit balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to save platform:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!platform;

  return (
    <div className="platform-form">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEditing ? 'Edit Platform' : 'Create New Platform'}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isEditing ? 'Update platform information and settings.' : 'Add a new supplier platform to your system.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Basic Information
            </h4>

            {/* Platform Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter platform name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter platform description (optional)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>

          {/* API Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              API Configuration
            </h4>

            {/* API URL */}
            <div>
              <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API URL
              </label>
              <input
                type="url"
                id="apiUrl"
                value={formData.apiUrl}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.apiUrl ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="https://api.platform.com"
              />
              {errors.apiUrl && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.apiUrl}
                </p>
              )}
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={(e) => handleInputChange('apiKey', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.apiKey ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter API key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.apiKey && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.apiKey}
                </p>
              )}
            </div>
          </div>

          {/* Platform Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Platform Settings
            </h4>

            {/* Credit Balance */}
            <div>
              <label htmlFor="creditBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Credit Balance (DZD)
              </label>
              <input
                type="number"
                id="creditBalance"
                min="0"
                step="0.01"
                value={formData.creditBalance}
                onChange={(e) => handleInputChange('creditBalance', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.creditBalance ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
              />
              {errors.creditBalance && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.creditBalance}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Platform is active
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Platform' : 'Create Platform')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
