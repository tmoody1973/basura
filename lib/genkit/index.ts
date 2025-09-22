import { genkit } from 'genkit';
import { openAI } from '@genkit-ai/compat-oai/openai';

// Initialize Genkit with OpenAI plugin
export const ai = genkit({
  plugins: [openAI()]
});

// Export commonly used models
export const models = {
  gpt4: openAI.model('gpt-4o'),
  gpt4Turbo: openAI.model('gpt-4-turbo'),
  gpt35: openAI.model('gpt-3.5-turbo'),
  embeddings: openAI.embedder('text-embedding-ada-002'),
};

// Export for convenience
export { openAI };