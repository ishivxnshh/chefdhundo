import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/supabase';

// Cache configuration for announcements
const CACHE_MAX_AGE = 30 // 30 seconds for active announcements
const STALE_WHILE_REVALIDATE = 120 // 2 minutes

// GET /api/announcements - Get all announcements (with optional filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'active' | 'scheduled' | 'expired' | 'draft' | null; // Filter by status
    const activeOnly = searchParams.get('active') === 'true'; // Only get currently active ones
    
    const supabase = createSupabaseAdminClient();
    
    let query = supabase
      .from('announcements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status && ['active', 'scheduled', 'expired', 'draft'].includes(status)) {
      query = query.eq('status', status);
    }
    
    // If activeOnly, filter by date range and active status
    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq('status', 'active')
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    const response = NextResponse.json({
      success: true,
      data: data || []
    });
    
    // Add cache headers for announcements
    response.headers.set('Cache-Control', `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`);
    return response;
  } catch (error) {
    console.error('Error in GET /api/announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create new announcement (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.message || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Title, message, and type are required' },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseAdminClient();
    
    // Prepare announcement data with defaults
    const announcementData = {
      type: body.type,
      title: body.title,
      message: body.message,
      tag: body.tag || null,
      icon: body.icon || null,
      link_url: body.link_url || null,
      link_text: body.link_text || null,
      status: body.status || 'draft',
      priority: body.priority || 5,
      start_date: body.start_date || new Date().toISOString(),
      end_date: body.end_date || null,
      dismissible: body.dismissible !== undefined ? body.dismissible : true,
      bg_color: body.bg_color || null,
      text_color: body.text_color || null,
      themed: body.themed !== undefined ? body.themed : false,
    };
    
    const { data, error } = await supabase
      .from('announcements')
      .insert([announcementData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating announcement:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Announcement created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
