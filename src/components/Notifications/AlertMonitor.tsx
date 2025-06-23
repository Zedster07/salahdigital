import React, { useEffect, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { notificationService } from '../../services/NotificationService';
import { emailAlertService } from '../../services/EmailAlertService';
import { Bell, AlertTriangle, X } from 'lucide-react';

interface AlertMonitorProps {
  onNotificationClick?: () => void;
}

export function AlertMonitor({ onNotificationClick }: AlertMonitorProps) {
  const { state } = useApp();
  const { platforms } = state;
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    // Initial check
    checkPlatformCredits();
    updateNotificationCounts();

    // Set up periodic monitoring
    const periodicCheck = () => {
      if (isMonitoring) {
        checkPlatformCredits();
        updateNotificationCounts();
        setLastCheck(new Date());
      }
    };

    // Listen for periodic check events from notification service
    const handlePeriodicCheck = () => {
      periodicCheck();
    };

    window.addEventListener('notification:periodicCheck', handlePeriodicCheck);

    // Also set up a backup interval (every 5 minutes)
    const backupInterval = setInterval(periodicCheck, 5 * 60 * 1000);

    // Listen for new notifications
    const handleNewNotification = () => {
      updateNotificationCounts();
    };

    window.addEventListener('notification:new', handleNewNotification);

    return () => {
      window.removeEventListener('notification:periodicCheck', handlePeriodicCheck);
      window.removeEventListener('notification:new', handleNewNotification);
      clearInterval(backupInterval);
    };
  }, [platforms, isMonitoring]);

  const checkPlatformCredits = () => {
    if (!platforms || platforms.length === 0) return;

    // Check platform credits using notification service
    notificationService.checkPlatformCredits(platforms);

    // Send email alerts for critical platforms
    const settings = notificationService.getSettings();
    if (settings.emailNotificationsEnabled) {
      platforms.forEach(async (platform) => {
        if (!platform.isActive) return;

        const threshold = notificationService.getAlertThreshold(platform.id);
        const lowThreshold = threshold?.customThresholdEnabled 
          ? threshold.lowBalanceThreshold 
          : platform.lowBalanceThreshold;
        const criticalThreshold = threshold?.customThresholdEnabled 
          ? threshold.criticalBalanceThreshold 
          : platform.lowBalanceThreshold * 0.1;

        // Check if we should send email alerts
        if (platform.creditBalance <= criticalThreshold && settings.criticalCreditEnabled) {
          try {
            await emailAlertService.sendCriticalCreditAlert(platform, criticalThreshold);
          } catch (error) {
            console.error('Failed to send critical credit email alert:', error);
          }
        } else if (platform.creditBalance <= lowThreshold && settings.lowCreditEnabled) {
          try {
            await emailAlertService.sendLowCreditAlert(platform, lowThreshold);
          } catch (error) {
            console.error('Failed to send low credit email alert:', error);
          }
        }
      });
    }

    // Generate daily summary if it's a new day
    const lastSummaryDate = localStorage.getItem('lastDailySummaryDate');
    const today = new Date().toDateString();
    
    if (lastSummaryDate !== today && settings.dailySummaryEnabled) {
      notificationService.generateDailySummary(platforms);
      localStorage.setItem('lastDailySummaryDate', today);

      // Send email summary
      if (settings.emailNotificationsEnabled) {
        emailAlertService.sendDailySummary(platforms).catch(error => {
          console.error('Failed to send daily summary email:', error);
        });
      }
    }
  };

  const updateNotificationCounts = () => {
    const allNotifications = notificationService.getNotifications();
    const unread = allNotifications.filter(n => !n.readAt && !n.dismissedAt);
    const critical = unread.filter(n => n.severity === 'critical');
    
    setUnreadCount(unread.length);
    setCriticalCount(critical.length);
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Notification Bell */}
      <button
        onClick={onNotificationClick}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        title={`${unreadCount} notification${unreadCount !== 1 ? 's' : ''} non lue${unreadCount !== 1 ? 's' : ''}`}
      >
        <Bell className="h-6 w-6" />
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 h-5 w-5 text-xs font-bold text-white rounded-full flex items-center justify-center ${
            criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Critical Alert Indicator */}
        {criticalCount > 0 && (
          <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="hidden md:flex items-center space-x-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-1">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            {criticalCount} alerte{criticalCount !== 1 ? 's' : ''} critique{criticalCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onNotificationClick}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            <span className="text-xs underline">Voir</span>
          </button>
        </div>
      )}

      {/* Monitoring Status Indicator */}
      <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <span>
          {isMonitoring ? 'Surveillance active' : 'Surveillance suspendue'}
        </span>
        <button
          onClick={toggleMonitoring}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
        >
          {isMonitoring ? 'Suspendre' : 'Reprendre'}
        </button>
      </div>

      {/* Last Check Time */}
      <div className="hidden xl:flex items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          Dernière vérification: {lastCheck.toLocaleTimeString('fr-FR')}
        </span>
      </div>
    </div>
  );
}

