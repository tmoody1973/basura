import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const supabase = getSupabaseAdmin();

    // Get document details with processing info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get document chunks if processed
    let chunks = [];
    if (document.processing_status === 'processed') {
      const { data: chunksData } = await supabase
        .from('document_chunks')
        .select('id, content, metadata')
        .eq('document_id', documentId)
        .limit(5); // Show first 5 chunks as sample

      chunks = chunksData || [];
    }

    // Format response with detailed status
    const response = {
      document_id: document.id,
      name: document.name,
      status: document.processing_status,
      upload_date: document.created_at,
      file_path: document.file_path,

      // Processing details
      processing_info: {
        status: document.processing_status,
        error: document.error,
        last_updated: document.updated_at,

        // LlamaParse results (from metadata)
        llamaparse_results: document.metadata?.processing_result || null,

        // Extracted data
        extracted_entities: document.metadata?.extracted_entities || [],
        budget_summary: document.metadata?.budget_summary || null,
        detected_tables: document.metadata?.detected_tables || [],
      },

      // Processed text info
      text_info: document.processed_text ? {
        text_length: document.processed_text.length,
        preview: document.processed_text.substring(0, 500) + '...',
        full_text_available: true
      } : null,

      // Chunks info
      chunks_info: {
        total_chunks: document.metadata?.processing_result?.chunks_count || 0,
        sample_chunks: chunks.map(chunk => ({
          id: chunk.id,
          preview: chunk.content.substring(0, 200) + '...',
          metadata: chunk.metadata
        }))
      },

      // Debug info
      debug: {
        has_processed_text: !!document.processed_text,
        metadata_keys: Object.keys(document.metadata || {}),
        processing_completed: document.processing_status === 'processed',
        llamaparse_job_id: document.metadata?.llamaparse_job_id || null
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching document status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}