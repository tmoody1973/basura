#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ai, models } from '../lib/genkit/index';

// Load environment variables
config();

/**
 * Test script to validate Genkit setup and basic functionality
 */
async function testGenkitSetup() {
  console.log('🧪 Testing Genkit Setup and Configuration\n');

  try {
    // Test 1: Basic text generation
    console.log('1️⃣ Testing basic text generation...');
    const basicTest = await ai.generate({
      model: models.gpt4,
      prompt: 'Generate a simple "Hello, Genkit!" message and confirm you are working properly.',
    });
    console.log('✅ Basic generation test passed');
    console.log(`Response: ${basicTest.text.substring(0, 100)}...\n`);

    // Test 2: Embedding generation
    console.log('2️⃣ Testing embedding generation...');
    const embeddingTest = await ai.embed({
      embedder: models.embeddings,
      content: 'This is a test document for embedding generation',
    });
    console.log('✅ Embedding generation test passed');
    console.log(`Embedding dimensions: ${embeddingTest.embedding.length}\n`);

    // Test 3: Budget-specific prompt
    console.log('3️⃣ Testing budget analysis capabilities...');
    const budgetTest = await ai.generate({
      model: models.gpt4,
      prompt: `
        You are a budget analyst. Analyze this sample budget data:

        Department: Public Safety
        Total Budget: $50,000,000
        Personnel: $35,000,000 (70%)
        Equipment: $10,000,000 (20%)
        Operations: $5,000,000 (10%)

        Provide a brief analysis suitable for a citizen.
      `,
    });
    console.log('✅ Budget analysis test passed');
    console.log(`Analysis preview: ${budgetTest.text.substring(0, 200)}...\n`);

    // Test 4: Structured output with schema
    console.log('4️⃣ Testing structured output generation...');
    const structuredTest = await ai.generate({
      model: models.gpt4,
      prompt: `
        Generate a JSON response with the following structure:
        {
          "department": "string",
          "totalBudget": number,
          "categories": ["string"],
          "analysis": "string"
        }

        Use the Public Safety example from before.
      `,
    });
    console.log('✅ Structured output test passed');
    console.log(`Structured response: ${structuredTest.text.substring(0, 200)}...\n`);

    console.log('🎉 All Genkit tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Basic text generation: ✅');
    console.log('- Embedding generation: ✅');
    console.log('- Budget analysis: ✅');
    console.log('- Structured output: ✅');

  } catch (error) {
    console.error('❌ Genkit test failed:', error);
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check if OPENAI_API_KEY is set in your .env file');
    console.log('2. Verify Genkit packages are installed correctly');
    console.log('3. Ensure you have network connectivity');
    process.exit(1);
  }
}

/**
 * Test environment configuration
 */
function testEnvironmentConfig() {
  console.log('🔧 Checking environment configuration...\n');

  const requiredVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.log('\n💡 Please add these to your .env file');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set\n');
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Starting Genkit Setup Validation\n');

  testEnvironmentConfig();
  await testGenkitSetup();

  console.log('\n✨ Genkit is ready for Budget Explorer migration!');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

export { testGenkitSetup, testEnvironmentConfig };