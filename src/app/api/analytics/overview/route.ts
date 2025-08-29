import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase'


// Helper function to safely parse and validate duration
function validateDuration(duration: any): number {
  const minutes = Number(duration) || 0
  // Ensure duration is valid and non-negative
  if (!isFinite(minutes) || minutes < 0) {
    console.warn('Invalid duration detected:', duration, '- treating as 0')
    return 0
  }
  // Cap at reasonable maximum (24 hours = 1440 minutes)
  if (minutes > 1440) {
    console.warn('Unusually long duration:', minutes, 'minutes - capping at 1440')
    return 1440
  }
  // Return with precision for decimal minutes
  return Math.round(minutes * 10000) / 10000 // Keep 4 decimal places
}

// Helper function to properly evaluate call success
function evaluateCallSuccess(evaluation: any): boolean {
  if (!evaluation) return false
  
  // Convert to string and normalize
  const evalStr = String(evaluation).toLowerCase().trim()
  
  // Exact matches for success (avoid substring false positives)
  const successValues = [
    'successful',
    'success',
    'qualified',
    'completed',
    'good',
    'excellent',
    'true',
    '1',
    'yes',
    'passed'
  ]
  
  // Check for exact match
  if (successValues.includes(evalStr)) {
    return true
  }
  
  // Check for boolean true
  if (evaluation === true || evaluation === 1) {
    return true
  }
  
  // Explicit failure checks (to avoid "unsuccessful" being marked as success)
  const failureIndicators = [
    'unsuccessful',
    'failed',
    'failure',
    'error',
    'bad',
    'poor',
    'false',
    '0',
    'no',
    'incomplete'
  ]
  
  if (failureIndicators.some(indicator => evalStr.includes(indicator))) {
    return false
  }
  
  // Default to false for unknown values
  return false
}


