#!/usr/bin/env tsx

/**
 * Comprehensive test script for the document upload and processing system
 * Run with: npm run test:documents
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

import { storageService } from '../lib/supabase/storage';
import { llamaParseService } from '../lib/llamaparse';
import { getSupabaseAdmin } from '../lib/supabase/client';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001';

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof colors = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: string) {
  log(`\n🔍 ${step}`, 'cyan');
  log('─'.repeat(50), 'cyan');
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

async function createTestFile(): Promise<Buffer> {
  // Create a simple test PDF content (mock budget document)
  const testContent = `
CITY OF TESTVILLE
ANNUAL BUDGET DOCUMENT
FISCAL YEAR 2024

EXECUTIVE SUMMARY
This budget document outlines the City's financial plan for Fiscal Year 2024.

REVENUE SUMMARY
Property Tax Revenue: $5,250,000
Sales Tax Revenue: $2,100,000
State Aid: $1,800,000
Federal Grants: $750,000
Total Revenue: $9,900,000

EXPENDITURE SUMMARY

General Government Department
- Personnel: $1,200,000
- Operations: $450,000
- Capital: $200,000
- Total: $1,850,000

Police Department
- Personnel: $2,800,000
- Operations: $650,000
- Equipment: $300,000
- Total: $3,750,000

Fire Department
- Personnel: $2,200,000
- Operations: $400,000
- Equipment: $250,000
- Total: $2,850,000

Public Works Department
- Personnel: $800,000
- Operations: $600,000
- Capital Projects: $500,000
- Total: $1,900,000

Total Expenditures: $10,350,000

CONCLUSION
This budget reflects the City's commitment to maintaining essential services
while investing in infrastructure improvements.
`;

  return Buffer.from(testContent, 'utf-8');
}

async function testStorageConfiguration() {
  logStep('Testing Storage Configuration');

  try {
    // Test storage service initialization
    await storageService.initializeBuckets();
    logSuccess('Storage buckets initialized successfully');

    // Test file validation
    const testBuffer = await createTestFile();
    const testFile = new File([new Uint8Array(testBuffer)], 'test-budget.txt', { type: 'text/plain' });

    const validation = storageService.validateFile(testFile, 'documents');
    if (validation.valid) {
      logSuccess('File validation passed');
    } else {
      logError(`File validation failed: ${validation.errors.join(', ')}`);
      return false;
    }

    logInfo(`Max file size: ${validation.maxSize} bytes`);
    logInfo(`Allowed types: ${validation.allowedTypes?.join(', ')}`);

    return true;
  } catch (error) {
    logError(`Storage configuration test failed: ${error}`);
    return false;
  }
}

async function testLlamaParseIntegration() {
  logStep('Testing LlamaParse Integration');

  try {
    // Test API key configuration
    const usageInfo = llamaParseService.getUsageInfo();
    if (usageInfo.configured) {
      logSuccess(`LlamaParse API key configured: ${usageInfo.apiKey}`);
    } else {
      logError('LlamaParse API key not configured');
      return false;
    }

    // Test document processing
    const testBuffer = await createTestFile();
    logInfo('Processing test document with LlamaParse...');

    const result = await llamaParseService.processDocument(
      testBuffer,
      'test-budget.txt',
      {
        chunkSize: 500,
        chunkOverlap: 100
      }
    );

    logSuccess(`Document processed successfully`);
    logInfo(`Extracted text length: ${result.text.length} characters`);
    logInfo(`Generated chunks: ${result.chunks.length}`);
    logInfo(`Processing time: ${result.metadata.processedAt}`);

    // Show sample chunk
    if (result.chunks.length > 0) {
      logInfo(`Sample chunk content: ${result.chunks[0].content.substring(0, 100)}...`);
    }

    return true;
  } catch (error) {
    logError(`LlamaParse integration test failed: ${error}`);
    return false;
  }
}

async function testDatabaseConnection() {
  logStep('Testing Database Connection');

  try {
    const supabase = getSupabaseAdmin();

    // Test database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);

    if (error) {
      logError(`Database connection failed: ${error.message}`);
      return false;
    }

    logSuccess('Database connection successful');

    // Test documents table
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('count(*)')
      .limit(1);

    if (docsError) {
      logError(`Documents table access failed: ${docsError.message}`);
      return false;
    }

    logSuccess('Documents table accessible');

    // Test document_chunks table
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('count(*)')
      .limit(1);

    if (chunksError) {
      logError(`Document chunks table access failed: ${chunksError.message}`);
      return false;
    }

    logSuccess('Document chunks table accessible');

    return true;
  } catch (error) {
    logError(`Database connection test failed: ${error}`);
    return false;
  }
}

async function testAPIEndpoints() {
  logStep('Testing API Endpoints');

  try {
    // Test document list endpoint (should work without auth for basic connectivity)
    logInfo('Testing document list endpoint...');

    const response = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 401) {
      logSuccess('API endpoint responding correctly (returns 401 for unauthenticated request)');
    } else if (response.ok) {
      logSuccess('API endpoint accessible');
    } else {
      logWarning(`API endpoint returned status: ${response.status}`);
    }

    // Test batch processing status endpoint
    logInfo('Testing batch processing status endpoint...');

    const batchResponse = await fetch(`${BASE_URL}/api/documents/process-batch`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (batchResponse.status === 401) {
      logSuccess('Batch processing endpoint responding correctly (requires auth)');
    } else {
      logWarning(`Batch processing endpoint returned status: ${batchResponse.status}`);
    }

    return true;
  } catch (error) {
    logError(`API endpoints test failed: ${error}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  logStep('Testing Environment Variables');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'LLAMAPARSE_API_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      logSuccess(`${varName}: ${value.substring(0, 10)}...`);
    } else {
      logError(`${varName}: Missing`);
      allPresent = false;
    }
  }

  return allPresent;
}

async function generateTestReport(results: Record<string, boolean>) {
  logStep('Test Report');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;

  log(`\n📊 Test Results:`, 'bold');
  log(`Total Tests: ${totalTests}`, 'white');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, 'cyan');

  log(`\n📋 Detailed Results:`, 'bold');
  for (const [testName, passed] of Object.entries(results)) {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${testName}`, color);
  }

  if (failedTests === 0) {
    log(`\n🎉 All tests passed! The document upload and processing system is ready.`, 'green');
    log(`\n🚀 Next steps:`, 'cyan');
    log(`1. Log in as an admin user`, 'white');
    log(`2. Upload a test PDF document`, 'white');
    log(`3. Process the document using the API`, 'white');
    log(`4. Verify chunks are created in the database`, 'white');
  } else {
    log(`\n⚠️  Some tests failed. Please address the issues above before proceeding.`, 'red');
  }
}

async function runTests() {
  log(`${colors.bold}${colors.magenta}
╔═══════════════════════════════════════╗
║     BUDGET EXPLORER SYSTEM TESTS     ║
╚═══════════════════════════════════════╝
${colors.reset}`);

  const results: Record<string, boolean> = {};

  // Run all tests
  results['Environment Variables'] = await testEnvironmentVariables();
  results['Database Connection'] = await testDatabaseConnection();
  results['Storage Configuration'] = await testStorageConfiguration();
  results['LlamaParse Integration'] = await testLlamaParseIntegration();
  results['API Endpoints'] = await testAPIEndpoints();

  // Generate report
  await generateTestReport(results);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch((error) => {
    logError(`Test execution failed: ${error}`);
    process.exit(1);
  });
}

export { runTests };