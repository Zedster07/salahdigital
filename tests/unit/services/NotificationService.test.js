import { notificationService } from '../../../src/services/NotificationService';

// Mock platforms data
const mockPlatforms = [
  {
    id: 'platform-1',
    name: 'Netflix Supplier',
    creditBalance: 50, // Below low threshold
    lowBalanceThreshold: 100,
    isActive: true
  },
  {
    id: 'platform-2',
    name: 'Spotify Supplier',
    creditBalance: 5, // Critical level
    lowBalanceThreshold: 100,
    isActive: true
  },
  {
    id: 'platform-3',
    name: 'Inactive Platform',
    creditBalance: 200,
    lowBalanceThreshold: 100,
    isActive: false
  }
];

describe('NotificationService', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock Date.now for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000); // 2022-01-01 00:00:00
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('notification creation', () => {
    test('should create notification with required fields', () => {
      const notification = notificationService.createNotification({
        type: 'low_credit',
        title: 'Test Notification',
        message: 'Test message',
        severity: 'warning'
      });

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type', 'low_credit');
      expect(notification).toHaveProperty('title', 'Test Notification');
      expect(notification).toHaveProperty('message', 'Test message');
      expect(notification).toHaveProperty('severity', 'warning');
      expect(notification).toHaveProperty('createdAt');
      expect(notification).toHaveProperty('readAt', null);
      expect(notification).toHaveProperty('dismissedAt', null);
      expect(notification.id).toBeValidUUID();
    });

    test('should create notification with metadata', () => {
      const metadata = { platformId: 'platform-1', amount: 50 };
      const notification = notificationService.createNotification({
        type: 'low_credit',
        title: 'Test',
        message: 'Test',
        severity: 'warning',
        metadata
      });

      expect(notification.metadata).toEqual(metadata);
    });

    test('should create notification with action required', () => {
      const notification = notificationService.createNotification({
        type: 'critical_credit',
        title: 'Critical Alert',
        message: 'Immediate action required',
        severity: 'critical',
        actionRequired: true,
        actionUrl: '/platforms/platform-1'
      });

      expect(notification.actionRequired).toBe(true);
      expect(notification.actionUrl).toBe('/platforms/platform-1');
    });
  });

  describe('platform credit checking', () => {
    test('should generate low credit alerts', () => {
      notificationService.checkPlatformCredits(mockPlatforms);
      
      const notifications = notificationService.getNotifications();
      const lowCreditNotifications = notifications.filter(n => n.type === 'low_credit');
      
      expect(lowCreditNotifications).toHaveLength(1);
      expect(lowCreditNotifications[0].metadata.platformId).toBe('platform-1');
      expect(lowCreditNotifications[0].severity).toBe('warning');
    });

    test('should generate critical credit alerts', () => {
      notificationService.checkPlatformCredits(mockPlatforms);
      
      const notifications = notificationService.getNotifications();
      const criticalNotifications = notifications.filter(n => n.type === 'critical_credit');
      
      expect(criticalNotifications).toHaveLength(1);
      expect(criticalNotifications[0].metadata.platformId).toBe('platform-2');
      expect(criticalNotifications[0].severity).toBe('critical');
    });

    test('should not generate alerts for inactive platforms', () => {
      notificationService.checkPlatformCredits(mockPlatforms);
      
      const notifications = notificationService.getNotifications();
      const inactiveNotifications = notifications.filter(n => 
        n.metadata?.platformId === 'platform-3'
      );
      
      expect(inactiveNotifications).toHaveLength(0);
    });

    test('should respect alert frequency settings', () => {
      // Set alert frequency to hourly
      notificationService.updateSettings({
        alertFrequency: 'hourly'
      });

      // First check should generate alerts
      notificationService.checkPlatformCredits(mockPlatforms);
      let notifications = notificationService.getNotifications();
      const initialCount = notifications.length;

      // Immediate second check should not generate new alerts
      notificationService.checkPlatformCredits(mockPlatforms);
      notifications = notificationService.getNotifications();
      
      expect(notifications.length).toBe(initialCount);
    });

    test('should respect quiet hours', () => {
      // Set quiet hours from 22:00 to 08:00
      notificationService.updateSettings({
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      });

      // Mock current time to be during quiet hours (23:00)
      const quietTime = new Date();
      quietTime.setHours(23, 0, 0, 0);
      jest.spyOn(Date, 'now').mockReturnValue(quietTime.getTime());

      notificationService.checkPlatformCredits(mockPlatforms);
      
      const notifications = notificationService.getNotifications();
      const nonCriticalNotifications = notifications.filter(n => n.severity !== 'critical');
      
      // Should not generate non-critical notifications during quiet hours
      expect(nonCriticalNotifications).toHaveLength(0);
    });
  });

  describe('notification management', () => {
    beforeEach(() => {
      // Create some test notifications
      notificationService.createNotification({
        type: 'low_credit',
        title: 'Low Credit Alert',
        message: 'Platform credit is low',
        severity: 'warning'
      });
      
      notificationService.createNotification({
        type: 'critical_credit',
        title: 'Critical Alert',
        message: 'Platform credit is critical',
        severity: 'critical'
      });
    });

    test('should get all notifications', () => {
      const notifications = notificationService.getNotifications();
      
      expect(notifications).toHaveLength(2);
      expect(notifications[0].type).toBe('critical_credit'); // Should be sorted by severity
      expect(notifications[1].type).toBe('low_credit');
    });

    test('should filter notifications by read status', () => {
      const notifications = notificationService.getNotifications();
      
      // Mark one as read
      notificationService.markAsRead(notifications[0].id);
      
      const unreadNotifications = notificationService.getNotifications({ unreadOnly: true });
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].readAt).toBeNull();
    });

    test('should filter notifications by severity', () => {
      const criticalNotifications = notificationService.getNotifications({ 
        severity: 'critical' 
      });
      
      expect(criticalNotifications).toHaveLength(1);
      expect(criticalNotifications[0].severity).toBe('critical');
    });

    test('should mark notification as read', () => {
      const notifications = notificationService.getNotifications();
      const notificationId = notifications[0].id;
      
      notificationService.markAsRead(notificationId);
      
      const updatedNotifications = notificationService.getNotifications();
      const readNotification = updatedNotifications.find(n => n.id === notificationId);
      
      expect(readNotification.readAt).not.toBeNull();
      expect(new Date(readNotification.readAt)).toBeValidDate();
    });

    test('should mark all notifications as read', () => {
      notificationService.markAllAsRead();
      
      const notifications = notificationService.getNotifications();
      const unreadNotifications = notifications.filter(n => n.readAt === null);
      
      expect(unreadNotifications).toHaveLength(0);
    });

    test('should dismiss notification', () => {
      const notifications = notificationService.getNotifications();
      const notificationId = notifications[0].id;
      
      notificationService.dismissNotification(notificationId);
      
      const updatedNotifications = notificationService.getNotifications();
      const dismissedNotification = updatedNotifications.find(n => n.id === notificationId);
      
      expect(dismissedNotification.dismissedAt).not.toBeNull();
    });

    test('should clear old notifications', () => {
      // Mock old date for existing notifications
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const notifications = notificationService.getNotifications();
      
      // Manually set old dates
      notifications.forEach(notification => {
        notification.createdAt = oldDate.toISOString();
      });
      localStorage.setItem('notifications', JSON.stringify(notifications));
      
      notificationService.clearOldNotifications(7); // Clear notifications older than 7 days
      
      const remainingNotifications = notificationService.getNotifications();
      expect(remainingNotifications).toHaveLength(0);
    });
  });

  describe('settings management', () => {
    test('should get default settings', () => {
      const settings = notificationService.getSettings();
      
      expect(settings).toHaveProperty('lowCreditEnabled', true);
      expect(settings).toHaveProperty('criticalCreditEnabled', true);
      expect(settings).toHaveProperty('dailySummaryEnabled', true);
      expect(settings).toHaveProperty('emailNotificationsEnabled', false);
      expect(settings).toHaveProperty('browserNotificationsEnabled', false);
      expect(settings).toHaveProperty('checkInterval', 5);
      expect(settings).toHaveProperty('alertFrequency', 'immediate');
    });

    test('should update settings', () => {
      const newSettings = {
        lowCreditEnabled: false,
        checkInterval: 10,
        alertFrequency: 'daily'
      };
      
      notificationService.updateSettings(newSettings);
      
      const settings = notificationService.getSettings();
      expect(settings.lowCreditEnabled).toBe(false);
      expect(settings.checkInterval).toBe(10);
      expect(settings.alertFrequency).toBe('daily');
    });

    test('should persist settings to localStorage', () => {
      const newSettings = { lowCreditEnabled: false };
      
      notificationService.updateSettings(newSettings);
      
      const storedSettings = JSON.parse(localStorage.getItem('notificationSettings'));
      expect(storedSettings.lowCreditEnabled).toBe(false);
    });
  });

  describe('alert thresholds', () => {
    test('should get default alert threshold', () => {
      const threshold = notificationService.getAlertThreshold('platform-1');
      
      expect(threshold).toHaveProperty('platformId', 'platform-1');
      expect(threshold).toHaveProperty('customThresholdEnabled', false);
      expect(threshold).toHaveProperty('alertFrequency', 'immediate');
    });

    test('should set custom alert threshold', () => {
      const customThreshold = {
        platformId: 'platform-1',
        customThresholdEnabled: true,
        lowBalanceThreshold: 200,
        criticalBalanceThreshold: 50,
        alertFrequency: 'daily'
      };
      
      notificationService.setAlertThreshold('platform-1', customThreshold);
      
      const threshold = notificationService.getAlertThreshold('platform-1');
      expect(threshold.customThresholdEnabled).toBe(true);
      expect(threshold.lowBalanceThreshold).toBe(200);
      expect(threshold.criticalBalanceThreshold).toBe(50);
    });

    test('should validate threshold values', () => {
      expect(() => {
        notificationService.setAlertThreshold('platform-1', {
          lowBalanceThreshold: -100 // Invalid negative value
        });
      }).toThrow();

      expect(() => {
        notificationService.setAlertThreshold('platform-1', {
          lowBalanceThreshold: 100,
          criticalBalanceThreshold: 200 // Critical should be less than low
        });
      }).toThrow();
    });
  });

  describe('daily summary', () => {
    test('should generate daily summary', () => {
      notificationService.generateDailySummary(mockPlatforms);
      
      const notifications = notificationService.getNotifications();
      const summaryNotification = notifications.find(n => n.type === 'daily_summary');
      
      expect(summaryNotification).toBeDefined();
      expect(summaryNotification.severity).toBe('info');
      expect(summaryNotification.metadata).toHaveProperty('totalPlatforms');
      expect(summaryNotification.metadata).toHaveProperty('lowCreditPlatforms');
      expect(summaryNotification.metadata).toHaveProperty('criticalPlatforms');
    });

    test('should include platform details in summary', () => {
      notificationService.generateDailySummary(mockPlatforms);
      
      const notifications = notificationService.getNotifications();
      const summaryNotification = notifications.find(n => n.type === 'daily_summary');
      
      expect(summaryNotification.metadata.totalPlatforms).toBe(2); // Only active platforms
      expect(summaryNotification.metadata.lowCreditPlatforms).toBe(1);
      expect(summaryNotification.metadata.criticalPlatforms).toBe(1);
    });
  });

  describe('browser notifications', () => {
    test('should request browser notification permission', async () => {
      // Mock Notification API
      global.Notification = {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted')
      };

      const permission = await notificationService.requestBrowserNotificationPermission();
      
      expect(permission).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    test('should show browser notification', () => {
      // Mock Notification constructor
      const mockNotification = {
        close: jest.fn()
      };
      global.Notification = jest.fn().mockReturnValue(mockNotification);
      global.Notification.permission = 'granted';

      notificationService.showBrowserNotification({
        title: 'Test Notification',
        message: 'Test message',
        severity: 'warning'
      });

      expect(global.Notification).toHaveBeenCalledWith('Test Notification', {
        body: 'Test message',
        icon: expect.any(String),
        tag: expect.any(String),
        requireInteraction: false
      });
    });

    test('should not show browser notification without permission', () => {
      global.Notification = jest.fn();
      global.Notification.permission = 'denied';

      notificationService.showBrowserNotification({
        title: 'Test',
        message: 'Test',
        severity: 'info'
      });

      expect(global.Notification).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        notificationService.createNotification({
          type: 'test',
          title: 'Test',
          message: 'Test',
          severity: 'info'
        });
      }).not.toThrow();

      // Restore localStorage
      localStorage.setItem = originalSetItem;
    });

    test('should handle invalid notification data', () => {
      expect(() => {
        notificationService.createNotification({
          // Missing required fields
        });
      }).toThrow();

      expect(() => {
        notificationService.createNotification({
          type: 'test',
          title: '', // Empty title
          message: 'Test',
          severity: 'info'
        });
      }).toThrow();
    });

    test('should handle browser notification errors', () => {
      // Mock Notification to throw error
      global.Notification = jest.fn(() => {
        throw new Error('Notification error');
      });
      global.Notification.permission = 'granted';

      expect(() => {
        notificationService.showBrowserNotification({
          title: 'Test',
          message: 'Test',
          severity: 'info'
        });
      }).not.toThrow();
    });
  });
});
