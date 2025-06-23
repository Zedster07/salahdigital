#!/usr/bin/env node

const fetch = require('node-fetch');
const chalk = require('chalk');

class HealthChecker {
  constructor() {
    this.baseUrl = process.env.HEALTH_CHECK_URL || 'https://digitalmanager.netlify.app';
    this.timeout = 30000; // 30 seconds
    this.retries = 3;
    this.retryDelay = 5000; // 5 seconds
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async checkWithRetry(checkFunction, description) {
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        this.log(`${description} (attempt ${attempt}/${this.retries})`, 'info');
        const result = await checkFunction();
        this.log(`✅ ${description} - Success`, 'success');
        return result;
      } catch (error) {
        if (attempt === this.retries) {
          this.log(`❌ ${description} - Failed after ${this.retries} attempts: ${error.message}`, 'error');
          throw error;
        } else {
          this.log(`⚠️ ${description} - Attempt ${attempt} failed, retrying in ${this.retryDelay/1000}s...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
  }

  async checkHealthEndpoint() {
    return this.checkWithRetry(async () => {
      const response = await this.makeRequest(`${this.baseUrl}/.netlify/functions/health`);
      
      if (!response.ok) {
        throw new Error(`Health endpoint returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'healthy') {
        throw new Error(`Application status is ${data.status}`);
      }
      
      return data;
    }, 'Health endpoint check');
  }

  async checkMainPage() {
    return this.checkWithRetry(async () => {
      const response = await this.makeRequest(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`Main page returned ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      if (!html.includes('Digital Manager') && !html.includes('Gestionnaire')) {
        throw new Error('Main page content validation failed');
      }
      
      return { status: 'ok', size: html.length };
    }, 'Main page check');
  }

  async checkApiEndpoints() {
    const endpoints = [
      { path: '/.netlify/functions/api/platforms', method: 'GET', critical: true },
      { path: '/.netlify/functions/api/digital-products', method: 'GET', critical: true },
      { path: '/.netlify/functions/api/stock-sales', method: 'GET', critical: false },
      { path: '/.netlify/functions/api/settings', method: 'GET', critical: false }
    ];

    const results = [];
    let criticalFailures = 0;

    for (const endpoint of endpoints) {
      try {
        await this.checkWithRetry(async () => {
          const response = await this.makeRequest(`${this.baseUrl}${endpoint.path}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`${endpoint.path} returned ${response.status}`);
          }
          
          const data = await response.json();
          return data;
        }, `API endpoint ${endpoint.path}`);
        
        results.push({ endpoint: endpoint.path, status: 'ok', critical: endpoint.critical });
      } catch (error) {
        if (endpoint.critical) {
          criticalFailures++;
        }
        results.push({ 
          endpoint: endpoint.path, 
          status: 'failed', 
          error: error.message, 
          critical: endpoint.critical 
        });
      }
    }

    if (criticalFailures > 0) {
      throw new Error(`${criticalFailures} critical API endpoints failed`);
    }

    return results;
  }

  async checkDatabaseConnectivity() {
    return this.checkWithRetry(async () => {
      const response = await this.makeRequest(`${this.baseUrl}/.netlify/functions/health`);
      
      if (!response.ok) {
        throw new Error(`Health endpoint returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.checks || !data.checks.database) {
        throw new Error('Database check not found in health response');
      }
      
      if (data.checks.database.status !== 'healthy') {
        throw new Error(`Database status is ${data.checks.database.status}: ${data.checks.database.message}`);
      }
      
      return data.checks.database;
    }, 'Database connectivity check');
  }

  async checkPerformance() {
    return this.checkWithRetry(async () => {
      const startTime = Date.now();
      const response = await this.makeRequest(this.baseUrl);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Performance check failed: ${response.status}`);
      }
      
      // Check if response time is acceptable (< 3 seconds)
      if (responseTime > 3000) {
        throw new Error(`Response time too slow: ${responseTime}ms`);
      }
      
      return { responseTime, status: 'ok' };
    }, 'Performance check');
  }

  async checkSSLCertificate() {
    return this.checkWithRetry(async () => {
      if (!this.baseUrl.startsWith('https://')) {
        return { status: 'skipped', reason: 'Not HTTPS URL' };
      }
      
      const response = await this.makeRequest(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`SSL check failed: ${response.status}`);
      }
      
      return { status: 'ok', secure: true };
    }, 'SSL certificate check');
  }

  async runAllChecks() {
    this.log('Starting comprehensive health checks...', 'header');
    
    const checks = [
      { name: 'Health Endpoint', fn: () => this.checkHealthEndpoint() },
      { name: 'Main Page', fn: () => this.checkMainPage() },
      { name: 'API Endpoints', fn: () => this.checkApiEndpoints() },
      { name: 'Database Connectivity', fn: () => this.checkDatabaseConnectivity() },
      { name: 'Performance', fn: () => this.checkPerformance() },
      { name: 'SSL Certificate', fn: () => this.checkSSLCertificate() }
    ];

    const results = {};
    let failedChecks = 0;

    for (const check of checks) {
      try {
        const result = await check.fn();
        results[check.name] = { status: 'passed', data: result };
      } catch (error) {
        results[check.name] = { status: 'failed', error: error.message };
        failedChecks++;
        this.log(`❌ ${check.name} failed: ${error.message}`, 'error');
      }
    }

    // Summary
    this.log('\n' + '='.repeat(60), 'header');
    this.log('HEALTH CHECK SUMMARY', 'header');
    this.log('='.repeat(60), 'header');
    
    const totalChecks = checks.length;
    const passedChecks = totalChecks - failedChecks;
    
    this.log(`Total Checks: ${totalChecks}`, 'info');
    this.log(`Passed: ${passedChecks}`, passedChecks === totalChecks ? 'success' : 'warning');
    this.log(`Failed: ${failedChecks}`, failedChecks === 0 ? 'success' : 'error');
    this.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`, 
             passedChecks === totalChecks ? 'success' : 'warning');

    // Detailed results
    this.log('\nDetailed Results:', 'header');
    for (const [checkName, result] of Object.entries(results)) {
      if (result.status === 'passed') {
        this.log(`✅ ${checkName}`, 'success');
      } else {
        this.log(`❌ ${checkName}: ${result.error}`, 'error');
      }
    }

    if (failedChecks === 0) {
      this.log('\n🎉 All health checks passed! Application is healthy.', 'success');
      return { success: true, results };
    } else {
      this.log(`\n💥 ${failedChecks} health check(s) failed. Application may have issues.`, 'error');
      return { success: false, results, failedChecks };
    }
  }
}

// Run health checks if script is executed directly
if (require.main === module) {
  const checker = new HealthChecker();
  
  checker.runAllChecks()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Health check runner failed:', error);
      process.exit(1);
    });
}

module.exports = HealthChecker;
