import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/conversations - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to find their ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get conversations with document info
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        thread_id,
        is_bookmarked,
        message_count,
        last_message_at,
        created_at,
        documents:document_id (
          id,
          name,
          jurisdiction_name,
          jurisdiction_type,
          fiscal_year
        )
      `)
      .eq('user_id', profile.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
      count: conversations?.length || 0
    })

  } catch (error) {
    console.error('Error in conversations API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, documentIds, title, threadId } = body

    // Validate required fields
    if (!documentId && !documentIds) {
      return NextResponse.json({ error: 'Document ID(s) required' }, { status: 400 })
    }

    if (!title || !threadId) {
      return NextResponse.json({ error: 'Title and thread ID required' }, { status: 400 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // For multi-document conversations, we'll use the first document as primary
    // and store the full list in metadata or handle separately
    const primaryDocumentId = documentId || (documentIds && documentIds[0])

    // Create conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: profile.id,
        document_id: primaryDocumentId,
        title,
        thread_id: threadId,
        message_count: 0,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      conversation,
      message: 'Conversation created successfully'
    })

  } catch (error) {
    console.error('Error in conversations POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}