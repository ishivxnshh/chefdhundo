import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

function getRoleFromClaims(sessionClaims: unknown): string {
  const claims = sessionClaims as
    | {
        metadata?: { role?: string }
        publicMetadata?: { role?: string }
        role?: string
      }
    | undefined

  return claims?.metadata?.role || claims?.publicMetadata?.role || claims?.role || 'user'
}

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const role = getRoleFromClaims(sessionClaims)

    if (role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createSupabaseAdminClient()

    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unexpected server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

