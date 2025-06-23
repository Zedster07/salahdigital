import React, { useState, useEffect } from 'react';
import { notificationService, Notification } from '../../services/NotificationService';
import { formatCurrency } from '../../utils/helpers';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  CreditCard, 
  Calendar,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  CheckCheck,
  Settings
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      loadNotifications();
    };

    window.addEventListener('notification:new', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('notification:new', handleNewNotification as EventListener);
    };
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [filter, selectedType]);

  const loadNotifications = () => {
    const filters: any = {};
    
    if (filter === 'unread') filters.unreadOnly = true;
    if (filter === 'critical') filters.severity = 'critical';
    if (selectedType) filters.type = selectedType;

    const filtered = notificationService.getNotifications(filters);
    setNotifications(filtered);
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const handleDismiss = (notificationId: string) => {
    notificationService.dismissNotification(notificationId);
    loadNotifications();
  };

  const handleClearOld = () => {
    notificationService.clearOldNotifications(7); // Clear notifications older than 7 days
    loadNotifications();
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'low_credit':
      case 'critical_credit':
        return <CreditCard className="h-5 w-5" />;
      case 'daily_summary':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          text: 'text-red-700 dark:text-red-300'
        };
      case 'error':
        return {
          container: 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20',
          icon: 'text-orange-600 dark:text-orange-400',
          title: 'text-orange-900 dark:text-orange-100',
          text: 'text-orange-700 dark:text-orange-300'
        };
      case 'warning':
        return {
          container: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-900 dark:text-yellow-100',
          text: 'text-yellow-700 dark:text-yellow-300'
        };
      default:
        return {
          container: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
          text: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low_credit': return 'Crédit Faible';
      case 'critical_credit': return 'Crédit Critique';
      case 'daily_summary': return 'Résumé Quotidien';
      case 'platform_inactive': return 'Plateforme Inactive';
      default: return 'Notification';
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;
  const criticalCount = notifications.filter(n => n.severity === 'critical' && !n.readAt).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
                {criticalCount > 0 && (
                  <span className="text-red-600 dark:text-red-400 ml-2">
                    • {criticalCount} critique{criticalCount !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Paramètres"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'unread', 'critical'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterType === 'all' ? 'Toutes' : 
                 filterType === 'unread' ? 'Non lues' : 'Critiques'}
              </button>
            ))}
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tous les types</option>
            <option value="low_credit">Crédit Faible</option>
            <option value="critical_credit">Crédit Critique</option>
            <option value="daily_summary">Résumé Quotidien</option>
            <option value="platform_inactive">Plateforme Inactive</option>
          </select>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout marquer lu
              </button>
              
              <button
                onClick={handleClearOld}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Nettoyer anciennes
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune notification</p>
              <p className="text-sm">Vous êtes à jour!</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification) => {
                const styles = getSeverityStyles(notification.severity);
                const isUnread = !notification.readAt;
                const isDismissed = !!notification.dismissedAt;
                
                if (isDismissed) return null;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg transition-all duration-200 ${styles.container} ${
                      isUnread ? 'ring-2 ring-blue-200 dark:ring-blue-700' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${styles.icon}`}>
                        {getNotificationIcon(notification)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`text-sm font-semibold ${styles.title}`}>
                                {notification.title}
                              </h4>
                              {isUnread && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            
                            <p className={`text-sm ${styles.text} mb-2`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full bg-white dark:bg-gray-800 ${styles.text}`}>
                                  {getTypeLabel(notification.type)}
                                </span>
                                {notification.platformName && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    • {notification.platformName}
                                  </span>
                                )}
                              </div>
                              
                              <span className="text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className={`p-1 rounded hover:bg-white dark:hover:bg-gray-800 ${styles.icon}`}
                                title="Voir détails"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                            
                            {isUnread && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className={`p-1 rounded hover:bg-white dark:hover:bg-gray-800 ${styles.icon}`}
                                title="Marquer comme lu"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDismiss(notification.id)}
                              className={`p-1 rounded hover:bg-white dark:hover:bg-gray-800 ${styles.icon}`}
                              title="Ignorer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Additional data display */}
                        {notification.data && (
                          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {notification.data.currentBalance !== undefined && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Solde:</span>
                                  <span className="ml-1 font-medium">
                                    {formatCurrency(notification.data.currentBalance, 'DZD')}
                                  </span>
                                </div>
                              )}
                              {notification.data.deficit !== undefined && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Déficit:</span>
                                  <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                                    {formatCurrency(notification.data.deficit, 'DZD')}
                                  </span>
                                </div>
                              )}
                              {notification.data.utilizationRate !== undefined && (
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Utilisation:</span>
                                  <span className="ml-1 font-medium">
                                    {notification.data.utilizationRate.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
