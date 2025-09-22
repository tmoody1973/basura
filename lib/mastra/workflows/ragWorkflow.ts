import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Placeholder vector search step (will be connected to Pinecone later)
const vectorSearchStep = createStep({
  id: 'vector-search',
  description: 'Search for relevant document chunks',
  inputSchema: z.object({
    query: z.string(),
    documentId: z.string().optional(),
    jurisdiction: z.string().optional(),
    topK: z.number().default(5),
  }),
  outputSchema: z.object({
    chunks: z.array(z.object({
      content: z.string(),
      metadata: z.object({
        pageNumber: z.number(),
        sectionTitle: z.string(),
        jurisdiction: z.string().optional(),
      }),
      score: z.number(),
    })),
  }),
  execute: async ({ inputData }) => {
    // Placeholder implementation - will be replaced with Pinecone search
    console.log('Searching for:', inputData.query);

    // Return mock data for now
    return {
      chunks: [
        {
          content: `Budget allocation for ${inputData.query}`,
          metadata: {
            pageNumber: 1,
            sectionTitle: 'Executive Summary',
            jurisdiction: inputData.jurisdiction || 'unknown',
          },
          score: 0.95,
        },
      ],
    };
  },
});

// Format context for LLM
const contextFormattingStep = createStep({
  id: 'format-context',
  description: 'Format retrieved chunks for LLM context',
  inputSchema: z.object({
    chunks: z.array(z.any()),
    query: z.string(),
  }),
  outputSchema: z.object({
    context: z.string(),
    citations: z.array(z.object({
      pageNumber: z.number(),
      section: z.string(),
      preview: z.string(),
    })),
  }),
  execute: async ({ inputData }) => {
    const context = inputData.chunks
      .map(chunk => `[Page ${chunk.metadata.pageNumber}] ${chunk.content}`)
      .join('\n\n');

    const citations = inputData.chunks.map(chunk => ({
      pageNumber: chunk.metadata.pageNumber,
      section: chunk.metadata.sectionTitle,
      preview: chunk.content.substring(0, 200),
    }));

    return { context, citations };
  },
});

// Generate response with agent
const responseGenerationStep = createStep({
  id: 'generate-response',
  description: 'Generate response with citations',
  inputSchema: z.object({
    context: z.string(),
    citations: z.array(z.any()),
    query: z.string(),
    userType: z.string().optional(),
  }),
  outputSchema: z.object({
    response: z.string(),
    citations: z.array(z.any()),
    shouldGenerateChart: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    // Determine if a chart would be helpful
    const shouldGenerateChart =
      inputData.query.toLowerCase().includes('compare') ||
      inputData.query.toLowerCase().includes('trend') ||
      inputData.query.toLowerCase().includes('breakdown') ||
      inputData.query.toLowerCase().includes('distribution');

    // For now, return a placeholder response
    const response = `Based on the budget documents:\n\n${inputData.context}\n\nThis information answers your question about: ${inputData.query}`;

    return {
      response,
      citations: inputData.citations,
      shouldGenerateChart,
    };
  },
});

// Create the RAG workflow
export const ragWorkflow = createWorkflow({
  id: 'rag-workflow',
  description: 'RAG pipeline for budget document analysis',
  inputSchema: z.object({
    query: z.string(),
    documentId: z.string().optional(),
    userType: z.string().optional(),
    jurisdiction: z.string().optional(),
  }),
  outputSchema: z.object({
    response: z.string(),
    citations: z.array(z.any()),
    shouldGenerateChart: z.boolean(),
  }),
})
  .then(vectorSearchStep)
  .then(contextFormattingStep)
  .then(responseGenerationStep)
  .commit();