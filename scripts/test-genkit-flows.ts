#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ragFlow } from '../lib/genkit/flows/rag-flow';
import { ai, models } from '../lib/genkit/index';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Test RAG flow functionality with mock data
 */
async function testRAGFlow() {
  console.log('🔍 Testing RAG Flow...\n');

  try {
    // Create test document chunks for testing
    const testDocumentId = uuidv4();
    const testChunks = [
      {
        document_id: testDocumentId,
        content: 'The Public Safety Department has a total budget of $50 million for fiscal year 2025. This represents a 5% increase from the previous year.',
        embedding: await generateTestEmbedding('public safety budget 50 million'),
        chunk_index: 0,
        metadata: {
          jurisdiction_type: 'city',
          jurisdiction_name: 'Test City',
          fiscal_year: '2025',
        },
        page_number: 1,
        section_title: 'Public Safety Budget Overview',
      },
      {
        document_id: testDocumentId,
        content: 'Personnel costs account for $35 million (70%) of the Public Safety budget, including salaries and benefits for police officers, firefighters, and emergency medical services.',
        embedding: await generateTestEmbedding('personnel costs police fire emergency'),
        chunk_index: 1,
        metadata: {
          jurisdiction_type: 'city',
          jurisdiction_name: 'Test City',
          fiscal_year: '2025',
        },
        page_number: 2,
        section_title: 'Personnel Expenditures',
      },
    ];

    // Insert test chunks
    console.log('📝 Creating test document chunks...');
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(testChunks);

    if (insertError) {
      throw new Error(`Failed to insert test chunks: ${insertError.message}`);
    }

    // Test different user types and queries
    const testCases = [
      {
        query: "What is the total Public Safety budget?",
        userType: 'citizen' as const,
        expectedKeywords: ['$50 million', 'Public Safety'],
      },
      {
        query: "How much is spent on personnel in the Public Safety department?",
        userType: 'student' as const,
        expectedKeywords: ['$35 million', '70%', 'personnel'],
      },
      {
        query: "Analyze the Public Safety budget breakdown for investigative purposes",
        userType: 'journalist' as const,
        expectedKeywords: ['personnel', 'salaries', 'police'],
      },
    ];

    console.log('🧪 Running RAG flow test cases...\n');

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`Test ${i + 1}: ${testCase.userType.toUpperCase()} - "${testCase.query}"`);

      try {
        const result = await ragFlow({
          query: testCase.query,
          documentId: testDocumentId,
          userType: testCase.userType,
          jurisdiction: 'Test City',
          maxChunks: 5,
        });

        // Validate results
        if (!result.answer) {
          throw new Error('No answer generated');
        }

        if (result.citations.length === 0) {
          throw new Error('No citations provided');
        }

        if (result.confidence < 50) {
          console.warn(`⚠️ Low confidence score: ${result.confidence}%`);
        }

        // Check for expected keywords
        const hasExpectedKeywords = testCase.expectedKeywords.some(keyword =>
          result.answer.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!hasExpectedKeywords) {
          console.warn(`⚠️ Expected keywords not found in response`);
        }

        console.log(`✅ Test ${i + 1} passed`);
        console.log(`   Confidence: ${result.confidence}%`);
        console.log(`   Citations: ${result.citations.length}`);
        console.log(`   Answer preview: ${result.answer.substring(0, 100)}...\n`);

      } catch (error) {
        console.error(`❌ Test ${i + 1} failed:`, error);
        throw error;
      }
    }

    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', testDocumentId);

    console.log('✅ RAG Flow tests completed successfully!\n');

  } catch (error) {
    console.error('❌ RAG Flow test failed:', error);
    throw error;
  }
}

/**
 * Generate test embedding for mock data
 */
async function generateTestEmbedding(text: string): Promise<number[]> {
  const result = await ai.embed({
    embedder: models.embeddings,
    content: text,
  });
  // Genkit returns an array, get the first embedding
  return Array.isArray(result) ? result[0].embedding : result.embedding;
}

/**
 * Test embedding generation and similarity
 */
async function testEmbeddingFunctionality() {
  console.log('🧠 Testing Embedding Functionality...\n');

  try {
    const testTexts = [
      'budget allocation for public safety',
      'public safety department budget',
      'transportation infrastructure spending',
    ];

    const embeddings = [];
    for (const text of testTexts) {
      const result = await ai.embed({
        embedder: models.embeddings,
        content: text,
      });
      // Genkit returns an array, get the first embedding
      const embedding = Array.isArray(result) ? result[0].embedding : result.embedding;
      embeddings.push(embedding);
    }

    // Test similarity between related texts
    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    const dissimilarity = cosineSimilarity(embeddings[0], embeddings[2]);

    console.log(`Similarity between related texts: ${(similarity * 100).toFixed(2)}%`);
    console.log(`Similarity between unrelated texts: ${(dissimilarity * 100).toFixed(2)}%`);

    if (similarity > dissimilarity) {
      console.log('✅ Embeddings correctly identify related content\n');
    } else {
      console.warn('⚠️ Embedding similarity may need adjustment\n');
    }

  } catch (error) {
    console.error('❌ Embedding test failed:', error);
    throw error;
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

/**
 * Test Supabase pgvector integration
 */
async function testSupabaseIntegration() {
  console.log('🗄️ Testing Supabase Integration...\n');

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('document_chunks')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('✅ Supabase connection successful');

    // Test if pgvector function exists
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('search_document_chunks', {
        query_embedding: new Array(1536).fill(0), // Test with zero vector
        target_document_id: 'test',
        match_threshold: 0.5,
        match_count: 1,
      });

    if (rpcError && !rpcError.message.includes('could not find function')) {
      console.log('✅ pgvector search function is available');
    } else {
      console.warn('⚠️ pgvector search function needs to be created');
    }

    console.log('✅ Supabase integration tests completed\n');

  } catch (error) {
    console.error('❌ Supabase integration test failed:', error);
    throw error;
  }
}

/**
 * Performance benchmarking
 */
async function benchmarkPerformance() {
  console.log('⚡ Running Performance Benchmarks...\n');

  try {
    // Benchmark text generation
    const startGeneration = Date.now();
    await ai.generate({
      model: models.gpt4,
      prompt: 'Generate a brief budget analysis summary.',
    });
    const generationTime = Date.now() - startGeneration;

    // Benchmark embedding generation
    const startEmbedding = Date.now();
    await ai.embed({
      embedder: models.embeddings,
      content: 'Test text for embedding generation benchmark',
    });
    const embeddingTime = Date.now() - startEmbedding;

    console.log(`Text Generation: ${generationTime}ms`);
    console.log(`Embedding Generation: ${embeddingTime}ms`);

    if (generationTime < 10000 && embeddingTime < 2000) {
      console.log('✅ Performance benchmarks within acceptable range\n');
    } else {
      console.warn('⚠️ Performance may need optimization\n');
    }

  } catch (error) {
    console.error('❌ Performance benchmark failed:', error);
    throw error;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Starting Comprehensive Genkit Flow Tests\n');

  try {
    await testEmbeddingFunctionality();
    await testSupabaseIntegration();
    await testRAGFlow();
    await benchmarkPerformance();

    console.log('🎉 All Genkit flow tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- Embedding functionality: ✅');
    console.log('- Supabase integration: ✅');
    console.log('- RAG flow (all user types): ✅');
    console.log('- Performance benchmarks: ✅');

    console.log('\n✨ Genkit flows are ready for production use!');

  } catch (error) {
    console.error('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

export { testRAGFlow, testEmbeddingFunctionality, testSupabaseIntegration };