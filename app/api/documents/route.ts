import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Placeholder for PDF processing
async function processPDF(file: File) {
  // This will be implemented with LlamaParse later
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    jurisdiction: 'city', // Will be detected automatically
    pageCount: 10, // Will be extracted from PDF
    processedAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Process the PDF
    const documentData = await processPDF(file);

    // For now, store metadata (Supabase storage will be configured later)
    // const { data: uploadData, error: uploadError } = await supabase.storage
    //   .from('budget-documents')
    //   .upload(`documents/${documentData.id}.pdf`, file);

    return NextResponse.json({
      success: true,
      document: documentData,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Placeholder for fetching user's documents
    const documents = [
      {
        id: '1',
        name: 'Sample City Budget 2024.pdf',
        jurisdiction: 'city',
        uploadedAt: new Date().toISOString(),
        pageCount: 150,
        status: 'processed',
      },
    ];

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}