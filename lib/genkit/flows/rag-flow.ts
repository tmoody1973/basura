import { z } from 'zod';
import { ai, models } from '../index';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Input/Output schemas
const RAGInput = z.object({
  query: z.string(),
  documentId: z.string(),
  userType: z.enum(['student', 'journalist', 'citizen']),
  jurisdiction: z.string().optional(),
  maxChunks: z.number().default(5),
});

const RAGOutput = z.object({
  answer: z.string(),
  citations: z.array(z.object({
    content: z.string(),
    chunkIndex: z.number(),
    similarity: z.number(),
  })),
  confidence: z.number(),
  visualizationSuggestion: z.object({
    shouldGenerate: z.boolean(),
    chartType: z.string().optional(),
    dataPoints: z.array(z.string()).optional(),
  }).optional(),
});

// Helper function for vector similarity search
async function vectorSearch(
  queryEmbedding: number[],
  documentId: string,
  maxResults: number = 5
) {
  const { data, error } = await supabase.rpc('search_document_chunks', {
    query_embedding: queryEmbedding,
    target_document_id: documentId,
    match_threshold: 0.7,
    match_count: maxResults,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data || [];
}

// Helper function to generate system prompts based on user type
function generateSystemPrompt(userType: string, jurisdiction?: string): string {
  const basePrompt = `You are an expert budget analyst specializing in government financial documents.`;

  const jurisdictionContext = jurisdiction
    ? ` You are currently analyzing ${jurisdiction} budget documents.`
    : '';

  const userSpecificPrompts = {
    student: `${basePrompt}${jurisdictionContext}
      Your role is to educate and explain budget concepts in simple, clear terms.
      Use analogies and examples that students can relate to.
      Always define financial terms and explain the "why" behind budget decisions.
      Encourage critical thinking with follow-up questions.`,

    journalist: `${basePrompt}${jurisdictionContext}
      Your role is to provide accurate, fact-based analysis for investigative reporting.
      Focus on data accuracy, provide exact citations with page numbers when available.
      Identify potential story angles, unusual spending patterns, or areas requiring further investigation.
      Always maintain objectivity and flag when information needs verification.`,

    citizen: `${basePrompt}${jurisdictionContext}
      Your role is to help citizens understand how the budget affects their daily lives and community.
      Explain the practical impact of budget decisions on local services and taxes.
      Provide clear next steps for civic engagement when relevant.
      Focus on transparency and accessibility in your explanations.`,
  };

  return userSpecificPrompts[userType as keyof typeof userSpecificPrompts] || basePrompt;
}

// Helper function to determine if visualization is needed
function analyzeVisualizationNeed(query: string, chunks: any[]): {
  shouldGenerate: boolean;
  chartType?: string;
  dataPoints?: string[];
} {
  const visualKeywords = ['compare', 'trend', 'over time', 'breakdown', 'distribution', 'percentage'];
  const needsVisualization = visualKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );

  if (!needsVisualization) {
    return { shouldGenerate: false };
  }

  // Analyze chunks for numerical data
  const hasNumericalData = chunks.some(chunk =>
    /\$[\d,]+|\d+%|\d+\.\d+/.test(chunk.content)
  );

  if (!hasNumericalData) {
    return { shouldGenerate: false };
  }

  // Determine chart type based on query
  let chartType = 'bar';
  if (query.toLowerCase().includes('over time') || query.toLowerCase().includes('trend')) {
    chartType = 'line';
  } else if (query.toLowerCase().includes('breakdown') || query.toLowerCase().includes('distribution')) {
    chartType = 'pie';
  } else if (query.toLowerCase().includes('compare')) {
    chartType = 'comparison';
  }

  return {
    shouldGenerate: true,
    chartType,
    dataPoints: [], // Will be populated by the AI
  };
}

// Main RAG flow
export const ragFlow = ai.defineFlow({
  name: 'ragAnalysis',
  inputSchema: RAGInput,
  outputSchema: RAGOutput,
}, async (input) => {
  try {
    console.log(`🔍 Processing RAG query: "${input.query}"`);

    // Step 1: Generate embedding for the query
    const { embedding: queryEmbedding } = await ai.embed({
      embedder: models.embeddings,
      content: input.query,
    });

    // Step 2: Perform vector similarity search
    console.log('🔎 Searching for relevant chunks...');
    const relevantChunks = await vectorSearch(
      queryEmbedding,
      input.documentId,
      input.maxChunks
    );

    if (relevantChunks.length === 0) {
      return {
        answer: "I couldn't find relevant information in the document to answer your question. Please try rephrasing your query or asking about a different topic.",
        citations: [],
        confidence: 0,
      };
    }

    // Step 3: Format context from relevant chunks
    const context = relevantChunks
      .map((chunk, index) => `[Chunk ${index + 1}]: ${chunk.content}`)
      .join('\n\n');

    // Step 4: Analyze visualization needs
    const visualizationSuggestion = analyzeVisualizationNeed(input.query, relevantChunks);

    // Step 5: Generate response using the appropriate system prompt
    console.log('🤖 Generating response...');
    const systemPrompt = generateSystemPrompt(input.userType, input.jurisdiction);

    const { text: answer } = await ai.generate({
      model: models.gpt4,
      prompt: `${systemPrompt}

Context from budget document:
${context}

User Question: ${input.query}

Instructions:
1. Answer the question comprehensively using the provided context
2. Always cite specific information with [Chunk X] references
3. If numerical data is mentioned, include exact figures
4. Adapt your explanation style for a ${input.userType}
5. If the context doesn't fully answer the question, be transparent about limitations
6. Suggest follow-up questions when appropriate

${visualizationSuggestion.shouldGenerate ?
  `7. Based on the data in the context, suggest specific data points that would be useful for a ${visualizationSuggestion.chartType} chart` :
  ''
}

Provide a clear, well-structured response that helps the user understand the budget information.`,
    });

    // Step 6: Calculate confidence score based on chunk similarity
    const avgSimilarity = relevantChunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / relevantChunks.length;
    const confidence = Math.round(avgSimilarity * 100);

    // Step 7: Format citations
    const citations = relevantChunks.map((chunk, index) => ({
      content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
      chunkIndex: index + 1,
      similarity: Math.round(chunk.similarity * 100) / 100,
    }));

    console.log(`✅ RAG analysis complete. Confidence: ${confidence}%`);

    return {
      answer,
      citations,
      confidence,
      visualizationSuggestion: visualizationSuggestion.shouldGenerate ? visualizationSuggestion : undefined,
    };

  } catch (error) {
    console.error('❌ RAG analysis failed:', error);
    return {
      answer: "I encountered an error while processing your question. Please try again or contact support if the issue persists.",
      citations: [],
      confidence: 0,
    };
  }
});