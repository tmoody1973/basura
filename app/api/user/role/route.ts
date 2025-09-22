import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/supabase/database'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Clerk User ID:', userId) // Debug log

    const role = await getUserRole(userId)
    console.log('User role:', role) // Debug log

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
  }
}