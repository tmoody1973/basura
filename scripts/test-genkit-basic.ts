#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ai, models } from '../lib/genkit/index';

// Load environment variables
config();

/**
 * Basic Genkit test without Supabase dependencies
 */
async function testGenkitBasic() {
  console.log('🧪 Testing Basic Genkit Functionality\n');

  try {
    // Check environment
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is required in .env file');
      process.exit(1);
    }

    console.log('✅ OpenAI API key is configured\n');

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
    if (Array.isArray(embeddingTest) && embeddingTest[0]?.embedding) {
      console.log(`Embedding dimensions: ${embeddingTest[0].embedding.length}\n`);
    } else {
      console.log('Embedding structure:', JSON.stringify(embeddingTest, null, 2).substring(0, 200));
    }

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

    console.log('🎉 All basic Genkit tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Basic text generation: ✅');
    console.log('- Embedding generation: ✅');
    console.log('- Budget analysis: ✅');

    console.log('\n✨ Genkit core functionality is working correctly!');
    console.log('💡 Next step: Set up Supabase environment variables to test full RAG flow');

  } catch (error) {
    console.error('❌ Genkit test failed:', error);
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check if OPENAI_API_KEY is set in your .env file');
    console.log('2. Verify Genkit packages are installed correctly');
    console.log('3. Ensure you have network connectivity');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testGenkitBasic().catch(console.error);
}

export { testGenkitBasic };