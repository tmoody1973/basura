import { NextResponse } from 'next/server'
import { getAllProcessedDocuments } from '@/lib/supabase/database'

export async function GET() {
  try {
    const documents = await getAllProcessedDocuments()
    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}