import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { llamaParseService } from '@/lib/llamaparse';
import { storageService } from '@/lib/supabase/storage';
import { getSupabaseAdmin } from '@/lib/supabase/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
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

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required for document processing' },
        { status: 403 }
      );
    }

    // Get document details
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

    // Check if document is already processed
    if (document.processing_status === 'processed') {
      return NextResponse.json(
        { error: 'Document is already processed' },
        { status: 400 }
      );
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // Get signed URL to download the file
    const downloadUrl = await storageService.getDocumentUrl(document.file_path, 3600);

    if (!downloadUrl) {
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          error: 'Failed to get document download URL',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      return NextResponse.json(
        { error: 'Failed to access document file' },
        { status: 500 }
      );
    }

    try {
      // Download file for processing
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Process document with LlamaParse
      // Extract filename from file_path (format: user_id/filename)
      const filename = document.file_path.split('/').pop() || 'document.pdf';
      console.log(`Starting LlamaParse processing for document: ${filename}`);

      const processingOptions = {
        chunkSize: 1000,
        chunkOverlap: 200,
        extractEntities: true,
        generateSummary: true,
        detectTables: true
      };

      const processingResult = await llamaParseService.processDocument(
        buffer,
        filename,
        processingOptions
      );

      console.log(`LlamaParse processing completed. Generated ${processingResult.chunks.length} chunks`);

      // Extract budget-specific metadata
      const extractedMetadata = extractBudgetMetadata(processingResult.text);

      // Update document with processing results
      const updatedDocument = await supabase
        .from('documents')
        .update({
          processing_status: 'processed',
          processed_text: processingResult.text,
          metadata: {
            ...document.metadata,
            processing_result: {
              chunks_count: processingResult.chunks.length,
              page_count: processingResult.metadata.pageCount,
              file_size: processingResult.metadata.fileSize,
              processed_at: processingResult.metadata.processedAt
            },
            extracted_entities: extractedMetadata.entities,
            budget_summary: extractedMetadata.summary,
            detected_tables: extractedMetadata.tables
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (updatedDocument.error) {
        throw new Error('Failed to update document with processing results');
      }

      // Store document chunks for vector search
      const chunkInserts = processingResult.chunks.map(chunk => ({
        document_id: documentId,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: null, // Will be populated by vector embedding service
        created_at: new Date().toISOString()
      }));

      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(chunkInserts);

      if (chunksError) {
        console.error('Error storing document chunks:', chunksError);
        // Don't fail the entire process for chunk storage errors
      }

      return NextResponse.json({
        success: true,
        document: updatedDocument.data,
        processing: {
          chunks_created: processingResult.chunks.length,
          extracted_entities: extractedMetadata.entities.length,
          tables_detected: extractedMetadata.tables.length,
          processing_time: new Date().toISOString()
        }
      });

    } catch (processingError) {
      console.error('Document processing failed:', processingError);

      // Update document status to failed
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          error: processingError instanceof Error ? processingError.message : 'Processing failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      return NextResponse.json(
        {
          error: 'Document processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in document processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract budget-specific metadata
function extractBudgetMetadata(text: string) {
  const entities: Array<{ type: string; value: string; confidence: number }> = [];
  const tables: Array<{ title: string; rows: number; columns: number }> = [];

  // Extract budget amounts (simple regex patterns)
  const budgetAmountRegex = /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|thousand|M|B|K))?/gi;
  const budgetMatches = text.match(budgetAmountRegex) || [];

  budgetMatches.forEach(match => {
    entities.push({
      type: 'BUDGET_AMOUNT',
      value: match.trim(),
      confidence: 0.8
    });
  });

  // Extract departments/agencies
  const departmentKeywords = [
    'department', 'agency', 'bureau', 'office', 'division', 'administration',
    'services', 'commission', 'authority', 'board'
  ];

  const departmentRegex = new RegExp(
    `\\b([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:${departmentKeywords.join('|')})`,
    'gi'
  );

  const departmentMatches = text.match(departmentRegex) || [];
  departmentMatches.slice(0, 10).forEach(match => { // Limit to prevent noise
    entities.push({
      type: 'DEPARTMENT',
      value: match.trim(),
      confidence: 0.7
    });
  });

  // Extract fiscal years
  const fiscalYearRegex = /(?:fiscal year|FY|budget year)\s*(\d{4})/gi;
  const yearMatches = text.match(fiscalYearRegex) || [];

  yearMatches.forEach(match => {
    entities.push({
      type: 'FISCAL_YEAR',
      value: match.trim(),
      confidence: 0.9
    });
  });

  // Detect table-like structures
  const tableRegex = /(?:^|\n)(?:\s*\|.*\|.*\n){3,}/gm;
  const tableMatches = text.match(tableRegex) || [];

  tableMatches.forEach((match, index) => {
    const lines = match.trim().split('\n');
    const columns = (lines[0].match(/\|/g) || []).length - 1;

    tables.push({
      title: `Table ${index + 1}`,
      rows: lines.length,
      columns: Math.max(1, columns)
    });
  });

  // Generate summary
  const summary = {
    total_budget_amounts: budgetMatches.length,
    departments_found: departmentMatches.length,
    fiscal_years: yearMatches.length,
    tables_detected: tables.length,
    document_type: detectDocumentType(text),
    estimated_pages: Math.ceil(text.length / 3000) // Rough estimate
  };

  return { entities, tables, summary };
}

// Helper function to detect document type
function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('comprehensive annual financial report') || lowerText.includes('cafr')) {
    return 'CAFR';
  }

  if (lowerText.includes('capital budget') || lowerText.includes('capital improvement')) {
    return 'Capital Budget';
  }

  if (lowerText.includes('operating budget') || lowerText.includes('general fund')) {
    return 'Operating Budget';
  }

  if (lowerText.includes('proposed budget') || lowerText.includes('budget proposal')) {
    return 'Budget Proposal';
  }

  return 'Budget Document';
}