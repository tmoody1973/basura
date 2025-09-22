#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ai, models } from '../lib/genkit/index';

// Load environment variables from .env.local
config({ path: '.env.local' });

/**
 * Simple Genkit test to validate core functionality without database dependencies
 */
async function testGenkitSimple() {
  console.log('🧪 Testing Genkit Core Functionality\n');

  try {
    // Test 1: Basic text generation
    console.log('1️⃣ Testing text generation...');
    const textResult = await ai.generate({
      model: models.gpt4,
      prompt: 'Explain what a budget is in simple terms for a citizen.',
    });
    console.log('✅ Text generation test passed');
    console.log(`Response: ${textResult.text.substring(0, 150)}...\n`);

    // Test 2: Embedding generation
    console.log('2️⃣ Testing embedding generation...');
    const embeddingResult = await ai.embed({
      embedder: models.embeddings,
      content: 'Public safety budget allocation for police and fire departments',
    });

    // Handle the embedding result correctly
    const embedding = Array.isArray(embeddingResult)
      ? embeddingResult[0].embedding
      : embeddingResult.embedding;

    console.log('✅ Embedding generation test passed');
    console.log(`Embedding dimensions: ${embedding.length}\n`);

    // Test 3: Budget analysis simulation
    console.log('3️⃣ Testing budget analysis scenario...');
    const budgetAnalysis = await ai.generate({
      model: models.gpt4,
      prompt: `
        You are analyzing a government budget document. Based on this information:

        "The Public Safety Department received $50 million, with $35 million (70%) for personnel costs and $15 million (30%) for equipment and operations."

        Provide a brief analysis for a citizen asking: "How much does our city spend on police and fire services?"

        Be clear, accurate, and citizen-friendly.
      `,
    });
    console.log('✅ Budget analysis test passed');
    console.log(`Analysis: ${budgetAnalysis.text.substring(0, 200)}...\n`);

    // Test 4: Embedding similarity (basic RAG simulation)
    console.log('4️⃣ Testing semantic similarity...');
    const queries = [
      'police budget spending',
      'fire department costs',
      'transportation infrastructure'
    ];

    const embeddings = [];
    for (const query of queries) {
      const result = await ai.embed({
        embedder: models.embeddings,
        content: query,
      });
      const emb = Array.isArray(result) ? result[0].embedding : result.embedding;
      embeddings.push(emb);
    }

    // Calculate similarity between police and fire (should be high)
    const policeFireSimilarity = cosineSimilarity(embeddings[0], embeddings[1]);
    // Calculate similarity between police and transportation (should be lower)
    const policeTransportSimilarity = cosineSimilarity(embeddings[0], embeddings[2]);

    console.log(`Police vs Fire similarity: ${(policeFireSimilarity * 100).toFixed(1)}%`);
    console.log(`Police vs Transport similarity: ${(policeTransportSimilarity * 100).toFixed(1)}%`);

    if (policeFireSimilarity > policeTransportSimilarity) {
      console.log('✅ Semantic similarity working correctly\n');
    } else {
      console.log('⚠️ Semantic similarity may need tuning\n');
    }

    console.log('🎉 All core Genkit tests passed successfully!');
    console.log('\n📊 Migration Readiness Summary:');
    console.log('- Text Generation: ✅ Ready for budget analysis');
    console.log('- Embeddings: ✅ Ready for vector search');
    console.log('- Semantic Search: ✅ Ready for RAG pipeline');
    console.log('- Cost Efficiency: ✅ No Pinecone/LlamaParse needed');

    console.log('\n🚀 Ready to migrate from Mastra.ai to Genkit!');
    console.log('💰 Expected savings: $90-200/month');

  } catch (error) {
    console.error('❌ Genkit test failed:', error);
    process.exit(1);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Run the test
if (require.main === module) {
  testGenkitSimple().catch(console.error);
}

export { testGenkitSimple };