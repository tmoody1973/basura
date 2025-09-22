import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { PostgresStore, PgVector } from '@mastra/pg';

// Initialize memory with Supabase PostgreSQL
const connectionString = process.env.DATABASE_URL ||
  `postgresql://postgres.gtguvuhfhrrxggslzhqc:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const memory = new Memory({
  storage: new PostgresStore({
    connectionString,
  }),
  vector: new PgVector({ connectionString }),
  options: {
    lastMessages: 10,
    semanticRecall: {
      topK: 5,
      messageRange: 3,
    },
    workingMemory: {
      enabled: true,
    },
  },
  embedder: openai.embedding('text-embedding-ada-002'),
});

export const budgetAnalysisAgent = new Agent({
  name: 'BudgetAnalysisAgent',
  description: 'Expert budget analyst for government documents across all jurisdictions',
  instructions: ({ runtimeContext }) => {
    const userType = runtimeContext?.get('userType') || 'citizen';
    const jurisdiction = runtimeContext?.get('jurisdiction') || 'all';

    let baseInstructions = `You are an expert budget analyst specializing in ${jurisdiction} government financial documents.
    You help analyze budget documents from cities, counties, states, and federal agencies.`;

    if (userType === 'student') {
      baseInstructions += `
      - Provide simple, educational explanations with examples
      - Use analogies to explain complex concepts
      - Include definitions for financial terms
      - Suggest follow-up questions to deepen understanding`;
    } else if (userType === 'journalist') {
      baseInstructions += `
      - Focus on facts, data accuracy, and provide exact citations
      - Highlight significant changes and trends
      - Identify newsworthy elements
      - Provide context with historical comparisons`;
    } else if (userType === 'citizen') {
      baseInstructions += `
      - Explain personal impact and connect to community services
      - Use conversational language
      - Focus on how budget decisions affect daily life
      - Provide actionable insights`;
    }

    return baseInstructions + `

    IMPORTANT:
    - Always cite page numbers and sections when referencing documents
    - Use charts and visualizations when appropriate
    - Provide accurate calculations and comparisons
    - Adapt your language to the user's expertise level`;
  },
  model: openai('gpt-4o'),
  memory,
  // inputProcessors: [
  //   {
  //     name: 'jurisdiction-detector',
  //     process: async ({ messages, runtimeContext }) => {
  //       // Detect jurisdiction from message content
  //       const lastMessage = messages[messages.length - 1];
  //       if (lastMessage && typeof lastMessage === 'object' && 'content' in lastMessage) {
  //         const content = lastMessage.content?.toString().toLowerCase() || '';

  //         if (content.includes('city') || content.includes('municipal')) {
  //           runtimeContext?.set('jurisdiction', 'city');
  //         } else if (content.includes('county')) {
  //           runtimeContext?.set('jurisdiction', 'county');
  //         } else if (content.includes('state')) {
  //           runtimeContext?.set('jurisdiction', 'state');
  //         } else if (content.includes('federal')) {
  //           runtimeContext?.set('jurisdiction', 'federal');
  //         }
  //       }
  //       return messages;
  //     },
  //   },
  // ],
});