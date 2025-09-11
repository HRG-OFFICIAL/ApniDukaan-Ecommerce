#!/usr/bin/env tsx
/**
 * Security Test Runner
 * 
 * This script runs all security tests and provides a comprehensive report
 * of the authentication and security implementation status.
 */

import { runSecurityTests as runTests } from '../utils/securityTesting';

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(60));
}

function logSubheader(title: string) {
  console.log('\n' + '-'.repeat(40));
  log(`${colors.bold}${colors.blue}${title}${colors.reset}`);
  console.log('-'.repeat(40));
}

function logTestResult(testName: string, passed: boolean, details?: string) {
  const status = passed ? 
    `${colors.green}✓ PASS${colors.reset}` : 
    `${colors.red}✗ FAIL${colors.reset}`;
  
  log(`${status} ${testName}`);
  if (details) {
    log(`    ${colors.yellow}${details}${colors.reset}`);
  }
}

async function runSecurityTests() {
  logHeader('🔐 SECURITY TEST SUITE');
  log('Running comprehensive authentication and security tests...\n');

  try {
    // Run all security tests using the consolidated function
    const testSuites = await runTests();
    
    let totalTests = 0;
    let passedTests = 0;
    
    // Process each test suite
    for (const suite of testSuites) {
      logSubheader(suite.name);
      
      // Process individual tests in the suite
      for (const test of suite.tests) {
        totalTests++;
        if (test.passed) passedTests++;
        
        logTestResult(
          test.testName,
          test.passed,
          test.details ? JSON.stringify(test.details) : test.message
        );
      }
    }

    // Generate a simple security report based on test results
    logSubheader('Security Report');
    
    // Calculate metrics
    const successRate = Math.round((passedTests / totalTests) * 100);
    const securityScore = successRate; // Simple mapping for now
    
    // Display implemented and missing features based on test results
    const implementedFeatures = [];
    const missingFeatures = [];
    const recommendations = [];
    
    // Add some basic features based on test results
    for (const suite of testSuites) {
      const passedTests = suite.tests.filter(t => t.passed);
      const failedTests = suite.tests.filter(t => !t.passed);
      
      for (const test of passedTests) {
        implementedFeatures.push(`${test.testName} - ${test.message}`);
      }
      
      for (const test of failedTests) {
        missingFeatures.push(`${test.testName} - ${test.message}`);
        recommendations.push(`Implement proper ${test.testName.toLowerCase()} mechanism`);
      }
    }
    
    log(`${colors.bold}Implementation Status:${colors.reset}`);
    implementedFeatures.forEach(feature => {
      log(`  ${colors.green}✓${colors.reset} ${feature}`);
    });

    if (missingFeatures.length > 0) {
      log(`\n${colors.bold}Missing Features:${colors.reset}`);
      missingFeatures.forEach(feature => {
        log(`  ${colors.red}✗${colors.reset} ${feature}`);
      });
    }

    if (recommendations.length > 0) {
      log(`\n${colors.bold}Recommendations:${colors.reset}`);
      recommendations.forEach(rec => {
        log(`  ${colors.yellow}!${colors.reset} ${rec}`);
      });
    }

    // Final summary
    logHeader('📊 TEST SUMMARY');
    const summaryColor = successRate >= 90 ? colors.green : 
                        successRate >= 70 ? colors.yellow : colors.red;
    
    log(`Total Tests: ${colors.bold}${totalTests}${colors.reset}`);
    log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
    log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
    log(`Success Rate: ${summaryColor}${colors.bold}${successRate}%${colors.reset}`);
    
    log(`\nSecurity Score: ${summaryColor}${colors.bold}${securityScore}/100${colors.reset}`);

    if (successRate >= 90) {
      log(`\n${colors.green}🎉 Excellent! Your authentication system is well secured.${colors.reset}`);
    } else if (successRate >= 70) {
      log(`\n${colors.yellow}⚠️  Good progress! Address the failing tests for better security.${colors.reset}`);
    } else {
      log(`\n${colors.red}🚨 Critical issues found! Please address security gaps immediately.${colors.reset}`);
    }

    logHeader('🏁 TESTING COMPLETE');
    
    // Exit with appropriate code
    process.exit(successRate >= 70 ? 0 : 1);

  } catch (error) {
    log(`\n${colors.red}❌ Error running security tests:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runSecurityTests();
}

export { runSecurityTests };
