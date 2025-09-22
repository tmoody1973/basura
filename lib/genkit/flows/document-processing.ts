// No need to import defineFlow, use ai.defineFlow
import { z } from 'zod';
import { ai, models } from '../index';
import { createClient } from '@supabase/supabase-js';
import { llamaParseService } from '../../llamaparse/client';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Input/Output schemas
const DocumentProcessingInput = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
  documentId: z.string(),
  jurisdictionType: z.string(),
  jurisdictionName: z.string(),
  fiscalYear: z.string().optional(),
});

const DocumentProcessingOutput = z.object({
  success: z.boolean(),
  chunksCreated: z.number(),
  extractedText: z.string().optional(),
  error: z.string().optional(),
});

// Using LlamaParse's built-in chunking instead of custom implementation

// Helper function to store chunks in Supabase
async function storeChunksInSupabase(
  chunks: string[],
  embeddings: number[][],
  metadata: {
    documentId: string;
    jurisdictionType: string;
    jurisdictionName: string;
    fiscalYear?: string;
  }
) {
  const chunksData = chunks.map((chunk, index) => ({
    document_id: metadata.documentId,
    content: chunk,
    embedding: embeddings[index],
    chunk_index: index + 1, // Start from 1, not 0
    metadata: {
      jurisdiction_type: metadata.jurisdictionType,
      jurisdiction_name: metadata.jurisdictionName,
      fiscal_year: metadata.fiscalYear,
    },
    page_number: null, // Will be enhanced later
    section_title: null, // Will be enhanced later
  }));

  const { error } = await supabase
    .from('document_chunks')
    .insert(chunksData);

  if (error) {
    throw new Error(`Failed to store chunks: ${error.message}`);
  }

  return chunksData.length;
}

// Main document processing flow
export const documentProcessingFlow = ai.defineFlow({
  name: 'documentProcessing',
  inputSchema: DocumentProcessingInput,
  outputSchema: DocumentProcessingOutput,
}, async (input) => {
  try {
    console.log(`🔄 Processing document: ${input.fileName}`);

    // Step 1: Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(input.fileUrl);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert blob to buffer
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    // Step 2: Extract text using LlamaParse for better table extraction
    console.log('📄 Extracting text from PDF using LlamaParse...');

    // Process document with LlamaParse
    const processingResult = await llamaParseService.processDocument(
      fileBuffer,
      input.fileName,
      {
        chunkSize: 1800,  // Optimal for 200-400 page budget docs (keeps tables intact)
        chunkOverlap: 250  // 14% overlap ensures no data loss at boundaries
      }
    );

    const extractedText = processingResult.text;
    const chunks = processingResult.chunks.map(chunk => chunk.content);

    console.log(`📄 Document has ${processingResult.metadata.pageCount} pages`);
    console.log(`📦 Created ${chunks.length} chunks from ${extractedText.length} characters`);
    console.log(`📏 Average chunk size: ${Math.round(extractedText.length / chunks.length)} characters`);

    // Step 4: Generate embeddings for each chunk
    console.log('🧠 Generating embeddings...');
    const embeddings: number[][] = [];

    for (const chunk of chunks) {
      const embeddingResult = await ai.embed({
        embedder: models.embeddings,
        content: chunk,
      });
      // The result should be an array of embedding objects
      if (Array.isArray(embeddingResult) && embeddingResult.length > 0) {
        embeddings.push(embeddingResult[0].embedding);
      } else {
        // Fallback for direct embedding format
        embeddings.push((embeddingResult as any).embedding || embeddingResult);
      }
    }

    // Step 5: Store chunks and embeddings in Supabase
    console.log('💾 Storing chunks in database...');
    const chunksCreated = await storeChunksInSupabase(chunks, embeddings, {
      documentId: input.documentId,
      jurisdictionType: input.jurisdictionType,
      jurisdictionName: input.jurisdictionName,
      fiscalYear: input.fiscalYear,
    });

    console.log(`✅ Successfully processed document: ${chunksCreated} chunks created`);

    return {
      success: true,
      chunksCreated,
      extractedText: extractedText.substring(0, 1000) + '...', // Return longer preview for validation
    };

  } catch (error) {
    console.error('❌ Document processing failed:', error);
    return {
      success: false,
      chunksCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});