#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables FIRST
config({ path: '.env.local' });

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const llamaParseApiKey = process.env.LLAMAPARSE_API_KEY!;

async function recoverLlamaParseData(jobId: string, documentId: string) {
  console.log('🔄 Recovering LlamaParse data...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch the result from LlamaParse
    console.log(`📥 Fetching result for job ${jobId}...`);

    const resultResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/text`,
      {
        headers: {
          'Authorization': `Bearer ${llamaParseApiKey}`,
        },
      }
    );

    if (!resultResponse.ok) {
      throw new Error(`Failed to fetch result: ${resultResponse.status}`);
    }

    const resultText = await resultResponse.text();
    console.log(`✅ Retrieved ${resultText.length} characters of text`);

    // 2. Create proper chunks (fixed chunking logic)
    console.log('📦 Creating chunks...');
    const chunks = createProperChunks(resultText, 1000, 200);
    console.log(`✅ Created ${chunks.length} chunks`);

    // 3. Update document in database
    console.log('💾 Updating document in database...');

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'processed',
        processed_text: resultText,
        metadata: {
          processing_result: {
            chunks_count: chunks.length,
            text_length: resultText.length,
            processed_at: new Date().toISOString(),
            llamaparse_job_id: jobId,
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ Failed to update document:', updateError);
      return;
    }

    console.log('✅ Document updated successfully');

    // 4. Insert chunks
    console.log('💾 Inserting chunks...');

    const chunkInserts = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk,
      metadata: {
        chunkIndex: index,
        pageNumber: Math.floor(index / 3) + 1, // Approximate
      },
      created_at: new Date().toISOString()
    }));

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < chunkInserts.length; i += batchSize) {
      const batch = chunkInserts.slice(i, i + batchSize);
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(batch);

      if (chunkError) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, chunkError);
      } else {
        console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} chunks)`);
      }
    }

    console.log('\n🎉 Recovery complete!');
    console.log('📊 Summary:');
    console.log(`   - Text length: ${resultText.length} characters`);
    console.log(`   - Chunks created: ${chunks.length}`);
    console.log(`   - Document status: processed`);

  } catch (error) {
    console.error('❌ Recovery failed:', error);
  }
}

function createProperChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];

  // Simple sliding window chunking
  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    const chunk = text.slice(i, i + chunkSize);
    if (chunk.trim()) {
      chunks.push(chunk);
    }

    // Stop if we've reached the end
    if (i + chunkSize >= text.length) {
      break;
    }
  }

  return chunks;
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: npm run recover-data <job-id> <document-id>');
  console.log('\nExample job IDs from your logs:');
  console.log('  - 0041e1a6-9def-4185-b6d7-65dde648f7a5 (1.2M chars)');
  console.log('  - 74e9e365-a049-407b-988c-c701c79e2da7 (80K chars)');
  console.log('\nDocument IDs:');
  console.log('  - 4efb5e92-993b-4fa3-b80f-69df3e2d6e77');
  console.log('  - a896c5bc-c4f9-48b7-9356-5674b4f8de47');
  process.exit(1);
}

recoverLlamaParseData(args[0], args[1]).catch(console.error);