// Hook for using alert monitoring in components
export function useAlertMonitor() {
  const [notifications, setNotifications] = useState(notificationService.getNotifications());
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      const allNotifications = notificationService.getNotifications();
      const unread = allNotifications.filter(n => !n.readAt && !n.dismissedAt);
      const critical = unread.filter(n => n.severity === 'critical');
      
      setNotifications(allNotifications);
      setUnreadCount(unread.length);
      setCriticalCount(critical.length);
    };

    updateCounts();

    const handleNewNotification = () => {
      updateCounts();
    };

    window.addEventListener('notification:new', handleNewNotification);

    return () => {
      window.removeEventListener('notification:new', handleNewNotification);
    };
  }, []);

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    const updated = notificationService.getNotifications();
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.readAt && !n.dismissedAt).length);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    const updated = notificationService.getNotifications();
    setNotifications(updated);
    setUnreadCount(0);
  };

  const dismissNotification = (notificationId: string) => {
    notificationService.dismissNotification(notificationId);
    const updated = notificationService.getNotifications();
    setNotifications(updated);
    const unread = updated.filter(n => !n.readAt && !n.dismissedAt);
    setUnreadCount(unread.length);
    setCriticalCount(unread.filter(n => n.severity === 'critical').length);
  };

  return {
    notifications,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismissNotification
  };
}

// Component for displaying notification toasts
export function NotificationToast() {
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      
      // Only show toast for critical notifications or if user has enabled browser notifications
      if (notification.severity === 'critical' || notification.severity === 'error') {
        setCurrentNotification(notification);
        setIsVisible(true);

        // Auto-hide after 10 seconds for non-critical notifications
        if (notification.severity !== 'critical') {
          setTimeout(() => {
            setIsVisible(false);
          }, 10000);
        }
      }
    };

    window.addEventListener('notification:new', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notification:new', handleNewNotification as EventListener);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setCurrentNotification(null), 300);
  };

  const handleAction = () => {
    if (currentNotification?.actionUrl) {
      window.location.href = currentNotification.actionUrl;
    }
    handleClose();
  };

  if (!currentNotification || !isVisible) return null;

  const severityStyles = {
    critical: 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-900 dark:text-red-100',
    error: 'bg-orange-100 dark:bg-orange-900/20 border-orange-500 text-orange-900 dark:text-orange-100',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500 text-yellow-900 dark:text-yellow-100',
    info: 'bg-blue-100 dark:bg-blue-900/20 border-blue-500 text-blue-900 dark:text-blue-100'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`border-l-4 rounded-lg shadow-lg p-4 ${severityStyles[currentNotification.severity as keyof typeof severityStyles]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">
              {currentNotification.title}
            </h4>
            <p className="text-sm opacity-90 mb-3">
              {currentNotification.message}
            </p>
            
            {currentNotification.actionRequired && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAction}
                  className="text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Action requise
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
