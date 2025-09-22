import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { documentProcessingFlow } from '@/lib/genkit/flows/document-processing';
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

    try {
      console.log(`🔄 Starting Genkit processing for document: ${document.name}`);

      // Call Genkit document processing flow
      const processingResult = await documentProcessingFlow({
        fileUrl: document.file_path, // Supabase storage path
        fileName: document.original_filename,
        documentId: documentId,
        jurisdictionType: document.jurisdiction_type || 'unknown',
        jurisdictionName: document.jurisdiction_name || 'Unknown Jurisdiction',
        fiscalYear: document.fiscal_year,
      });

      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Document processing failed');
      }

      console.log(`✅ Genkit processing completed. Generated ${processingResult.chunksCreated} chunks`);

      // Extract additional metadata using our helper functions
      const extractedMetadata = extractBudgetMetadata(processingResult.extractedText || '');

      // Update document with processing results
      const updatedDocument = await supabase
        .from('documents')
        .update({
          processing_status: 'processed',
          processed_text: processingResult.extractedText,
          metadata: {
            ...document.metadata,
            processing_result: {
              engine: 'genkit',
              chunks_count: processingResult.chunksCreated,
              processed_at: new Date().toISOString(),
              processing_duration: 'N/A', // Genkit doesn't provide timing info
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

      return NextResponse.json({
        success: true,
        document: updatedDocument.data,
        processing: {
          engine: 'genkit',
          chunks_created: processingResult.chunksCreated,
          extracted_entities: extractedMetadata.entities.length,
          tables_detected: extractedMetadata.tables.length,
          processing_time: new Date().toISOString(),
          cost_savings: 'No LlamaParse fees!',
        }
      });

    } catch (processingError) {
      console.error('Genkit document processing failed:', processingError);

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
    console.error('Error in Genkit document processing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract budget-specific metadata (enhanced for Genkit)
function extractBudgetMetadata(text: string) {
  const entities: Array<{ type: string; value: string; confidence: number }> = [];
  const tables: Array<{ title: string; rows: number; columns: number }> = [];

  // Enhanced budget amount extraction
  const budgetAmountRegex = /\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|billion|thousand|M|B|K))?/gi;
  const budgetMatches = text.match(budgetAmountRegex) || [];

  budgetMatches.forEach(match => {
    entities.push({
      type: 'BUDGET_AMOUNT',
      value: match.trim(),
      confidence: 0.85
    });
  });

  // Enhanced department extraction
  const departmentKeywords = [
    'department', 'agency', 'bureau', 'office', 'division', 'administration',
    'services', 'commission', 'authority', 'board'
  ];

  const departmentRegex = new RegExp(
    `\\b([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:${departmentKeywords.join('|')})`,
    'gi'
  );

  const departmentMatches = text.match(departmentRegex) || [];
  departmentMatches.slice(0, 15).forEach(match => {
    entities.push({
      type: 'DEPARTMENT',
      value: match.trim(),
      confidence: 0.8
    });
  });

  // Enhanced fiscal year extraction
  const fiscalYearRegex = /(?:fiscal year|FY|budget year|year)\s*(\d{4}(?:-\d{2,4})?)/gi;
  const yearMatches = text.match(fiscalYearRegex) || [];

  yearMatches.forEach(match => {
    entities.push({
      type: 'FISCAL_YEAR',
      value: match.trim(),
      confidence: 0.95
    });
  });

  // Table detection
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

  // Generate enhanced summary
  const summary = {
    processing_engine: 'genkit',
    total_budget_amounts: budgetMatches.length,
    departments_found: departmentMatches.length,
    fiscal_years: yearMatches.length,
    tables_detected: tables.length,
    document_type: detectDocumentType(text),
    estimated_pages: Math.ceil(text.length / 3000),
    completeness_score: calculateCompletenessScore(budgetMatches.length, departmentMatches.length, yearMatches.length)
  };

  return { entities, tables, summary };
}

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

function calculateCompletenessScore(budgetAmounts: number, departments: number, fiscalYears: number): number {
  let score = 0;
  score += Math.min(budgetAmounts * 4, 40);
  score += Math.min(departments * 3, 40);
  score += Math.min(fiscalYears * 10, 20);
  return Math.min(score, 100);
}