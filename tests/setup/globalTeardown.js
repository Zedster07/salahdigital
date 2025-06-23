import fs from 'fs';
import path from 'path';

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up test data
  await cleanupTestData();
  
  // Generate final test report summary
  await generateFinalReport();
  
  console.log('✅ Global test teardown completed');
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  try {
    const testDataDir = path.join(process.cwd(), 'tests', 'data');
    
    if (fs.existsSync(testDataDir)) {
      // Clean up temporary test files
      const files = fs.readdirSync(testDataDir);
      files.forEach(file => {
        if (file.startsWith('temp-') || file.startsWith('test-')) {
          const filePath = path.join(testDataDir, file);
          fs.unlinkSync(filePath);
          console.log(`🗑️ Removed temporary file: ${file}`);
        }
      });
    }
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error.message);
  }
}

async function generateFinalReport() {
  console.log('📊 Generating final test report...');
  
  try {
    const reportsDir = path.join(process.cwd(), 'tests', 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      console.log('📁 No reports directory found, skipping report generation');
      return;
    }
    
    // Collect all test results
    const testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0
      },
      reports: []
    };
    
    // Check for Jest results
    const jestResultsPath = path.join(reportsDir, 'junit.xml');
    if (fs.existsSync(jestResultsPath)) {
      testResults.reports.push({
        type: 'jest',
        path: jestResultsPath,
        exists: true
      });
    }
    
    // Check for Playwright results
    const playwrightResultsPath = path.join(reportsDir, 'playwright-results.json');
    if (fs.existsSync(playwrightResultsPath)) {
      testResults.reports.push({
        type: 'playwright',
        path: playwrightResultsPath,
        exists: true
      });
      
      // Parse Playwright results
      try {
        const playwrightData = JSON.parse(fs.readFileSync(playwrightResultsPath, 'utf8'));
        if (playwrightData.stats) {
          testResults.summary.totalTests += playwrightData.stats.total || 0;
          testResults.summary.passedTests += playwrightData.stats.passed || 0;
          testResults.summary.failedTests += playwrightData.stats.failed || 0;
          testResults.summary.skippedTests += playwrightData.stats.skipped || 0;
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse Playwright results:', error.message);
      }
    }
    
    // Check for coverage reports
    const coverageDir = path.join(reportsDir, 'coverage');
    if (fs.existsSync(coverageDir)) {
      testResults.reports.push({
        type: 'coverage',
        path: coverageDir,
        exists: true
      });
    }
    
    // Save final summary
    const summaryPath = path.join(reportsDir, 'final-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(testResults, null, 2));
    
    console.log('📊 Final test report summary:');
    console.log(`   Total Tests: ${testResults.summary.totalTests}`);
    console.log(`   Passed: ${testResults.summary.passedTests}`);
    console.log(`   Failed: ${testResults.summary.failedTests}`);
    console.log(`   Skipped: ${testResults.summary.skippedTests}`);
    console.log(`   Reports Generated: ${testResults.reports.length}`);
    
    console.log('✅ Final report generation completed');
  } catch (error) {
    console.warn('⚠️ Final report generation failed:', error.message);
  }
}

export default globalTeardown;
