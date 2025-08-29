import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase'

// Helper function to truncate transcript to one sentence
function truncateToSentence(text: string, maxLength: number = 80): string {
  if (!text) return ''
  
  // Find the first sentence ending
  const sentenceEnd = text.match(/[.!?]+/)
  if (sentenceEnd && sentenceEnd.index && sentenceEnd.index < maxLength) {
    return text.substring(0, sentenceEnd.index + 1)
  }
  
  // Fallback: truncate at word boundary
  if (text.length <= maxLength) return text
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

// Helper function to properly evaluate call success (matching main analytics)
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

// Helper function to analyze success evaluation based on rubric type
function analyzeSuccessEvaluation(calls: any[], rubricType: string) {
  const breakdown: Record<string, number> = {}
  let totalEvaluated = 0
  
  calls.forEach(call => {
    // Use 'evaluation' field from call_info_log, not 'success_evaluation'
    if (!call.evaluation) return
    
    totalEvaluated++
    const evaluation = call.evaluation
    
    switch (rubricType) {
      case 'DescriptiveScale':
        // Excellent, Good, Fair, Poor
        const scales = ['Excellent', 'Good', 'Fair', 'Poor']
        if (scales.includes(evaluation)) {
          breakdown[evaluation] = (breakdown[evaluation] || 0) + 1
        }
        break
        
      case 'PercentageScale':
        // Group into ranges
        const percent = parseFloat(evaluation)
        if (!isNaN(percent)) {
          const range = percent >= 75 ? '75-100%' : 
                       percent >= 50 ? '50-74%' : 
                       percent >= 25 ? '25-49%' : '0-24%'
          breakdown[range] = (breakdown[range] || 0) + 1
        }
        break
        
      case 'PassFail':
        const result = evaluation === true || evaluation === 'true' || evaluation === 'Pass' ? 'Pass' : 'Fail'
        breakdown[result] = (breakdown[result] || 0) + 1
        break
        
      case 'LikertScale':
        // Strongly Agree, Agree, Neutral, Disagree, Strongly Disagree
        const likertScales = ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree']
        if (likertScales.includes(evaluation)) {
          breakdown[evaluation] = (breakdown[evaluation] || 0) + 1
        }
        break
        
      case 'Checklist':
        // Handle checklist items
        if (typeof evaluation === 'object') {
          Object.entries(evaluation).forEach(([key, value]) => {
            const status = value ? 'Completed' : 'Not Completed'
            breakdown[`${key}: ${status}`] = (breakdown[`${key}: ${status}`] || 0) + 1
          })
        }
        break
        
      default:
        // Generic handling
        breakdown[String(evaluation)] = (breakdown[String(evaluation)] || 0) + 1
    }
  })
  
  return { breakdown, totalEvaluated }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await authenticateRequest()
    const { id: assistantId } = await params
    
    if (!assistantId) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_ASSISTANT_ID', message: 'Assistant ID is required' }
      }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Verify user owns this assistant and get assistant details
    const { data: assistant, error: assistantError } = await supabase
      .from('user_assistants')
      .select('id, user_id, name, config, vapi_assistant_id')
      .eq('id', assistantId)
      .eq('user_id', user.id)
      .single()

    if (assistantError || !assistant) {
      return NextResponse.json({
        success: false,
        error: { code: 'ASSISTANT_NOT_FOUND', message: 'Assistant not found or access denied' }
      }, { status: 404 })
    }

    // Get evaluation rubric from assistant config
    const evaluationRubric = assistant.config?.evaluation_rubric || 'PassFail'

    // Get all calls for this assistant from call_info_log table
    // Try both internal ID and VAPI ID in case of different FK configurations
    const { data: callsByInternalId, error: callsError1 } = await supabase
      .from('call_info_log')
      .select('*')
      .eq('assistant_id', assistantId)
      .order('started_at', { ascending: false })
    
    let calls = callsByInternalId || []
    
    // If no calls found by internal ID, try VAPI ID
    if (calls.length === 0 && assistant.vapi_assistant_id) {
      const { data: callsByVapiId, error: callsError2 } = await supabase
        .from('call_info_log')
        .select('*')
        .eq('assistant_id', assistant.vapi_assistant_id)
        .order('started_at', { ascending: false })
      
      if (callsByVapiId) {
        calls = callsByVapiId
      }
    }

    if (callsError1 && callsError2) {
      console.error('Error fetching call info logs:', callsError1, callsError2)
    }

    const allCalls = calls || []

    // Get structured questions for this assistant
    const { data: structuredQuestions, error: questionsError } = await supabase
      .from('structured_questions')
      .select('*')
      .eq('assistant_id', assistantId)
      .order('order_index')

    if (questionsError) {
      console.error('Error fetching structured questions:', questionsError)
    }

    // Calculate basic metrics
    const totalCalls = allCalls.length
    const totalDuration = allCalls.reduce((sum, call) => sum + (Number(call.duration_seconds) || 0), 0)
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0
    

    // Calculate success rate using the 'evaluation' field from call_info_log
    const evaluatedCalls = allCalls.filter(call => call.evaluation !== null && call.evaluation !== undefined)
    let successRate = 0
    
    if (evaluatedCalls.length > 0) {
      // Use the fixed evaluation logic to avoid false positives
      const successfulCalls = evaluatedCalls.filter(call => evaluateCallSuccess(call.evaluation))
      successRate = (successfulCalls.length / evaluatedCalls.length) * 100
    }

    // Analyze structured questions completion rates
    const questionAnalytics = (structuredQuestions || []).map(question => {
      const answeredCalls = allCalls.filter(call => {
        // Handle structured_data that might be a JSON string or object
        let structuredData = {}
        if (call.structured_data) {
          if (typeof call.structured_data === 'string') {
            try {
              structuredData = JSON.parse(call.structured_data)
            } catch (e) {
              console.warn('Failed to parse structured_data as JSON:', e)
              structuredData = {}
            }
          } else {
            structuredData = call.structured_data
          }
        }
        
        // Check multiple possible field names (case-insensitive)
        let answer = structuredData[question.structured_name]
        
        // If not found, try case-insensitive search
        if (answer === null || answer === undefined) {
          const lowerStructuredName = question.structured_name.toLowerCase()
          for (const [key, value] of Object.entries(structuredData)) {
            if (key.toLowerCase() === lowerStructuredName) {
              answer = value
              break
            }
          }
        }
        
        // Debug logging to see what's in the data (only log once per question in development)
        if (process.env.NODE_ENV === 'development' && totalCalls > 0 && allCalls.indexOf(call) === 0) {
          console.log('Structured Questions Debug:', {
            questionText: question.question_text,
            structuredName: question.structured_name,
            sampleData: structuredData,
            foundAnswer: answer,
            rawData: call.structured_data
          })
        }
        
        return answer !== null && answer !== undefined && answer !== ''
      })
      
      const answerRate = totalCalls > 0 ? (answeredCalls.length / totalCalls) * 100 : 0
      
      return {
        question: question.question_text,
        structuredName: question.structured_name,
        dataType: question.data_type,
        isRequired: question.is_required,
        answerRate: Math.round(answerRate * 10) / 10, // Round to 1 decimal
        totalAnswered: answeredCalls.length,
        totalCalls: totalCalls
      }
    })

    // Format recent calls with properly parsed structured data
    const recentCalls = allCalls.slice(0, 50).map(call => {
      const durationSeconds = Number(call.duration_seconds) || 0
      
      // Parse structured_data if it's a string
      let structuredData = {}
      if (call.structured_data) {
        if (typeof call.structured_data === 'string') {
          try {
            structuredData = JSON.parse(call.structured_data)
          } catch (e) {
            console.warn('Failed to parse structured_data for call:', call.id)
            structuredData = {}
          }
        } else {
          structuredData = call.structured_data
        }
      }
      
      return {
        id: call.id,
        callerNumber: call.caller_number || 'Unknown',
        duration: Math.round(durationSeconds), // Already in seconds
        startedAt: call.started_at,
        transcript: call.transcript || '',
        shortTranscript: truncateToSentence(call.transcript || ''),
        structuredData: structuredData,
        successEvaluation: call.evaluation, // Use 'evaluation' field from call_info_log
        summary: call.summary || ''
      }
    })

    // Analyze success evaluation breakdown
    const successAnalysis = analyzeSuccessEvaluation(allCalls, evaluationRubric)

    return NextResponse.json({
      success: true,
      data: {
        assistant: {
          id: assistant.id,
          name: assistant.name,
          evaluationRubric: evaluationRubric
        },
        metrics: {
          totalCalls,
          avgDuration: Math.round(avgDuration),
          successRate: Number(successRate.toFixed(1))
        },
        structuredQuestions: questionAnalytics,
        recentCalls,
        successAnalysis: {
          rubricType: evaluationRubric,
          breakdown: successAnalysis.breakdown,
          totalEvaluated: successAnalysis.totalEvaluated
        }
      }
    })

  } catch (error) {
    console.error('GET assistant analytics error:', error)
    return NextResponse.json({
      success: false,
      error: { 
        code: 'ANALYTICS_ERROR', 
        message: error instanceof Error ? error.message : 'Failed to fetch analytics' 
      }
    }, { status: 500 })
  }
}