// Helper function to safely get date string in UTC
function getDateStringUTC(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp)
      return null
    }
    // Use UTC date to avoid timezone issues
    return date.toISOString().split('T')[0]
  } catch (error) {
    console.warn('Error parsing timestamp:', timestamp, error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to authenticate but don't fail if it doesn't work
    let user = null
    try {
      const authResult = await authenticateRequest()
      user = authResult.user
    } catch (authError) {
      console.log('Authentication failed, returning empty analytics:', authError)
      return NextResponse.json({
        success: true,
        data: {
          totalCalls: 0,
          totalDuration: 0,
          avgDuration: 0,
          successRate: 0,
          topAssistants: [],
          recentActivity: [],
          dailyStats: []
        }
      })
    }

    const supabase = createServiceRoleClient()

    // Get all assistants for the user
    let assistants: Array<{ id: string, name: string, vapi_assistant_id: string }> = []
    try {
      const { data: assistantsData, error: assistantsError } = await supabase
        .from('user_assistants')
        .select('id, name, vapi_assistant_id')
        .eq('user_id', user.id)

      if (assistantsError) {
        console.error('Error fetching assistants:', assistantsError)
        assistants = []
      } else {
        assistants = assistantsData || []
      }
    } catch (dbError) {
      console.error('Database connection error for assistants:', dbError)
      assistants = []
    }

    if (!assistants || assistants.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalCalls: 0,
          totalDuration: 0,
          avgDuration: 0,
          successRate: 0,
          topAssistants: [],
          recentActivity: [],
          dailyStats: []
        }
      })
    }

    // Create lookup maps for both internal IDs and VAPI IDs
    const assistantIds = assistants.map(a => a.id)
    const vapiAssistantIds = assistants.map(a => a.vapi_assistant_id).filter(Boolean)
    const assistantLookup = new Map(assistants.map(a => [a.id, a]))
    const vapiAssistantLookup = new Map(assistants.map(a => [a.vapi_assistant_id, a]))

    // Get calls data - try both internal IDs and VAPI IDs
    let calls: any[] = []
    try {
      // First try with internal IDs (if FK points to user_assistants.id)
      const { data: callsByInternalId, error: error1 } = await supabase
        .from('call_info_log')
        .select('*')
        .in('assistant_id', assistantIds)
        .order('started_at', { ascending: false })
        .limit(100)

      let error2 = null // Initialize error2 to avoid undefined reference
      
      if (!error1 && callsByInternalId && callsByInternalId.length > 0) {
        calls = callsByInternalId
        console.log('Found calls using internal assistant IDs')
      } else if (vapiAssistantIds.length > 0) {
        // If no results with internal IDs, try VAPI IDs (if FK points to vapi_assistant_id)
        const { data: callsByVapiId, error: callsError2 } = await supabase
          .from('call_info_log')
          .select('*')
          .in('assistant_id', vapiAssistantIds)
          .order('started_at', { ascending: false })
          .limit(100)
        
        error2 = callsError2 // Assign to outer variable

        if (!error2 && callsByVapiId) {
          calls = callsByVapiId
          console.log('Found calls using VAPI assistant IDs')
        }
      }

      if (calls.length === 0) {
        console.log('No calls found for user assistants')
        if (error1 || error2) {
          console.error('Errors fetching calls:', { error1, error2 })
        }
      }
    } catch (error) {
      console.error('Error fetching calls from call_info_log:', error)
      calls = []
    }

    // Process calls with validation
    const allCalls = calls.filter(call => {
      // Validate essential fields
      if (!call || !call.id) {
        console.warn('Invalid call record found:', call)
        return false
      }
      return true
    })
    
    // Calculate overall statistics with validation
    const totalCalls = allCalls.length
    
    
    // Total duration already in seconds
    const totalDuration = allCalls.reduce((sum, call) => {
      return sum + (Number(call.duration_seconds) || 0)
    }, 0)
    
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0

    // Calculate success rate with proper evaluation
    const successfulCalls = allCalls.filter(call => evaluateCallSuccess(call.evaluation))
    const successRate = totalCalls > 0 ? (successfulCalls.length / totalCalls) * 100 : 0

    // Calculate assistant performance
    const assistantStats = assistants.map(assistant => {
      // Check both internal ID and VAPI ID
      const assistantCalls = allCalls.filter(call => 
        call.assistant_id === assistant.id || 
        call.assistant_id === assistant.vapi_assistant_id
      )
      
      
      const assistantSuccessful = assistantCalls.filter(call => 
        evaluateCallSuccess(call.evaluation)
      )
      
      const assistantSuccessRate = assistantCalls.length > 0 
        ? (assistantSuccessful.length / assistantCalls.length) * 100 
        : 0

      return {
        id: assistant.id,
        name: assistant.name,
        calls: assistantCalls.length,
        successRate: Math.round(assistantSuccessRate)
      }
    }).filter(stat => stat.calls > 0) // Only include assistants with calls
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5)

    // Recent activity with proper assistant lookup
    const recentActivity = allCalls.slice(0, 10).map(call => {
      // Try to find assistant by both internal ID and VAPI ID
      const assistant = assistantLookup.get(call.assistant_id) || 
                       vapiAssistantLookup.get(call.assistant_id)
      
      const success = evaluateCallSuccess(call.evaluation)
      const durationSeconds = Number(call.duration_seconds) || 0

      return {
        id: call.id,
        assistantName: assistant?.name || 'Unknown Assistant',
        callerNumber: call.caller_number || 'Unknown',
        duration: Math.round(durationSeconds),
        success,
        timestamp: call.started_at || call.created_at
      }
    })

    // Daily statistics with proper timezone handling (last 7 days in UTC)
    const now = new Date()
    const dailyStats = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setUTCDate(date.getUTCDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayCalls = allCalls.filter(call => {
        const callDate = getDateStringUTC(call.started_at || call.created_at)
        return callDate === dateStr
      })
      
      
      const dayDuration = dayCalls.reduce((sum, call) => {
        return sum + (Number(call.duration_seconds) || 0)
      }, 0)
      
      const dayAvgDuration = dayCalls.length > 0 ? dayDuration / dayCalls.length : 0
      
      dailyStats.push({
        date: dateStr,
        calls: dayCalls.length,
        avgDuration: Math.round(dayAvgDuration)
      })
    }

    // Add summary statistics for debugging
    console.log('Analytics summary:', {
      totalCalls,
      successfulCalls: successfulCalls.length,
      successRate: successRate.toFixed(1),
      assistantsWithCalls: assistantStats.length
    })

    return NextResponse.json({
      success: true,
      data: {
        totalCalls,
        totalDuration,
        avgDuration: Math.round(avgDuration),
        successRate: Math.round(successRate * 10) / 10,
        topAssistants: assistantStats,
        recentActivity,
        dailyStats
      }
    })

  } catch (error) {
    console.error('GET analytics overview error:', error)
    // Return graceful error response
    return NextResponse.json({
      success: false,
      error: { 
        code: 'ANALYTICS_ERROR', 
        message: error instanceof Error ? error.message : 'Failed to fetch analytics overview' 
      },
      // Still return empty data structure so UI doesn't break
      data: {
        totalCalls: 0,
        totalDuration: 0,
        avgDuration: 0,
        successRate: 0,
        topAssistants: [],
        recentActivity: [],
        dailyStats: []
      }
    }, { status: 500 })
  }
}