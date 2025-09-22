import { NextRequest } from 'next/server';
import { mastra } from '@/lib/mastra';

export async function POST(req: NextRequest) {
  try {
    const { message, documentId, threadId, userType, jurisdiction } = await req.json();

    // For now, we'll skip authentication until Clerk is set up
    // const { userId } = auth();
    // if (!userId) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    const agent = mastra.getAgent('budgetAnalysisAgent');
    const workflow = mastra.getWorkflow('ragWorkflow');

    // First run RAG workflow to get context - simplified version
    // For now, we'll just call the workflow steps directly until we have proper workflow setup
    const ragResult = {
      response: `Mock response for query: ${message}`,
      citations: [],
      shouldGenerateChart: false
    };

    // Stream response with context
    const stream = await agent.stream(
      [
        {
          role: 'system',
          content: `You are analyzing budget documents. Context from document: ${ragResult.response}. User type: ${userType || 'citizen'}, Jurisdiction: ${jurisdiction || 'all'}, Document ID: ${documentId || 'none'}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      {
        memory: {
          thread: threadId || 'default',
          resource: 'user', // Will be replaced with actual userId
        },
      },
    );

    // Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream.textStream) {
              controller.enqueue(new TextEncoder().encode(chunk));
            }

            // Send citations at the end
            const citationsData = JSON.stringify({
              type: 'citations',
              data: ragResult.citations,
            });
            controller.enqueue(new TextEncoder().encode(`\n\n${citationsData}`));
          } catch (error) {
            console.error('Stream error:', error);
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      },
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}