#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0, coverage: null },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
      accessibility: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
    this.reportDir = path.join(__dirname, '../reports');
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
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
    
    console.log(`${colors[type](`[${timestamp}]`)} ${colors[type](message)}`);
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${command}`, 'info');
      
      const child = spawn('npm', ['run', command], {
        stdio: 'pipe',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (options.verbose) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject({ stdout, stderr, code });
        }
      });

      child.on('error', (error) => {
        reject({ error, stdout, stderr });
      });
    });
  }

  parseJestResults(output) {
    const results = { passed: 0, failed: 0, total: 0, coverage: null };
    
    // Parse test results
    const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    if (testMatch) {
      results.failed = parseInt(testMatch[1]);
      results.passed = parseInt(testMatch[2]);
      results.total = parseInt(testMatch[3]);
    } else {
      const passMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (passMatch) {
        results.passed = parseInt(passMatch[1]);
        results.total = parseInt(passMatch[2]);
        results.failed = 0;
      }
    }

    // Parse coverage
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      results.coverage = {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4])
      };
    }

    return results;
  }

  parsePlaywrightResults(output) {
    const results = { passed: 0, failed: 0, total: 0 };
    
    const match = output.match(/(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+total/);
    if (match) {
      results.passed = parseInt(match[1]);
      results.failed = parseInt(match[2]);
      results.total = parseInt(match[3]);
    }

    return results;
  }

  async runUnitTests() {
    this.log('Running Unit Tests...', 'header');
    
    try {
      const result = await this.runCommand('test:unit', { verbose: true });
      this.results.unit = this.parseJestResults(result.stdout);
      this.log(`Unit Tests: ${this.results.unit.passed}/${this.results.unit.total} passed`, 'success');
      
      if (this.results.unit.coverage) {
        this.log(`Coverage: ${this.results.unit.coverage.lines}% lines, ${this.results.unit.coverage.branches}% branches`, 'info');
      }
      
      return true;
    } catch (error) {
      this.results.unit = this.parseJestResults(error.stdout || '');
      this.log(`Unit Tests Failed: ${this.results.unit.failed} tests failed`, 'error');
      return false;
    }
  }

  async runIntegrationTests() {
    this.log('Running Integration Tests...', 'header');
    
    try {
      const result = await this.runCommand('test:integration', { verbose: true });
      this.results.integration = this.parseJestResults(result.stdout);
      this.log(`Integration Tests: ${this.results.integration.passed}/${this.results.integration.total} passed`, 'success');
      return true;
    } catch (error) {
      this.results.integration = this.parseJestResults(error.stdout || '');
      this.log(`Integration Tests Failed: ${this.results.integration.failed} tests failed`, 'error');
      return false;
    }
  }

  async runE2ETests() {
    this.log('Running E2E Tests...', 'header');
    
    try {
      const result = await this.runCommand('test:e2e', { verbose: true });
      this.results.e2e = this.parsePlaywrightResults(result.stdout);
      this.log(`E2E Tests: ${this.results.e2e.passed}/${this.results.e2e.total} passed`, 'success');
      return true;
    } catch (error) {
      this.results.e2e = this.parsePlaywrightResults(error.stdout || '');
      this.log(`E2E Tests Failed: ${this.results.e2e.failed} tests failed`, 'error');
      return false;
    }
  }

  async runPerformanceTests() {
    this.log('Running Performance Tests...', 'header');
    
    try {
      // Lighthouse performance tests
      const result = await this.runCommand('test:performance', { verbose: true });
      this.results.performance = { passed: 1, failed: 0, total: 1 };
      this.log('Performance Tests: All checks passed', 'success');
      return true;
    } catch (error) {
      this.results.performance = { passed: 0, failed: 1, total: 1 };
      this.log('Performance Tests Failed', 'error');
      return false;
    }
  }

  async runAccessibilityTests() {
    this.log('Running Accessibility Tests...', 'header');
    
    try {
      // Axe accessibility tests
      const result = await this.runCommand('test:a11y', { verbose: true });
      this.results.accessibility = { passed: 1, failed: 0, total: 1 };
      this.log('Accessibility Tests: All checks passed', 'success');
      return true;
    } catch (error) {
      this.results.accessibility = { passed: 0, failed: 1, total: 1 };
      this.log('Accessibility Tests Failed', 'error');
      return false;
    }
  }

  generateSummaryReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const totalPassed = Object.values(this.results).reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, result) => sum + result.failed, 0);
    const totalTests = Object.values(this.results).reduce((sum, result) => sum + result.total, 0);
    
    const report = {
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
        duration: `${duration}s`,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      coverage: this.results.unit.coverage
    };

    // Save JSON report
    const jsonReportPath = path.join(this.reportDir, 'test-summary.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    return report;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Manager Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .success { color: #28a745; }
        .danger { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .test-results { margin-bottom: 30px; }
        .test-category { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .test-category h3 { margin: 0 0 10px 0; }
        .progress-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .coverage-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Digital Manager Test Report</h1>
            <p>Generated on ${new Date(report.summary.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value info">${report.summary.totalTests}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value success">${report.summary.totalPassed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value ${report.summary.totalFailed > 0 ? 'danger' : 'success'}">${report.summary.totalFailed}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value ${report.summary.successRate >= 90 ? 'success' : report.summary.successRate >= 70 ? 'warning' : 'danger'}">${report.summary.successRate}%</div>
            </div>
            <div class="metric">
                <h3>Duration</h3>
                <div class="value info">${report.summary.duration}</div>
            </div>
        </div>

        <div class="test-results">
            <h2>Test Results by Category</h2>
            ${Object.entries(report.results).map(([category, result]) => `
                <div class="test-category">
                    <h3>${category.charAt(0).toUpperCase() + category.slice(1)} Tests</h3>
                    <p>${result.passed}/${result.total} passed (${result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0}%)</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${result.total > 0 ? (result.passed / result.total) * 100 : 0}%"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${report.coverage ? `
        <div class="coverage">
            <h2>Code Coverage</h2>
            <div class="coverage-grid">
                <div class="coverage-item">
                    <h4>Statements</h4>
                    <div class="value ${report.coverage.statements >= 70 ? 'success' : 'warning'}">${report.coverage.statements}%</div>
                </div>
                <div class="coverage-item">
                    <h4>Branches</h4>
                    <div class="value ${report.coverage.branches >= 70 ? 'success' : 'warning'}">${report.coverage.branches}%</div>
                </div>
                <div class="coverage-item">
                    <h4>Functions</h4>
                    <div class="value ${report.coverage.functions >= 70 ? 'success' : 'warning'}">${report.coverage.functions}%</div>
                </div>
                <div class="coverage-item">
                    <h4>Lines</h4>
                    <div class="value ${report.coverage.lines >= 70 ? 'success' : 'warning'}">${report.coverage.lines}%</div>
                </div>
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    const htmlReportPath = path.join(this.reportDir, 'test-report.html');
    fs.writeFileSync(htmlReportPath, html);
    this.log(`HTML report generated: ${htmlReportPath}`, 'success');
  }

  printSummary(report) {
    this.log('\n' + '='.repeat(60), 'header');
    this.log('TEST EXECUTION SUMMARY', 'header');
    this.log('='.repeat(60), 'header');
    
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
    this.log(`Passed: ${report.summary.totalPassed}`, 'success');
    this.log(`Failed: ${report.summary.totalFailed}`, report.summary.totalFailed > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${report.summary.successRate}%`, report.summary.successRate >= 90 ? 'success' : 'warning');
    this.log(`Duration: ${report.summary.duration}`, 'info');
    
    if (report.coverage) {
      this.log('\nCode Coverage:', 'header');
      this.log(`Lines: ${report.coverage.lines}%`, report.coverage.lines >= 70 ? 'success' : 'warning');
      this.log(`Branches: ${report.coverage.branches}%`, report.coverage.branches >= 70 ? 'success' : 'warning');
      this.log(`Functions: ${report.coverage.functions}%`, report.coverage.functions >= 70 ? 'success' : 'warning');
      this.log(`Statements: ${report.coverage.statements}%`, report.coverage.statements >= 70 ? 'success' : 'warning');
    }
    
    this.log('\n' + '='.repeat(60), 'header');
  }

  async run() {
    this.log('Starting Digital Manager Test Suite...', 'header');
    
    const testSuites = [
      { name: 'Unit Tests', fn: () => this.runUnitTests() },
      { name: 'Integration Tests', fn: () => this.runIntegrationTests() },
      { name: 'E2E Tests', fn: () => this.runE2ETests() },
      { name: 'Performance Tests', fn: () => this.runPerformanceTests() },
      { name: 'Accessibility Tests', fn: () => this.runAccessibilityTests() }
    ];

    let allPassed = true;

    for (const suite of testSuites) {
      try {
        const passed = await suite.fn();
        if (!passed) allPassed = false;
      } catch (error) {
        this.log(`${suite.name} encountered an error: ${error.message}`, 'error');
        allPassed = false;
      }
    }

    const report = this.generateSummaryReport();
    this.printSummary(report);

    if (allPassed && report.summary.successRate >= 90) {
      this.log('All tests passed! 🎉', 'success');
      process.exit(0);
    } else {
      this.log('Some tests failed. Please review the results.', 'error');
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
