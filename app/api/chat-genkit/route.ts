import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    // Parse request
    const { message, documentId, threadId, userType, jurisdiction } = await req.json();

    if (!message || !documentId) {
      return NextResponse.json(
        { error: 'Message and documentId are required' },
        { status: 400 }
      );
    }

    // Validate document exists
    const supabase = getSupabaseAdmin();
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, name, processing_status, jurisdiction_name, jurisdiction_type')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found or not accessible' },
        { status: 404 }
      );
    }

    if (document.processing_status !== 'processed') {
      return NextResponse.json(
        {
          error: 'Document is not ready for analysis',
          status: document.processing_status
        },
        { status: 400 }
      );
    }

    // Enhanced Genkit response with real document info
    return NextResponse.json({
      success: true,
      answer: `Genkit analysis: I received your message "${message}" for document ${documentId} as a ${userType}. I would analyze this budget document from ${jurisdiction || 'the jurisdiction'} and provide detailed insights.`,
      citations: [
        {
          pageNumber: 1,
          section: "Executive Summary",
          preview: "This document contains budget information for analysis..."
        }
      ],
      confidence: 85,
      documentContext: {
        id: documentId,
        name: document.name || "Budget Document",
        jurisdiction: document.jurisdiction_name || jurisdiction || "Unknown"
      },
      threadId: threadId || `genkit-thread-${Date.now()}`,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat Genkit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Streaming version
  try {
    const { message, documentId, userType, jurisdiction } = await req.json();

    if (!message || !documentId) {
      return NextResponse.json(
        { error: 'Message and documentId are required' },
        { status: 400 }
      );
    }

    // Create a streaming response
    const stream = new ReadableStream({
      start(controller) {
        // Simulate streaming response
        const chunks = [
          'Based on the budget document analysis, ',
          'I can see that your question about ',
          `"${message}" relates to important budget categories. `,
          'Let me provide a detailed breakdown of the relevant sections...',
        ];

        chunks.forEach((chunk, index) => {
          setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(chunk));
            if (index === chunks.length - 1) {
              controller.close();
            }
          }, index * 500);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Streaming chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}