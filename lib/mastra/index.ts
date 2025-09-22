import { Mastra } from '@mastra/core';
import { budgetAnalysisAgent } from './agents/budgetAnalysisAgent';
import { ragWorkflow } from './workflows/ragWorkflow';

export const mastra = new Mastra({
  agents: {
    budgetAnalysisAgent,
  },
  workflows: {
    ragWorkflow,
  },
});