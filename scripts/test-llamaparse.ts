#!/usr/bin/env tsx

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

import { llamaParseService } from '../lib/llamaparse';
import { readFile } from 'fs/promises';

/**
 * Test script to verify LlamaParse is working
 * Usage: npm run test:llamaparse [path-to-pdf]
 */

async function testLlamaParse() {
  console.log('🧪 Testing LlamaParse Integration\n');
  console.log('='.repeat(50));

  // Check if API key is configured
  const config = llamaParseService.getUsageInfo();
  console.log('📋 Configuration:');
  console.log(`  - API Key: ${config.apiKey}`);
  console.log(`  - Configured: ${config.configured ? '✅ Yes' : '❌ No'}`);

  if (!config.configured) {
    console.error('\n❌ LLAMAPARSE_API_KEY is not configured in .env.local');
    process.exit(1);
  }

  // Validate API key
  console.log('\n🔑 Validating API key...');
  const isValid = await llamaParseService.validateApiKey();
  if (!isValid) {
    console.error('❌ API key validation failed. Check your LLAMAPARSE_API_KEY');
    process.exit(1);
  }
  console.log('✅ API key is valid');

  // Get test file path
  const testFilePath = process.argv[2] || '/tmp/test-budget.txt';

  try {
    // Read test file
    console.log(`\n📄 Reading test file: ${testFilePath}`);
    const fileBuffer = await readFile(testFilePath);
    const fileName = path.basename(testFilePath);

    console.log(`  - File name: ${fileName}`);
    console.log(`  - File size: ${fileBuffer.length} bytes`);

    // Process with LlamaParse
    console.log('\n🚀 Starting LlamaParse processing...');
    console.log('='.repeat(50));

    const result = await llamaParseService.processDocument(
      fileBuffer,
      fileName,
      {
        chunkSize: 1200,  // Optimal for budget documents
        chunkOverlap: 200  // Good overlap for context
      }
    );

    // Display results
    console.log('\n✅ Processing Complete!');
    console.log('='.repeat(50));

    console.log('\n📊 Results Summary:');
    console.log(`  - Document ID: ${result.id}`);
    console.log(`  - Text length: ${result.text.length} characters`);
    console.log(`  - Chunks created: ${result.chunks.length}`);
    console.log(`  - Page count: ${result.metadata.pageCount}`);
    console.log(`  - Processed at: ${result.metadata.processedAt}`);

    console.log('\n📝 Text Preview (first 500 chars):');
    console.log('-'.repeat(50));
    console.log(result.text.substring(0, 500));
    console.log('-'.repeat(50));

    console.log('\n📦 Sample Chunks:');
    result.chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(`  - ID: ${chunk.id}`);
      console.log(`  - Page: ${chunk.metadata.pageNumber}`);
      console.log(`  - Preview: ${chunk.content.substring(0, 100)}...`);
    });

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testLlamaParse().catch(console.error);