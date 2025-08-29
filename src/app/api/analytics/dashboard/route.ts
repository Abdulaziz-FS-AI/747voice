import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user } = await authenticateRequest()
    const supabase = createServiceRoleClient()
    
    // Get timeframe from query params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)
    
    // Get user's assistants
    const { data: assistants, error: assistantsError } = await supabase
      .from('user_assistants')
      .select('id, name')
      .eq('user_id', user.id)
    
    if (assistantsError) {
      throw new Error('Failed to fetch assistants')
    }
    
    const assistantIds = (assistants || []).map(a => a.id)
    
    // Return empty data if no assistants
    if (assistantIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalCalls: 0,
            successRate: 0,
            avgCallDuration: 0,
            totalDuration: 0,
            uniqueCallers: 0
          },
          callVolume: [],
          successRateTrend: [],
          assistantPerformance: [],
          hourlyDistribution: Array(24).fill(0),
          statusBreakdown: {
            excellent: 0,
            good: 0,
            average: 0,
            poor: 0,
            failed: 0,
            pending: 0
          }
        }
      })
    }
    
    // Get calls within date range
    const { data: calls, error: callsError } = await supabase
      .from('call_info_log')
      .select('*')
      .in('assistant_id', assistantIds)
      .gte('started_at', startDate.toISOString())
      .lte('started_at', endDate.toISOString())
      .order('started_at', { ascending: true })
    
    if (callsError) {
      console.error('Error fetching calls:', callsError)
      throw new Error('Failed to fetch call data')
    }
    
    const allCalls = calls || []
    
    // Calculate overview metrics
    const totalCalls = allCalls.length
    const completedCalls = allCalls.filter(c => c.evaluation === 'excellent' || c.evaluation === 'good' || c.evaluation === 'average').length
    const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0
    const totalDuration = allCalls.reduce((sum, call) => sum + (call.duration_minutes || 0), 0)
    const avgCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
    const uniqueCallers = new Set(allCalls.map(c => c.caller_number)).size
    
    // Calculate daily trends
    const dailyMap = new Map<string, { calls: number, completed: number }>()
    
    allCalls.forEach(call => {
      const date = new Date(call.started_at || call.created_at).toISOString().split('T')[0]
      const existing = dailyMap.get(date) || { calls: 0, completed: 0 }
      
      dailyMap.set(date, {
        calls: existing.calls + 1,
        completed: existing.completed + (call.evaluation === 'excellent' || call.evaluation === 'good' || call.evaluation === 'average' ? 1 : 0)
      })
    })
    
    // Generate trend data for all days in range
    const callVolume = []
    const successRateTrend = []
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split('T')[0]
      const dayData = dailyMap.get(dateStr) || { calls: 0, completed: 0 }
      
      callVolume.push({
        date: dateStr,
        value: dayData.calls
      })
      
      successRateTrend.push({
        date: dateStr,
        value: dayData.calls > 0 ? (dayData.completed / dayData.calls) * 100 : 0
      })
    }
    
    // Calculate assistant performance
    const assistantPerformance = assistants?.map(assistant => {
      const assistantCalls = allCalls.filter(c => c.assistant_id === assistant.id)
      const completed = assistantCalls.filter(c => c.evaluation === 'excellent' || c.evaluation === 'good' || c.evaluation === 'average').length
      const totalAssistantDuration = assistantCalls.reduce((sum, c) => sum + (c.duration_minutes || 0), 0)
      
      return {
        id: assistant.id,
        name: assistant.name,
        totalCalls: assistantCalls.length,
        successRate: assistantCalls.length > 0 ? (completed / assistantCalls.length) * 100 : 0,
        avgDuration: assistantCalls.length > 0 ? totalAssistantDuration / assistantCalls.length : 0
      }
    }).sort((a, b) => b.totalCalls - a.totalCalls)
    
    // Calculate hourly distribution
    const hourlyDistribution = Array(24).fill(0)
    allCalls.forEach(call => {
      const hour = new Date(call.started_at || call.created_at).getHours()
      hourlyDistribution[hour]++
    })
    
    // Calculate evaluation breakdown
    const statusBreakdown = {
      excellent: allCalls.filter(c => c.evaluation === 'excellent').length,
      good: allCalls.filter(c => c.evaluation === 'good').length,
      average: allCalls.filter(c => c.evaluation === 'average').length,
      poor: allCalls.filter(c => c.evaluation === 'poor').length,
      failed: allCalls.filter(c => c.evaluation === 'failed').length,
      pending: allCalls.filter(c => c.evaluation === 'pending').length
    }
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCalls,
          successRate: Number(successRate.toFixed(1)),
          avgCallDuration: Number(avgCallDuration.toFixed(0)),
          totalDuration,
          uniqueCallers
        },
        callVolume,
        successRateTrend,
        assistantPerformance,
        hourlyDistribution,
        statusBreakdown
      }
    })
    
  } catch (error) {
    console.error('GET analytics dashboard error:', error)
    return NextResponse.json({
      success: false,
      error: { 
        code: 'DASHBOARD_ERROR', 
        message: error instanceof Error ? error.message : 'Failed to fetch dashboard analytics' 
      }
    }, { status: 500 })
  }
}