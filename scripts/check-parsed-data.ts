#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables FIRST
config({ path: '.env.local' });

// Create Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

async function checkParsedDocuments() {
  console.log('🔍 Checking parsed document data in Supabase...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check documents table
    console.log('📄 Documents in database:');
    console.log('=' .repeat(80));

    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, name, processing_status, created_at, file_path')
      .order('created_at', { ascending: false })
      .limit(5);

    if (docError) {
      console.error('Error fetching documents:', docError);
      return;
    }

    if (!documents || documents.length === 0) {
      console.log('❌ No documents found in database');
      return;
    }

    for (const doc of documents) {
      console.log(`\n📋 Document: ${doc.name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Status: ${doc.processing_status}`);
      console.log(`   File: ${doc.file_path}`);
      console.log(`   Created: ${doc.created_at}`);

      // 2. Check if document has processed text
      if (doc.processing_status === 'processed') {
        const { data: fullDoc } = await supabase
          .from('documents')
          .select('processed_text, metadata')
          .eq('id', doc.id)
          .single();

        if (fullDoc?.processed_text) {
          console.log(`   ✅ Has processed text: ${fullDoc.processed_text.length} characters`);
          console.log(`   📝 Text preview: "${fullDoc.processed_text.substring(0, 200)}..."`);

          // Show metadata
          if (fullDoc.metadata?.processing_result) {
            console.log(`   📊 Processing metadata:`);
            console.log(`      - Chunks: ${fullDoc.metadata.processing_result.chunks_count}`);
            console.log(`      - Pages: ${fullDoc.metadata.processing_result.page_count}`);
            console.log(`      - Processed at: ${fullDoc.metadata.processing_result.processed_at}`);
          }
        } else {
          console.log(`   ⚠️ Status is 'processed' but no text found!`);
        }

        // 3. Check document chunks
        const { data: chunks, error: chunkError } = await supabase
          .from('document_chunks')
          .select('id, content, metadata')
          .eq('document_id', doc.id)
          .limit(3);

        if (chunks && chunks.length > 0) {
          console.log(`   📦 Document chunks: ${chunks.length} found`);
          chunks.forEach((chunk, index) => {
            console.log(`      Chunk ${index + 1}: ${chunk.content.substring(0, 100)}...`);
          });
        } else {
          console.log(`   ❌ No chunks found for this document`);
        }
      } else {
        console.log(`   ⏳ Document status: ${doc.processing_status}`);
      }
    }

    // 4. Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary Statistics:');

    const { data: stats } = await supabase
      .from('documents')
      .select('processing_status')
      .order('created_at', { ascending: false });

    const statusCounts = stats?.reduce((acc, doc) => {
      acc[doc.processing_status] = (acc[doc.processing_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    console.log(`   Total documents: ${stats?.length || 0}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    // 5. Check storage files
    console.log('\n📁 Storage Files:');
    const { data: files, error: storageError } = await supabase
      .storage
      .from('documents')
      .list('', {
        limit: 10,
        offset: 0,
      });

    if (files && files.length > 0) {
      console.log(`   Found ${files.length} files in storage`);
      files.forEach(file => {
        console.log(`   - ${file.name} (${Math.round(file.metadata?.size / 1024)}KB)`);
      });
    } else {
      console.log('   No files in storage bucket');
    }

  } catch (error) {
    console.error('Error checking documents:', error);
  }
}

checkParsedDocuments().catch(console.error);