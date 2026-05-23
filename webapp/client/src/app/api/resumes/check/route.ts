import { NextRequest, NextResponse } from 'next/server'
import { getResumeByPhone } from '@/lib/supabase/database'

/**
 * POST /api/resumes/check
 *
 * Checks if a resume already exists for a given phone number.
 * Used by the WhatsApp chatbot before starting the resume creation flow.
 *
 * Body:
 * {
 *   phone: string   // e.g. "918xxxxxxxxx" (stripped of @c.us suffix)
 * }
 *
 * Response:
 * {
 *   exists: boolean,
 *   claimed: boolean,
 *   token: string | null
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'phone is required' },
        { status: 400 }
      )
    }

    const normalizedPhone = phone.trim()

    console.log(`📱 [check] Looking up resume for phone: ${normalizedPhone}`)

    const result = await getResumeByPhone(normalizedPhone)

    if (result.success && result.data) {
      console.log(`✅ [check] Resume found for phone: ${normalizedPhone} — ID: ${result.data.id}`)
      
      const email = result.data.email || ''
      const claimed = !email.includes('@wa.chefdhundo.com')
      const token = result.data.claim_token || null

      return NextResponse.json({ 
        exists: true, 
        claimed: claimed, 
        token: token 
      }, { status: 200 })
    }

    console.log(`ℹ️ [check] No resume found for phone: ${normalizedPhone}`)
    return NextResponse.json({ exists: false, claimed: false, token: null }, { status: 200 })

  } catch (error) {
    // Fail-safe: if the check fails for any reason, signal "not found"
    // so the chatbot can continue normally rather than blocking the user.
    console.error('❌ [check] Unexpected error in POST /api/resumes/check:', error)
    return NextResponse.json({ exists: false, claimed: false, token: null }, { status: 200 })
  }
}
