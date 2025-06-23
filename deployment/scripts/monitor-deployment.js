#!/usr/bin/env node

const fetch = require('node-fetch');
const chalk = require('chalk');

class DeploymentMonitor {
  constructor() {
    this.baseUrl = process.env.MONITORING_URL || 'https://digitalmanager.netlify.app';
    this.monitoringDuration = 10 * 60 * 1000; // 10 minutes
    this.checkInterval = 30 * 1000; // 30 seconds
    this.errorThreshold = 5; // 5% error rate
    this.responseTimeThreshold = 2000; // 2 seconds
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: [],
      errorRate: 0,
      avgResponseTime: 0
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      header: chalk.cyan.bold
    };
    
    console.log(colors[type](`[${new Date().toISOString()}] ${message}`));
  }

  async makeRequest(url, options = {}) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        timeout: 10000, // 10 second timeout
        ...options
      });
      
      const responseTime = Date.now() - startTime;
      this.recordMetric(response.ok, responseTime);
      
      return { response, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.recordMetric(false, responseTime);
      throw error;
    }
  }

  recordMetric(success, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTimes.push(responseTime);
    
    if (!success) {
      this.metrics.errors++;
    }
    
    this.metrics.errorRate = (this.metrics.errors / this.metrics.requests) * 100;
    this.metrics.avgResponseTime = this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length;
  }

  async checkHealthEndpoint() {
    try {
      const { response, responseTime } = await this.makeRequest(`${this.baseUrl}/.netlify/functions/health`);
      
      if (!response.ok) {
        throw new Error(`Health endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        status: 'healthy',
        responseTime,
        appStatus: data.status,
        checks: data.checks
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async checkMainPage() {
    try {
      const { response, responseTime } = await this.makeRequest(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`Main page returned ${response.status}`);
      }
      
      return {
        status: 'healthy',
        responseTime,
        httpStatus: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async checkApiEndpoint() {
    try {
      const { response, responseTime } = await this.makeRequest(`${this.baseUrl}/.netlify/functions/api/platforms`);
      
      if (!response.ok) {
        throw new Error(`API endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        status: 'healthy',
        responseTime,
        dataReceived: Array.isArray(data)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async performHealthCheck() {
    const checks = await Promise.allSettled([
      this.checkHealthEndpoint(),
      this.checkMainPage(),
      this.checkApiEndpoint()
    ]);

    const results = {
      healthEndpoint: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy', error: checks[0].reason.message },
      mainPage: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy', error: checks[1].reason.message },
      apiEndpoint: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'unhealthy', error: checks[2].reason.message }
    };

    const healthyChecks = Object.values(results).filter(check => check.status === 'healthy').length;
    const totalChecks = Object.keys(results).length;
    const healthPercentage = (healthyChecks / totalChecks) * 100;

    return {
      overall: healthPercentage >= 100 ? 'healthy' : healthPercentage >= 66 ? 'degraded' : 'unhealthy',
      healthPercentage,
      checks: results
    };
  }

  async checkMetrics() {
    // Check if error rate is too high
    if (this.metrics.errorRate > this.errorThreshold) {
      return {
        status: 'critical',
        issue: 'high_error_rate',
        errorRate: this.metrics.errorRate,
        threshold: this.errorThreshold
      };
    }

    // Check if response time is too high
    if (this.metrics.avgResponseTime > this.responseTimeThreshold) {
      return {
        status: 'warning',
        issue: 'slow_response_time',
        avgResponseTime: this.metrics.avgResponseTime,
        threshold: this.responseTimeThreshold
      };
    }

    return {
      status: 'healthy',
      metrics: this.metrics
    };
  }

  displayMetrics() {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.cyan.bold('DEPLOYMENT MONITORING METRICS'));
    console.log('='.repeat(60));
    
    console.log(chalk.blue(`Total Requests: ${this.metrics.requests}`));
    console.log(chalk.blue(`Total Errors: ${this.metrics.errors}`));
    
    const errorRateColor = this.metrics.errorRate > this.errorThreshold ? 'red' : 'green';
    console.log(chalk[errorRateColor](`Error Rate: ${this.metrics.errorRate.toFixed(2)}%`));
    
    const responseTimeColor = this.metrics.avgResponseTime > this.responseTimeThreshold ? 'red' : 'green';
    console.log(chalk[responseTimeColor](`Avg Response Time: ${this.metrics.avgResponseTime.toFixed(0)}ms`));
    
    if (this.metrics.responseTimes.length > 0) {
      const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      
      console.log(chalk.blue(`P95 Response Time: ${sortedTimes[p95Index] || 0}ms`));
      console.log(chalk.blue(`P99 Response Time: ${sortedTimes[p99Index] || 0}ms`));
    }
    
    console.log('='.repeat(60));
  }

  async monitor() {
    this.log('Starting deployment monitoring...', 'header');
    this.log(`Monitoring URL: ${this.baseUrl}`, 'info');
    this.log(`Duration: ${this.monitoringDuration / 1000 / 60} minutes`, 'info');
    this.log(`Check Interval: ${this.checkInterval / 1000} seconds`, 'info');
    this.log(`Error Threshold: ${this.errorThreshold}%`, 'info');
    this.log(`Response Time Threshold: ${this.responseTimeThreshold}ms`, 'info');

    const startTime = Date.now();
    let checkCount = 0;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;

    while (Date.now() - startTime < this.monitoringDuration) {
      checkCount++;
      this.log(`\nPerforming health check #${checkCount}...`, 'info');

      try {
        // Perform health checks
        const healthResult = await this.performHealthCheck();
        
        if (healthResult.overall === 'healthy') {
          this.log(`✅ Health check passed (${healthResult.healthPercentage}% healthy)`, 'success');
          consecutiveFailures = 0;
        } else if (healthResult.overall === 'degraded') {
          this.log(`⚠️ Health check degraded (${healthResult.healthPercentage}% healthy)`, 'warning');
          consecutiveFailures++;
        } else {
          this.log(`❌ Health check failed (${healthResult.healthPercentage}% healthy)`, 'error');
          consecutiveFailures++;
        }

        // Check metrics
        const metricsResult = await this.checkMetrics();
        
        if (metricsResult.status === 'critical') {
          this.log(`🚨 CRITICAL: ${metricsResult.issue} - ${metricsResult.errorRate}% error rate`, 'error');
          throw new Error(`Critical issue detected: ${metricsResult.issue}`);
        } else if (metricsResult.status === 'warning') {
          this.log(`⚠️ WARNING: ${metricsResult.issue} - ${metricsResult.avgResponseTime}ms avg response time`, 'warning');
        }

        // Check for consecutive failures
        if (consecutiveFailures >= maxConsecutiveFailures) {
          throw new Error(`${consecutiveFailures} consecutive health check failures`);
        }

        // Display current metrics
        if (checkCount % 5 === 0) { // Every 5 checks
          this.displayMetrics();
        }

      } catch (error) {
        this.log(`💥 Monitoring check failed: ${error.message}`, 'error');
        
        // If we have critical issues, fail the monitoring
        if (error.message.includes('Critical issue') || consecutiveFailures >= maxConsecutiveFailures) {
          this.displayMetrics();
          throw error;
        }
      }

      // Wait for next check
      if (Date.now() - startTime < this.monitoringDuration) {
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      }
    }

    // Final summary
    this.displayMetrics();
    
    const duration = Date.now() - startTime;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    this.log(`\n🎉 Deployment monitoring completed successfully!`, 'success');
    this.log(`Monitoring Duration: ${durationMinutes} minutes`, 'info');
    this.log(`Total Health Checks: ${checkCount}`, 'info');
    this.log(`Final Error Rate: ${this.metrics.errorRate.toFixed(2)}%`, 
             this.metrics.errorRate <= this.errorThreshold ? 'success' : 'warning');
    this.log(`Final Avg Response Time: ${this.metrics.avgResponseTime.toFixed(0)}ms`, 
             this.metrics.avgResponseTime <= this.responseTimeThreshold ? 'success' : 'warning');

    return {
      success: true,
      duration: durationMinutes,
      checksPerformed: checkCount,
      finalMetrics: this.metrics
    };
  }
}

// Run monitoring if script is executed directly
if (require.main === module) {
  const monitor = new DeploymentMonitor();
  
  monitor.monitor()
    .then(result => {
      console.log('\nMonitoring completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\nDeployment monitoring failed:', error.message);
      process.exit(1);
    });
}

module.exports = DeploymentMonitor;
