import { Platform } from '../types';
import { formatCurrency } from '../utils/helpers';

export interface Notification {
  id: string;
  type: 'low_credit' | 'critical_credit' | 'daily_summary' | 'platform_inactive';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  platformId?: string;
  platformName?: string;
  data?: any;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
}

export interface NotificationSettings {
  lowCreditEnabled: boolean;
  criticalCreditEnabled: boolean;
  dailySummaryEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  checkInterval: number; // in minutes
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  emailRecipients: string[];
}

export interface AlertThreshold {
  platformId: string;
  lowBalanceThreshold: number;
  criticalBalanceThreshold: number;
  customThresholdEnabled: boolean;
  lastAlertSent?: string;
  alertFrequency: 'immediate' | 'hourly' | 'daily'; // How often to send alerts for same condition
}

class NotificationService {
  private notifications: Notification[] = [];
  private settings: NotificationSettings;
  private thresholds: Map<string, AlertThreshold> = new Map();
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadFromStorage();
    this.startPeriodicCheck();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      lowCreditEnabled: true,
      criticalCreditEnabled: true,
      dailySummaryEnabled: true,
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true,
      checkInterval: 30, // 30 minutes
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      emailRecipients: []
    };
  }

  private loadFromStorage(): void {
    try {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }

      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }

      const storedThresholds = localStorage.getItem('alertThresholds');
      if (storedThresholds) {
        const thresholds = JSON.parse(storedThresholds);
        this.thresholds = new Map(Object.entries(thresholds));
      }
    } catch (error) {
      console.error('Error loading notification data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
      localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
      localStorage.setItem('alertThresholds', JSON.stringify(Object.fromEntries(this.thresholds)));
    } catch (error) {
      console.error('Error saving notification data to storage:', error);
    }
  }

  // Notification Management
  public addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveToStorage();
    this.triggerNotificationEvent(newNotification);
    
    return id;
  }

  public getNotifications(filters?: {
    unreadOnly?: boolean;
    type?: string;
    severity?: string;
    platformId?: string;
  }): Notification[] {
    let filtered = [...this.notifications];

    if (filters?.unreadOnly) {
      filtered = filtered.filter(n => !n.readAt);
    }

    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters?.severity) {
      filtered = filtered.filter(n => n.severity === filters.severity);
    }

    if (filters?.platformId) {
      filtered = filtered.filter(n => n.platformId === filters.platformId);
    }

    return filtered;
  }

  public markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.readAt) {
      notification.readAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public markAllAsRead(): void {
    const now = new Date().toISOString();
    this.notifications.forEach(n => {
      if (!n.readAt) {
        n.readAt = now;
      }
    });
    this.saveToStorage();
  }

  public dismissNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  public clearOldNotifications(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    this.notifications = this.notifications.filter(n => 
      new Date(n.createdAt) > cutoffDate
    );
    
    this.saveToStorage();
  }

  // Alert Threshold Management
  public setAlertThreshold(platformId: string, threshold: Partial<AlertThreshold>): void {
    const existing = this.thresholds.get(platformId) || {
      platformId,
      lowBalanceThreshold: 1000,
      criticalBalanceThreshold: 100,
      customThresholdEnabled: false,
      alertFrequency: 'daily' as const
    };

    this.thresholds.set(platformId, { ...existing, ...threshold });
    this.saveToStorage();
  }

  public getAlertThreshold(platformId: string): AlertThreshold | null {
    return this.thresholds.get(platformId) || null;
  }

  public getAllAlertThresholds(): AlertThreshold[] {
    return Array.from(this.thresholds.values());
  }

  // Settings Management
  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    
    // Restart periodic check if interval changed
    if (newSettings.checkInterval !== undefined) {
      this.stopPeriodicCheck();
      this.startPeriodicCheck();
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Platform Credit Monitoring
  public checkPlatformCredits(platforms: Platform[]): void {
    if (!this.settings.inAppNotificationsEnabled) return;

    const now = new Date();
    const isQuietHours = this.isQuietHours(now);

    platforms.forEach(platform => {
      if (!platform.isActive) return;

      const threshold = this.getAlertThreshold(platform.id);
      const lowThreshold = threshold?.customThresholdEnabled 
        ? threshold.lowBalanceThreshold 
        : platform.lowBalanceThreshold;
      const criticalThreshold = threshold?.customThresholdEnabled 
        ? threshold.criticalBalanceThreshold 
        : platform.lowBalanceThreshold * 0.1;

      // Check if we should send alert based on frequency
      if (threshold?.lastAlertSent && threshold.alertFrequency !== 'immediate') {
        const lastAlert = new Date(threshold.lastAlertSent);
        const hoursSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60);
        
        if (threshold.alertFrequency === 'hourly' && hoursSinceLastAlert < 1) return;
        if (threshold.alertFrequency === 'daily' && hoursSinceLastAlert < 24) return;
      }

      // Critical credit alert
      if (platform.creditBalance <= criticalThreshold && this.settings.criticalCreditEnabled) {
        if (!isQuietHours || platform.creditBalance <= criticalThreshold * 0.5) { // Always alert if extremely critical
          this.createCriticalCreditAlert(platform, criticalThreshold);
          this.updateLastAlertSent(platform.id);
        }
      }
      // Low credit alert (only if not already critical)
      else if (platform.creditBalance <= lowThreshold && this.settings.lowCreditEnabled) {
        if (!isQuietHours) {
          this.createLowCreditAlert(platform, lowThreshold);
          this.updateLastAlertSent(platform.id);
        }
      }
    });
  }

  private createLowCreditAlert(platform: Platform, threshold: number): void {
    const deficit = threshold - platform.creditBalance;
    
    this.addNotification({
      type: 'low_credit',
      title: `Crédit faible - ${platform.name}`,
      message: `Le solde crédit de ${platform.name} est de ${formatCurrency(platform.creditBalance, 'DZD')}, en dessous du seuil de ${formatCurrency(threshold, 'DZD')}. Déficit: ${formatCurrency(deficit, 'DZD')}.`,
      severity: 'warning',
      platformId: platform.id,
      platformName: platform.name,
      actionRequired: true,
      actionUrl: `/platforms/${platform.id}/add-credit`,
      data: {
        currentBalance: platform.creditBalance,
        threshold,
        deficit,
        utilizationRate: (platform.creditBalance / threshold) * 100
      }
    });
  }

  private createCriticalCreditAlert(platform: Platform, threshold: number): void {
    const deficit = threshold - platform.creditBalance;
    
    this.addNotification({
      type: 'critical_credit',
      title: `🚨 CRITIQUE - ${platform.name}`,
      message: `URGENT: Le solde crédit de ${platform.name} est critique (${formatCurrency(platform.creditBalance, 'DZD')}). Action immédiate requise pour éviter l'interruption de service.`,
      severity: 'critical',
      platformId: platform.id,
      platformName: platform.name,
      actionRequired: true,
      actionUrl: `/platforms/${platform.id}/add-credit`,
      data: {
        currentBalance: platform.creditBalance,
        threshold,
        deficit,
        utilizationRate: (platform.creditBalance / threshold) * 100
      }
    });
  }

  private updateLastAlertSent(platformId: string): void {
    const threshold = this.thresholds.get(platformId);
    if (threshold) {
      threshold.lastAlertSent = new Date().toISOString();
      this.thresholds.set(platformId, threshold);
      this.saveToStorage();
    }
  }

  private isQuietHours(date: Date): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const currentTime = date.toTimeString().slice(0, 5); // HH:MM format
    const { startTime, endTime } = this.settings.quietHours;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 14:00 to 18:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Periodic Monitoring
  private startPeriodicCheck(): void {
    if (this.checkIntervalId) return;

    const intervalMs = this.settings.checkInterval * 60 * 1000; // Convert minutes to milliseconds
    this.checkIntervalId = setInterval(() => {
      this.triggerPeriodicCheck();
    }, intervalMs);
  }

  private stopPeriodicCheck(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  private triggerPeriodicCheck(): void {
    // This will be called by the main app to check platforms
    window.dispatchEvent(new CustomEvent('notification:periodicCheck'));
  }

  private triggerNotificationEvent(notification: Notification): void {
    // Trigger custom event for UI components to listen to
    window.dispatchEvent(new CustomEvent('notification:new', { 
      detail: notification 
    }));

    // Show browser notification if supported and enabled
    if (this.settings.inAppNotificationsEnabled && 'Notification' in window) {
      this.showBrowserNotification(notification);
    }
  }

  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.platformId || notification.type,
        requireInteraction: notification.severity === 'critical',
        silent: notification.severity === 'info'
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto-close after 10 seconds for non-critical notifications
      if (notification.severity !== 'critical') {
        setTimeout(() => browserNotification.close(), 10000);
      }
    } else if (Notification.permission === 'default') {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }

  // Daily Summary
  public generateDailySummary(platforms: Platform[]): void {
    if (!this.settings.dailySummaryEnabled) return;

    const lowCreditPlatforms = platforms.filter(p => 
      p.isActive && p.creditBalance <= p.lowBalanceThreshold
    );

    if (lowCreditPlatforms.length === 0) return;

    const totalDeficit = lowCreditPlatforms.reduce((sum, p) => 
      sum + Math.max(0, p.lowBalanceThreshold - p.creditBalance), 0
    );

    const criticalCount = lowCreditPlatforms.filter(p => 
      p.creditBalance <= p.lowBalanceThreshold * 0.1
    ).length;

    this.addNotification({
      type: 'daily_summary',
      title: 'Résumé quotidien - Crédits faibles',
      message: `${lowCreditPlatforms.length} plateforme(s) avec crédit faible (${criticalCount} critique(s)). Déficit total: ${formatCurrency(totalDeficit, 'DZD')}.`,
      severity: criticalCount > 0 ? 'error' : 'warning',
      actionRequired: true,
      actionUrl: '/dashboard?tab=financial',
      data: {
        lowCreditCount: lowCreditPlatforms.length,
        criticalCount,
        totalDeficit,
        platforms: lowCreditPlatforms.map(p => ({
          id: p.id,
          name: p.name,
          balance: p.creditBalance,
          deficit: Math.max(0, p.lowBalanceThreshold - p.creditBalance)
        }))
      }
    });
  }

  // Cleanup
  public destroy(): void {
    this.stopPeriodicCheck();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
