import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storageService } from '@/lib/supabase/storage';
import { getSupabaseAdmin } from '@/lib/supabase/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const supabase = getSupabaseAdmin();

    // Get user profile to check role and get profile ID
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

    // Fetch document with access control - explicitly select columns that exist
    let query = supabase
      .from('documents')
      .select(`
        id,
        user_id,
        name,
        original_filename,
        file_size,
        file_path,
        jurisdiction_type,
        jurisdiction_name,
        fiscal_year,
        document_type,
        page_count,
        processing_status,
        processing_error,
        metadata,
        created_at,
        updated_at
      `)
      .eq('id', documentId);

    // If not admin, only allow access to own documents
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data: document, error } = await query.single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Get signed URL for document access
    const signedUrl = await storageService.getDocumentUrl(document.file_path);

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        downloadUrl: signedUrl
      }
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const supabase = getSupabaseAdmin();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required for document deletion' },
        { status: 403 }
      );
    }

    // Get document details before deletion
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path, title')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from storage first
    const storageDeleted = await storageService.deleteDocument(document.file_path);

    if (!storageDeleted) {
      console.warn(`Failed to delete file from storage: ${document.file_path}`);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document chunks if they exist
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // Delete document record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document from database:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document "${document.title}" deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const documentId = params.id;
    const supabase = getSupabaseAdmin();

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required for document updates' },
        { status: 403 }
      );
    }

    const updates = await req.json();

    // Validate allowed update fields
    const allowedFields = [
      'name',
      'jurisdiction_name',
      'fiscal_year',
      'document_type',
      'processing_status'
    ];

    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    // Update document
    const { data: document, error } = await supabase
      .from('documents')
      .update(filteredUpdates)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}