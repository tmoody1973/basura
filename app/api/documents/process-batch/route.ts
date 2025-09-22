import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required for batch processing' },
        { status: 403 }
      );
    }

    const { documentIds, processAll = false } = await req.json();

    let documentsToProcess: any[] = [];

    if (processAll) {
      // Get all unprocessed documents
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, status')
        .in('status', ['uploaded', 'failed'])
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch documents for processing' },
          { status: 500 }
        );
      }

      documentsToProcess = data || [];
    } else if (documentIds && Array.isArray(documentIds)) {
      // Get specific documents
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, status')
        .in('id', documentIds)
        .in('status', ['uploaded', 'failed']);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch specified documents' },
          { status: 500 }
        );
      }

      documentsToProcess = data || [];
    } else {
      return NextResponse.json(
        { error: 'Either documentIds array or processAll=true must be provided' },
        { status: 400 }
      );
    }

    if (documentsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documents found for processing',
        processed: 0,
        skipped: 0,
        failed: 0
      });
    }

    // Process documents sequentially to avoid overwhelming LlamaParse API
    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{
        id: string;
        title: string;
        status: string;
        error?: string;
      }>
    };

    for (const doc of documentsToProcess) {
      try {
        console.log(`Processing document: ${doc.title} (${doc.id})`);

        // Call the individual processing endpoint
        const processResponse = await fetch(
          `${req.nextUrl.origin}/api/documents/${doc.id}/process`,
          {
            method: 'POST',
            headers: {
              'Authorization': req.headers.get('Authorization') || '',
              'Cookie': req.headers.get('Cookie') || '',
            }
          }
        );

        if (processResponse.ok) {
          results.processed++;
          results.details.push({
            id: doc.id,
            title: doc.title,
            status: 'processed'
          });
          console.log(`✅ Successfully processed: ${doc.title}`);
        } else {
          const errorData = await processResponse.json();
          results.failed++;
          results.details.push({
            id: doc.id,
            title: doc.title,
            status: 'failed',
            error: errorData.error || 'Processing failed'
          });
          console.log(`❌ Failed to process: ${doc.title} - ${errorData.error}`);
        }

        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        results.failed++;
        results.details.push({
          id: doc.id,
          title: doc.title,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.log(`❌ Error processing: ${doc.title} - ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch processing completed. Processed: ${results.processed}, Failed: ${results.failed}`,
      ...results
    });

  } catch (error) {
    console.error('Error in batch processing:', error);
    return NextResponse.json(
      { error: 'Internal server error during batch processing' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get processing status summary
    const { data: statusCounts, error } = await supabase
      .from('documents')
      .select('status')
      .then(result => {
        if (result.error) throw result.error;

        const counts = {
          uploaded: 0,
          processing: 0,
          processed: 0,
          failed: 0,
          total: 0
        };

        result.data?.forEach(doc => {
          counts[doc.status as keyof typeof counts]++;
          counts.total++;
        });

        return { data: counts, error: null };
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch processing status' },
        { status: 500 }
      );
    }

    // Get recent processing activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('documents')
      .select('id, title, status, updated_at, error')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
    }

    return NextResponse.json({
      success: true,
      status_summary: statusCounts,
      recent_activity: recentActivity || [],
      ready_for_processing: statusCounts?.uploaded || 0
    });

  } catch (error) {
    console.error('Error fetching batch processing status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}