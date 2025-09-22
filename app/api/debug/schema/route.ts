import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // First, let's see what tables we have
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('Tables error:', tablesError);
    }

    // Then let's see the documents table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('Columns error:', columnsError);
    }

    // Let's also try a simple select to see what actually works
    const { data: testSelect, error: selectError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      tables: tables || [],
      documentColumns: columns || [],
      testSelect: testSelect || [],
      errors: {
        tablesError,
        columnsError,
        selectError
      }
    });

  } catch (error) {
    console.error('Schema debug error:', error);
    return NextResponse.json(
      { error: 'Failed to debug schema', details: String(error) },
      { status: 500 }
    );
  }
}