import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  // Verify authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: 'Invalid or missing authorization header' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (req.method === 'POST') {
    const requestBody = await req.json()
    const { type, data } = requestBody
    
    console.log('Webhook received:', { type, userId: data?.id })
    console.log('Email addresses:', data?.email_addresses)
    
    // Handle user creation and updates
    if (type === 'user.created' || type === 'user.updated') {
      const {
        id: clerkUserId,
        email_addresses,
        first_name,
        last_name,
        image_url,
        created_at,
        updated_at,
        primary_email_address_id
      } = data

      // Find primary email address
      const primaryEmail = email_addresses?.find((emailObj: any) => 
        emailObj.id === primary_email_address_id
      )?.email_address || null

      // Prepare user data
      const userData: any = {
        clerk_user_id: clerkUserId,
        name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
        chef: 'no', // Fixed: should be 'no' not 'false'
        role: 'basic',
        photo: image_url || null,
        created_at: new Date(created_at).toISOString(),
        updated_at: new Date(updated_at).toISOString()
      }

      // Only include email if it exists
      if (primaryEmail) {
        userData.email = primaryEmail
      }

      console.log('Attempting to upsert user:', userData)

      const { error } = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'clerk_user_id'
        })

      if (error) {
        console.error('Supabase error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ message: 'Success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Method not allowed', { status: 405 })
})