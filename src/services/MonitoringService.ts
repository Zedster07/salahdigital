import { v4 as uuidv4 } from 'uuid';

// Types for monitoring
interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string | number>;
  unit?: string;
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
  tags?: Record<string, string>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[];
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private environment: string;
  private version: string;
  private metricsBuffer: Metric[] = [];
  private logsBuffer: LogEntry[] = [];
  private performanceBuffer: PerformanceEntry[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBufferSize: number = 100;
  private alertRules: AlertRule[] = [];

  constructor() {
    this.sessionId = uuidv4();
    this.environment = process.env.NODE_ENV || 'development';
    this.version = process.env.REACT_APP_VERSION || '1.0.0';
    
    this.initializeMonitoring();
    this.setupPerformanceObserver();
    this.setupErrorHandling();
    this.startFlushTimer();
  }

  private initializeMonitoring() {
    // Initialize Sentry for error tracking
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.configureScope((scope) => {
        scope.setTag('session_id', this.sessionId);
        scope.setTag('environment', this.environment);
        scope.setTag('version', this.version);
      });
    }

    // Initialize Google Analytics for user tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
        session_id: this.sessionId,
        custom_map: {
          custom_parameter_1: 'environment',
          custom_parameter_2: 'version'
        }
      });
    }
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Observe Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordPerformanceEntry({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration || 0,
          entryType: entry.entryType,
          tags: {
            entry_type: entry.entryType
          }
        });

        // Record specific metrics
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordMetric('core_web_vitals_lcp', entry.startTime, {
            page: window.location.pathname
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      this.log('warn', 'Performance observer setup failed', { error: error.message });
    }
  }

  private setupErrorHandling() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.recordError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  private startFlushTimer() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Public API methods

  public setUserId(userId: string) {
    this.userId = userId;
    
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser({ id: userId });
    }
  }

  public recordMetric(name: string, value: number, tags: Record<string, string | number> = {}, unit?: string) {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        environment: this.environment,
        version: this.version,
        session_id: this.sessionId,
        user_id: this.userId || 'anonymous',
        ...tags
      },
      unit
    };

    this.metricsBuffer.push(metric);
    this.checkBufferSize();

    // Send critical metrics immediately
    if (this.isCriticalMetric(name)) {
      this.flushMetrics();
    }
  }

  public recordPerformanceEntry(entry: PerformanceEntry) {
    this.performanceBuffer.push({
      ...entry,
      tags: {
        environment: this.environment,
        version: this.version,
        session_id: this.sessionId,
        ...entry.tags
      }
    });
    this.checkBufferSize();
  }

  public log(level: LogEntry['level'], message: string, context?: Record<string, any>) {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: {
        environment: this.environment,
        version: this.version,
        session_id: this.sessionId,
        user_id: this.userId || 'anonymous',
        ...context
      }
    };

    this.logsBuffer.push(logEntry);
    this.checkBufferSize();

    // Console logging for development
    if (this.environment === 'development') {
      const consoleMethod = level === 'fatal' ? 'error' : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context);
    }

    // Send error logs immediately
    if (level === 'error' || level === 'fatal') {
      this.flushLogs();
    }
  }

  public recordError(error: Error, context?: Record<string, any>) {
    this.log('error', error.message, {
      error_name: error.name,
      error_stack: error.stack,
      ...context
    });

    // Send to Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: context,
        extra: {
          session_id: this.sessionId,
          user_id: this.userId
        }
      });
    }

    // Record error metric
    this.recordMetric('error_count', 1, {
      error_type: error.name,
      ...context
    });
  }

  public startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}_duration`, duration, {
        ...tags,
        unit: 'milliseconds'
      });
    };
  }

  public recordUserAction(action: string, context?: Record<string, any>) {
    this.recordMetric('user_action', 1, {
      action,
      page: window.location.pathname,
      ...context
    });

    this.log('info', `User action: ${action}`, context);

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: 'user_interaction',
        event_label: context?.label,
        value: context?.value
      });
    }
  }

  public recordBusinessMetric(metric: string, value: number, context?: Record<string, any>) {
    this.recordMetric(`business_${metric}`, value, {
      metric_type: 'business',
      ...context
    });

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'business_metric', {
        event_category: 'business',
        metric_name: metric,
        metric_value: value,
        ...context
      });
    }
  }

  public recordPageView(page: string, context?: Record<string, any>) {
    this.recordMetric('page_view', 1, {
      page,
      referrer: document.referrer,
      ...context
    });

    this.log('info', `Page view: ${page}`, context);

    // Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
        page_path: page
      });
    }
  }

  public addAlertRule(rule: Omit<AlertRule, 'id'>) {
    const alertRule: AlertRule = {
      id: uuidv4(),
      ...rule
    };
    
    this.alertRules.push(alertRule);
    return alertRule.id;
  }

  public removeAlertRule(ruleId: string) {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  private isCriticalMetric(name: string): boolean {
    const criticalMetrics = [
      'error_count',
      'api_error_rate',
      'database_connection_failure',
      'payment_failure'
    ];
    return criticalMetrics.includes(name);
  }

  private checkBufferSize() {
    if (this.metricsBuffer.length >= this.maxBufferSize ||
        this.logsBuffer.length >= this.maxBufferSize ||
        this.performanceBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private async flush() {
    await Promise.all([
      this.flushMetrics(),
      this.flushLogs(),
      this.flushPerformanceEntries()
    ]);
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.sendMetrics(metrics);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metrics);
    }
  }

  private async flushLogs() {
    if (this.logsBuffer.length === 0) return;

    const logs = [...this.logsBuffer];
    this.logsBuffer = [];

    try {
      await this.sendLogs(logs);
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-add logs to buffer for retry
      this.logsBuffer.unshift(...logs);
    }
  }

  private async flushPerformanceEntries() {
    if (this.performanceBuffer.length === 0) return;

    const entries = [...this.performanceBuffer];
    this.performanceBuffer = [];

    try {
      await this.sendPerformanceEntries(entries);
    } catch (error) {
      console.error('Failed to send performance entries:', error);
      // Re-add entries to buffer for retry
      this.performanceBuffer.unshift(...entries);
    }
  }

  private async sendMetrics(metrics: Metric[]) {
    // Send to monitoring service (e.g., custom endpoint, DataDog, etc.)
    await fetch('/.netlify/functions/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metrics })
    });
  }

  private async sendLogs(logs: LogEntry[]) {
    // Send to logging service
    await fetch('/.netlify/functions/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs })
    });
  }

  private async sendPerformanceEntries(entries: PerformanceEntry[]) {
    // Send to performance monitoring service
    await fetch('/.netlify/functions/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entries })
    });
  }

  // Cleanup method
  public destroy() {
    this.flush();
  }
}

// Create singleton instance
export const monitoringService = new MonitoringService();

// Export types for use in other modules
export type { Metric, LogEntry, PerformanceEntry, AlertRule };
