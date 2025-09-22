import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { createUserProfile } from '@/lib/supabase/database'
import { getSupabaseAdmin } from '@/lib/supabase/client'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()

  const wh = new Webhook(webhookSecret)

  let evt: any

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { id, email_addresses, first_name, last_name } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    try {
      const email = email_addresses[0]?.email_address || 'no-email@example.com'
      const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User'

      // Check if this is the first user (make them admin)
      const { data: existingProfiles } = await getSupabaseAdmin()
        .from('profiles')
        .select('id')
        .limit(1)

      const isFirstUser = !existingProfiles || existingProfiles.length === 0
      const role = isFirstUser ? 'admin' : 'user'

      // Use admin client to bypass RLS
      const { data, error } = await getSupabaseAdmin()
        .from('profiles')
        .insert({
          clerk_user_id: id,
          email,
          full_name: fullName,
          user_type: 'citizen',
          role: role,
        })
        .select()
        .single()

      if (error) throw error

      console.log(`User profile created for ${email} with role: ${role}`)
    } catch (error) {
      console.error('Error creating user profile:', error)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'Webhook processed successfully' })
}