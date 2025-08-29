import { NextRequest, NextResponse } from 'next/server'
import { requireAuth as authenticateRequest } from '@/lib/auth-simple'
import { createServiceRoleClient } from '@/lib/supabase'

// GET /api/usage - Get current user's usage data and limits
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await authenticateRequest()
    const user = authResult.user
    const userId = user.id

    const supabase = createServiceRoleClient('usage_api')

    // Get user data from admin monitoring view with actual usage calculation
    const { data: userData, error: userError } = await supabase
      .from('admin_user_monitoring')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (userError) {
      throw userError
    }

    // If no user profile found, create one with default values
    let userProfile = userData
    if (!userProfile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          max_assistants: 3,
          max_minutes_total: 10,
          current_usage_minutes: 0
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating user profile:', createError)
        throw createError
      }

      // Get the full monitoring view for the new user
      const { data: monitoringData } = await supabase
        .from('admin_user_monitoring')
        .select('*')
        .eq('user_id', userId)
        .single()

      userProfile = monitoringData || {
        user_id: userId,
        email: user.email || '',
        max_assistants: 3,
        max_minutes_total: 10,
        current_usage_minutes: 0,
        active_assistants: 0,
        usage_percentage: 0,
        account_status: 'NORMAL',
        quick_actions: { can_increase_assistants: true, can_increase_minutes: true }
      }
    }

    // Calculate ACTUAL usage from call logs for this specific user (in seconds, then convert to minutes)
    const { data: actualUsageData } = await supabase.rpc('get_user_actual_usage_seconds', {
      p_user_id: userId
    })

    // Get usage in minutes from the seconds-based calculation for higher precision
    const actualUsageMinutes = actualUsageData?.[0]?.total_usage_minutes || userProfile.current_usage_minutes || 0
    const totalUsageSeconds = actualUsageData?.[0]?.total_usage_seconds || 0

    // Transform the data to match the expected format using ACTUAL usage
    const limit = userProfile.max_minutes_total || 10
    const remaining = Math.max(0, limit - actualUsageMinutes)
    const percentage = limit > 0 ? Math.round((actualUsageMinutes / limit) * 100) : 0
    
    const usageData = {
      minutes: {
        used: Number(actualUsageMinutes),
        limit: limit,
        percentage: percentage,
        remaining: Number(remaining),
        canMakeCall: actualUsageMinutes < limit
      },
      assistants: {
        count: userProfile.active_assistants || 0,
        limit: userProfile.max_assistants || 3,
        canCreateAssistant: (userProfile.active_assistants || 0) < (userProfile.max_assistants || 3)
      },
      account_status: userProfile.account_status || 'NORMAL'
    }

    // Debug logging for usage calculation
    console.log('[USAGE] Usage calculation:', {
      userId,
      userEmail: user.email,
      totalUsageSeconds,
      actualUsageMinutes,
      activeAssistants: userProfile.active_assistants,
      maxAssistants: userProfile.max_assistants,
      totalCalls: actualUsageData?.[0]?.total_calls || 0
    })

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
    // Get authenticated user
    const authResult = await authenticateRequest()
    const user = authResult.user
    const userId = user.id
    
    const supabase = createServiceRoleClient('usage_api_post')
    
    const body = await request.json()
    const { minutesUsed, callId, assistantId } = body

    if (!minutesUsed || !assistantId) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields: minutesUsed, assistantId' } },
        { status: 400 }
      )
    }

    // Verify the assistant belongs to the authenticated user
    const { data: assistantCheck } = await supabase
      .from('user_assistants')
      .select('user_id')
      .eq('vapi_assistant_id', assistantId)
      .eq('user_id', userId)
      .single()

    if (!assistantCheck) {
      return NextResponse.json(
        { success: false, error: { message: 'Assistant not found or does not belong to user' } },
        { status: 403 }
      )
    }

    // Update user's current usage (we keep this for fast lookups)
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