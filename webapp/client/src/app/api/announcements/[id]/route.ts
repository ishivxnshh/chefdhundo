import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/supabase';

type AnnouncementRouteParams = {
  id?: string | string[];
};

type AnnouncementRouteContext = {
  params: Promise<AnnouncementRouteParams>;
};

// GET /api/announcements/[id] - Get single announcement
export async function GET(
  request: NextRequest,
  context: AnnouncementRouteContext
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const announcementId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!announcementId) {
      return NextResponse.json(
        { success: false, error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();
    
    if (error) {
      console.error('Error fetching announcement:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in GET /api/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/announcements/[id] - Update announcement
export async function PUT(
  request: NextRequest,
  context: AnnouncementRouteContext
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const announcementId = Array.isArray(rawId) ? rawId[0] : rawId;
    const body = await request.json();

    if (!announcementId) {
      return NextResponse.json(
        { success: false, error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    
    // Create update object with only provided fields
    const updates: Record<string, unknown> = {};
    
    const updatableFields = [
      'type', 'title', 'message', 'tag', 'icon', 'link_url', 'link_text',
      'status', 'priority', 'start_date', 'end_date', 'dismissible',
      'bg_color', 'text_color', 'themed'
    ];

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', announcementId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating announcement:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Announcement updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  context: AnnouncementRouteContext
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const announcementId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!announcementId) {
      return NextResponse.json(
        { success: false, error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId);
    
    if (error) {
      console.error('Error deleting announcement:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/announcements/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
