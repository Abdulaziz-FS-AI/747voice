import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/usage - Get current user's usage data and limits
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the user ID from authentication
    // For testing, let's use our test user
    const userId = 'd2a8d7e6-b982-4dc8-b257-8f1c5e0e11cb' // existing_user@example.com

    // Get user data from admin monitoring view
    const { data: userData, error: userError } = await supabase
      .from('admin_user_monitoring')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userError) {
      throw userError
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 404 }
      )
    }

    // Transform the data to match the expected format
    const usageData = {
      minutes: {
        used: userData.current_usage_minutes || 0,
        limit: userData.max_minutes_total || 10,
        percentage: userData.usage_percentage || 0,
        remaining: Math.max(0, (userData.max_minutes_total || 10) - (userData.current_usage_minutes || 0)),
        canMakeCall: (userData.current_usage_minutes || 0) < (userData.max_minutes_total || 10)
      },
      assistants: {
        count: userData.active_assistants || 0,
        limit: userData.max_assistants || 3,
        canCreateAssistant: userData.quick_actions?.can_increase_assistants ?? true
      },
      account_status: userData.account_status || 'NORMAL'
    }

    return NextResponse.json({
      success: true,
      data: usageData
    })
  } catch (error) {
    console.error('Error fetching usage data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch usage data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/usage - Update usage data (for when calls are made)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { minutesUsed, callId, assistantId } = body

    // In a real app, you'd get the user ID from authentication
    const userId = 'd2a8d7e6-b982-4dc8-b257-8f1c5e0e11cb' // existing_user@example.com

    if (!minutesUsed || !assistantId) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields: minutesUsed, assistantId' } },
        { status: 400 }
      )
    }

    // Update user's current usage
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_usage_minutes: supabase.raw(`current_usage_minutes + ${minutesUsed}`),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    // Log the call if callId provided
    if (callId) {
      await supabase
        .from('call_info_log')
        .insert({
          vapi_call_id: callId,
          assistant_id: assistantId,
          duration_seconds: minutesUsed * 60,
          created_at: new Date().toISOString()
        })
    }

    // Return updated usage data
    return GET(request)
  } catch (error) {
    console.error('Error updating usage data:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to update usage data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
}