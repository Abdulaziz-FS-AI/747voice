import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/user-limits - Get user monitoring data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 'SUSPENDED', 'OVER_LIMIT', 'WARNING', 'NORMAL'

    let query = supabase
      .from('admin_user_monitoring')
      .select('*')
      .order('signup_date', { ascending: false });

    // Filter by specific user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filter by status
    if (status) {
      query = query.eq('account_status', status);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user monitoring data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/user-limits - Update user limits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      maxAssistants,
      maxMinutes,
      adminEmail = 'admin@system',
      reason = 'Admin adjustment',
      suspendUser
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Call the admin function to update limits
    const { data, error } = await supabase.rpc('admin_update_user_limits', {
      p_user_id: userId,
      p_new_assistant_limit: maxAssistants,
      p_new_minutes_limit: maxMinutes,
      p_admin_email: adminEmail,
      p_reason: reason,
      p_suspend_user: suspendUser
    });

    if (error) {
      throw error;
    }

    // If assistants were deleted, we need to handle VAPI deletion
    if (data.assistants_deleted > 0) {
      // Get the assistants that were marked for deletion
      const { data: deletedAssistants } = await supabase
        .from('user_assistants')
        .select('vapi_assistant_id, name')
        .eq('user_id', userId)
        .in('deletion_reason', ['admin_limit_reduction', 'user_suspended', 'minutes_limit_exceeded'])
        .eq('assistant_state', 'expired')
        .order('deleted_at', { ascending: false })
        .limit(data.assistants_deleted);

      // Return the VAPI deletion queue for external processing
      return NextResponse.json({
        success: true,
        data,
        vapiDeletionQueue: deletedAssistants?.map(assistant => ({
          vapiAssistantId: assistant.vapi_assistant_id,
          name: assistant.name,
          action: 'DELETE_FROM_VAPI'
        })) || []
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating user limits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user limits' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/user-limits/reset - Reset user usage
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, adminEmail = 'admin@system', reason = 'Admin reset' } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('admin_reset_user_usage', {
      p_user_id: userId,
      p_admin_email: adminEmail,
      p_reason: reason
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error resetting user usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset user usage' },
      { status: 500 }
    );
  }
}