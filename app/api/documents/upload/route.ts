import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storageService } from '@/lib/supabase/storage';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin role
    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required for document uploads' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'budget';
    const jurisdiction = formData.get('jurisdiction') as string || '';
    const fiscalYear = formData.get('fiscalYear') as string || '';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = storageService.validateFile(file, 'documents');
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Upload file to storage
    const uploadResult = await storageService.uploadDocument(file, userId, {
      documentType
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error },
        { status: 500 }
      );
    }

    // Get the user's profile ID from the profiles table
    const { data: userProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (profileLookupError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Store document metadata in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userProfile.id,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        original_filename: file.name,
        file_path: uploadResult.path!,
        file_size: file.size,
        jurisdiction_name: jurisdiction || null,
        fiscal_year: fiscalYear || null,
        document_type: documentType,
        processing_status: 'uploading',
        metadata: {
          original_filename: file.name,
          upload_timestamp: new Date().toISOString(),
          uploaded_by: userId,
          description: description || null,
          mime_type: file.type
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Clean up uploaded file if database insert fails
      await storageService.deleteDocument(uploadResult.path!);

      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }

    // Return success response with document info
    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.name,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: document.processing_status,
        documentType: document.document_type,
        jurisdiction: document.jurisdiction_name,
        fiscalYear: document.fiscal_year,
        description: document.metadata?.description,
        uploadedAt: document.created_at,
        url: uploadResult.url
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error during upload' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Get user's documents (admin sees all, users see only their own)
    const supabase = getSupabaseAdmin();

    // Check user role and get profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    let query = supabase
      .from('documents')
      .select(`
        id,
        name,
        file_size,
        processing_status,
        document_type,
        jurisdiction_name,
        fiscal_year,
        created_at,
        updated_at,
        metadata
      `)
      .order('created_at', { ascending: false });

    // If not admin, only show user's own documents
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: documents || []
    });

  } catch (error) {
    console.error('Error in GET /api/documents/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}