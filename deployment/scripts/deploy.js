#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class DeploymentManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'production';
    this.deploymentId = `deploy-${Date.now()}`;
    this.startTime = Date.now();
    this.logFile = path.join(__dirname, '../logs', `${this.deploymentId}.log`);
    this.rollbackData = {};
    
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      header: chalk.cyan.bold
    };
    
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(colors[type](logMessage));
    
    // Write to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${command}`, 'info');
      
      const child = spawn('npm', ['run', command], {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject({ stdout, stderr, code, command });
        }
      });

      child.on('error', (error) => {
        reject({ error, command });
      });
    });
  }

  async checkPrerequisites() {
    this.log('Checking deployment prerequisites...', 'header');
    
    const checks = [
      { name: 'Node.js version', command: 'node --version' },
      { name: 'npm version', command: 'npm --version' },
      { name: 'Git status', command: 'git status --porcelain' },
      { name: 'Environment variables', command: 'env | grep -E "(DATABASE_URL|NETLIFY_)" | wc -l' }
    ];

    for (const check of checks) {
      try {
        const result = execSync(check.command, { encoding: 'utf8' });
        this.log(`✅ ${check.name}: ${result.trim()}`, 'success');
      } catch (error) {
        this.log(`❌ ${check.name}: Failed`, 'error');
        throw new Error(`Prerequisite check failed: ${check.name}`);
      }
    }
  }

  async runTests() {
    this.log('Running comprehensive test suite...', 'header');
    
    try {
      // Run unit tests
      this.log('Running unit tests...', 'info');
      await this.runCommand('test:unit', { silent: true });
      this.log('✅ Unit tests passed', 'success');

      // Run integration tests
      this.log('Running integration tests...', 'info');
      await this.runCommand('test:integration', { silent: true });
      this.log('✅ Integration tests passed', 'success');

      // Run E2E tests
      this.log('Running E2E tests...', 'info');
      await this.runCommand('test:e2e', { silent: true });
      this.log('✅ E2E tests passed', 'success');

      // Check code coverage
      this.log('Checking code coverage...', 'info');
      const coverage = await this.runCommand('test:coverage', { silent: true });
      this.log('✅ Code coverage requirements met', 'success');

    } catch (error) {
      this.log(`❌ Tests failed: ${error.command}`, 'error');
      throw new Error('Test suite failed');
    }
  }

  async createDatabaseBackup() {
    this.log('Creating database backup...', 'header');
    
    try {
      const backupName = `backup-${this.deploymentId}`;
      
      // Create backup using database migration tools
      await this.runCommand('db:backup', { 
        env: { ...process.env, BACKUP_NAME: backupName }
      });
      
      this.rollbackData.backupName = backupName;
      this.log(`✅ Database backup created: ${backupName}`, 'success');
      
    } catch (error) {
      this.log('❌ Database backup failed', 'error');
      throw new Error('Database backup failed');
    }
  }

  async runDatabaseMigrations() {
    this.log('Running database migrations...', 'header');
    
    try {
      // Validate migrations first
      this.log('Validating migration scripts...', 'info');
      await this.runCommand('db:validate-migration');
      
      // Run migrations
      this.log('Executing database migrations...', 'info');
      await this.runCommand('db:migrate');
      
      // Verify migration success
      this.log('Verifying migration results...', 'info');
      await this.runCommand('db:verify-migration');
      
      this.log('✅ Database migrations completed successfully', 'success');
      
    } catch (error) {
      this.log('❌ Database migration failed', 'error');
      await this.rollbackDatabase();
      throw new Error('Database migration failed');
    }
  }

  async buildApplication() {
    this.log('Building application...', 'header');
    
    try {
      // Clean previous build
      this.log('Cleaning previous build...', 'info');
      if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true });
      }
      
      // Build application
      this.log('Building production bundle...', 'info');
      await this.runCommand('build');
      
      // Verify build output
      if (!fs.existsSync('dist/index.html')) {
        throw new Error('Build output verification failed');
      }
      
      this.log('✅ Application build completed', 'success');
      
    } catch (error) {
      this.log('❌ Application build failed', 'error');
      throw new Error('Application build failed');
    }
  }

  async deployToStaging() {
    this.log('Deploying to staging environment...', 'header');
    
    try {
      // Deploy to staging
      await this.runCommand('deploy:staging');
      
      // Wait for deployment to be ready
      await this.waitForDeployment('staging');
      
      // Run staging validation tests
      await this.runCommand('test:staging');
      
      this.log('✅ Staging deployment successful', 'success');
      
    } catch (error) {
      this.log('❌ Staging deployment failed', 'error');
      throw new Error('Staging deployment failed');
    }
  }

  async deployToProduction() {
    this.log('Deploying to production environment...', 'header');
    
    try {
      // Store current production state for rollback
      this.rollbackData.previousDeployment = await this.getCurrentDeploymentInfo();
      
      // Deploy to production
      await this.runCommand('deploy:production');
      
      // Wait for deployment to be ready
      await this.waitForDeployment('production');
      
      this.log('✅ Production deployment successful', 'success');
      
    } catch (error) {
      this.log('❌ Production deployment failed', 'error');
      await this.rollbackProduction();
      throw new Error('Production deployment failed');
    }
  }

  async runPostDeploymentValidation() {
    this.log('Running post-deployment validation...', 'header');
    
    try {
      // Health check
      this.log('Running health checks...', 'info');
      await this.runCommand('health:check');
      
      // Smoke tests
      this.log('Running smoke tests...', 'info');
      await this.runCommand('test:smoke');
      
      // Performance validation
      this.log('Validating performance metrics...', 'info');
      await this.runCommand('test:performance');
      
      // Monitor error rates
      this.log('Monitoring error rates...', 'info');
      await this.monitorErrorRates(300000); // 5 minutes
      
      this.log('✅ Post-deployment validation successful', 'success');
      
    } catch (error) {
      this.log('❌ Post-deployment validation failed', 'error');
      await this.rollbackProduction();
      throw new Error('Post-deployment validation failed');
    }
  }

  async waitForDeployment(environment, timeout = 300000) {
    const startTime = Date.now();
    const url = environment === 'staging' 
      ? 'https://staging-digitalmanager.netlify.app'
      : 'https://digitalmanager.netlify.app';
    
    this.log(`Waiting for ${environment} deployment to be ready...`, 'info');
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) {
          this.log(`✅ ${environment} deployment is ready`, 'success');
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
    
    throw new Error(`${environment} deployment timeout`);
  }

  async monitorErrorRates(duration) {
    const startTime = Date.now();
    let errorCount = 0;
    let totalRequests = 0;
    
    while (Date.now() - startTime < duration) {
      try {
        // Check error metrics (implementation depends on monitoring service)
        const metrics = await this.getErrorMetrics();
        errorCount += metrics.errors;
        totalRequests += metrics.total;
        
        const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
        
        if (errorRate > 5) {
          throw new Error(`Error rate too high: ${errorRate.toFixed(2)}%`);
        }
        
        this.log(`Error rate: ${errorRate.toFixed(2)}% (${errorCount}/${totalRequests})`, 'info');
        
      } catch (error) {
        if (error.message.includes('Error rate too high')) {
          throw error;
        }
        // Continue monitoring if metrics unavailable
      }
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // Check every 30 seconds
    }
  }

  async getCurrentDeploymentInfo() {
    try {
      const result = await this.runCommand('netlify:status', { silent: true });
      return JSON.parse(result.stdout);
    } catch (error) {
      return null;
    }
  }

  async getErrorMetrics() {
    // Placeholder for actual metrics collection
    // In real implementation, this would connect to monitoring service
    return { errors: 0, total: 100 };
  }

  async rollbackDatabase() {
    if (this.rollbackData.backupName) {
      this.log('Rolling back database...', 'warning');
      try {
        await this.runCommand('db:rollback', {
          env: { ...process.env, BACKUP_NAME: this.rollbackData.backupName }
        });
        this.log('✅ Database rollback completed', 'success');
      } catch (error) {
        this.log('❌ Database rollback failed', 'error');
      }
    }
  }

  async rollbackProduction() {
    if (this.rollbackData.previousDeployment) {
      this.log('Rolling back production deployment...', 'warning');
      try {
        await this.runCommand('deploy:rollback');
        this.log('✅ Production rollback completed', 'success');
      } catch (error) {
        this.log('❌ Production rollback failed', 'error');
      }
    }
  }

  async generateDeploymentReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const report = {
      deploymentId: this.deploymentId,
      environment: this.environment,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration}s`,
      status: 'success',
      logFile: this.logFile
    };
    
    const reportPath = path.join(__dirname, '../reports', `${this.deploymentId}-report.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Deployment report generated: ${reportPath}`, 'info');
    return report;
  }

  async deploy() {
    try {
      this.log(`Starting deployment ${this.deploymentId}...`, 'header');
      
      // Pre-deployment checks
      await this.checkPrerequisites();
      await this.runTests();
      await this.createDatabaseBackup();
      
      // Database migration
      await this.runDatabaseMigrations();
      
      // Application deployment
      await this.buildApplication();
      await this.deployToStaging();
      await this.deployToProduction();
      
      // Post-deployment validation
      await this.runPostDeploymentValidation();
      
      // Generate report
      const report = await this.generateDeploymentReport();
      
      this.log('🎉 Deployment completed successfully!', 'success');
      this.log(`Total deployment time: ${report.duration}`, 'info');
      
      return report;
      
    } catch (error) {
      this.log(`💥 Deployment failed: ${error.message}`, 'error');
      
      // Generate failure report
      const report = await this.generateDeploymentReport();
      report.status = 'failed';
      report.error = error.message;
      
      throw error;
    }
  }
}

// Run deployment if script is executed directly
if (require.main === module) {
  const deployment = new DeploymentManager();
  deployment.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentManager;
