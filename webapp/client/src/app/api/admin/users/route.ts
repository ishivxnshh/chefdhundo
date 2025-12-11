import { NextResponse } from 'next/server'
//import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdminClient } from '@/lib/supabase/supabase'

export async function GET() {
  try {
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    // }

    const adminClient = createSupabaseAdminClient()
    // const { data: me, error: meErr } = await adminClient
    //   .from('users')
    //   .select('*')
    //   .order('created_at', { ascending: false })
    //   //.eq('clerk_user_id', userId)
    //   //.maybeSingle()

    // if (meErr) {
    //   return NextResponse.json({ success: false, error: meErr.message }, { status: 500 })
    // }

    // if (me?.role !== 'admin') {
    //   return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    // }

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

