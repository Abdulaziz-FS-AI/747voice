'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Phone, 
  Clock, 
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

interface Assistant {
  id: string
  name: string
  callCount?: number
}

interface StructuredQuestion {
  question: string
  structuredName: string
  dataType: string
  isRequired: boolean
  answerRate: number
  totalAnswered: number
  totalCalls: number
}

interface CallLog {
  id: string
  callerNumber: string
  duration: number
  startedAt: string
  transcript: string
  shortTranscript: string
  structuredData: Record<string, any>
  successEvaluation: any
  summary: string
}

interface AssistantAnalytics {
  assistant: {
    id: string
    name: string
    evaluationRubric: string
  }
  metrics: {
    totalCalls: number
    avgDuration: number
    successRate: number
  }
  structuredQuestions: StructuredQuestion[]
  recentCalls: CallLog[]
  successAnalysis: {
    rubricType: string
    breakdown: Record<string, number>
    totalEvaluated: number
  }
}

// Success Evaluation Display Component
const SuccessEvaluationDisplay = ({ evaluation, rubricType }: { evaluation: any, rubricType: string }) => {
  if (!evaluation) return <Badge variant="secondary">Not Evaluated</Badge>

  switch (rubricType) {
    case 'DescriptiveScale':
      const descriptiveVariant = evaluation === 'Excellent' ? 'default' : 
                                evaluation === 'Good' ? 'secondary' : 
                                evaluation === 'Fair' ? 'outline' : 'destructive'
      return <Badge variant={descriptiveVariant}>{evaluation}</Badge>

    case 'PercentageScale':
      let percent = 0
      if (typeof evaluation === 'string' || typeof evaluation === 'number') {
        percent = parseFloat(String(evaluation))
        if (isNaN(percent)) percent = 0
      }
      return (
        <div className="flex items-center gap-2">
          <Progress value={percent} className="w-16" />
          <span className="text-sm">{percent}%</span>
        </div>
      )

    case 'PassFail':
      const passed = evaluation === true || evaluation === 'true' || evaluation === 'Pass'
      return <Badge variant={passed ? 'default' : 'destructive'}>
        {passed ? 'Pass' : 'Fail'}
      </Badge>

    case 'LikertScale':
      const likertVariant = evaluation.includes('Strongly Agree') || evaluation.includes('Agree') ? 'default' : 
                           evaluation.includes('Neutral') ? 'secondary' : 'destructive'
      return <Badge variant={likertVariant}>{evaluation}</Badge>

    default:
      return <Badge variant="outline">{String(evaluation)}</Badge>
  }
}

export default function AssistantAnalyticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('')
  const [analytics, setAnalytics] = useState<AssistantAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set())

  // Fetch user's assistants
  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/assistants')
      const data = await response.json()
      
      if (data.success) {
        setAssistants(data.data || [])
        // Auto-select first assistant if none selected
        if (!selectedAssistantId && data.data.length > 0) {
          setSelectedAssistantId(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch assistants:', error)
    }
  }

  // Fetch analytics for selected assistant
  const fetchAnalytics = async (assistantId: string) => {
    if (!assistantId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/assistant/${assistantId}`)
      const data = await response.json()
      
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error?.message || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics(selectedAssistantId)
    setRefreshing(false)
    toast({
      title: 'Refreshed',
      description: 'Analytics data has been updated'
    })
  }

  // Export to CSV with structured format
  const exportToCSV = () => {
    if (!analytics) return

    // Prepare CSV data with only required fields
    const csvData = analytics.recentCalls.map(call => {
      let date = new Date()
      try {
        date = new Date(call.startedAt)
        if (isNaN(date.getTime())) {
          date = new Date() // Fallback to current date if invalid
        }
      } catch (e) {
        date = new Date() // Fallback on error
      }
      
      // Create base row with required fields
      const row: Record<string, any> = {
        'Caller Number': call.callerNumber,
        'Duration (seconds)': call.duration,
        'Evaluation': call.successEvaluation || 'N/A',
        'Summary': call.summary || '',
        'Transcript': (call.transcript || '').replace(/[\r\n]+/g, ' '),
        'Date': date.toLocaleDateString(),
        'Time': date.toLocaleTimeString()
      }
      
      // Add structured data fields as separate columns
      if (call.structuredData && typeof call.structuredData === 'object') {
        Object.entries(call.structuredData).forEach(([key, value]) => {
          // Clean up the key name for CSV column header
          const columnName = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
          row[columnName] = value || ''
        })
      }
      
      return row
    })

    if (csvData.length === 0) {
      toast({
        title: 'No data',
        description: 'No calls to export',
        variant: 'destructive'
      })
      return
    }

    // Create CSV string with proper escaping
    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value || '')
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
    ].join('\n')

    // Download the CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calls_${analytics.assistant.name}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Exported',
      description: `Exported ${csvData.length} calls to CSV`
    })
  }

  // Toggle transcript expansion
  const toggleTranscript = (callId: string) => {
    const newExpanded = new Set(expandedTranscripts)
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId)
    } else {
      newExpanded.add(callId)
    }
    setExpandedTranscripts(newExpanded)
  }

  useEffect(() => {
    if (user) {
      fetchAssistants()
    }
  }, [user])

  useEffect(() => {
    if (selectedAssistantId) {
      fetchAnalytics(selectedAssistantId)
    }
  }, [selectedAssistantId])

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="vm-text-secondary">Please sign in to view analytics</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight vm-text-gradient">Assistant Analytics</h1>
            <p className="text-lg vm-text-secondary mt-2">
              Detailed performance insights for your voice agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing || !selectedAssistantId}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={exportToCSV}
              disabled={!analytics}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Assistant Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Select Assistant
              </CardTitle>
              <CardDescription className="text-gray-400">
                Choose an assistant to view detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedAssistantId} onValueChange={setSelectedAssistantId}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Select an assistant..." />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{assistant.name}</span>
                        {assistant.callCount && (
                          <Badge variant="outline" className="ml-2">
                            {assistant.callCount} calls
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {loading ? (
          // Loading State
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : !analytics ? (
          // No Data State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <BarChart3 className="h-16 w-16 mx-auto mb-4 vm-text-muted" />
            <h3 className="text-xl font-semibold mb-2 vm-text-primary">No Analytics Data</h3>
            <p className="vm-text-secondary">
              {selectedAssistantId 
                ? 'No call data available for this assistant yet'
                : 'Please select an assistant to view analytics'
              }
            </p>
          </motion.div>
        ) : (
          // Analytics Dashboard
          <div className="space-y-8">
            {/* Key Metrics - Only Total Calls and Avg Duration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-4 md:grid-cols-2"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium vm-text-secondary">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 vm-text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vm-text-primary">{analytics.metrics.totalCalls}</div>
                  <p className="text-xs vm-text-muted">All conversations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium vm-text-secondary">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 vm-text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold vm-text-primary">{analytics.metrics.avgDuration}s</div>
                  <p className="text-xs vm-text-muted">Per conversation</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Structured Questions Table */}
            {analytics.structuredQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Structured Questions Performance</CardTitle>
                    <CardDescription className="text-gray-400">
                      How well your assistant collects structured data from callers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Answer Rate</TableHead>
                          <TableHead>Answered/Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.structuredQuestions.map((question, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{question.question}</TableCell>
                            <TableCell>
                              <Badge variant={question.isRequired ? "default" : "secondary"}>
                                {question.isRequired ? "Yes" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={question.answerRate} className="w-20" />
                                <span className="text-sm font-medium">{question.answerRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm vm-text-secondary">
                                {question.totalAnswered}/{question.totalCalls}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Success Analysis */}
            {Object.keys(analytics.successAnalysis.breakdown).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Success Evaluation Breakdown</CardTitle>
                    <CardDescription className="text-gray-400">
                      Analysis based on {analytics.successAnalysis.rubricType} evaluation criteria
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(analytics.successAnalysis.breakdown).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:border-purple-500/50 transition-colors"
                             style={{ borderColor: 'rgba(75, 85, 99, 0.5)', background: 'rgba(17, 24, 39, 0.3)' }}>
                          <span className="font-medium text-white">{key}</span>
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">{value} calls</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Calls Table with Structured Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Recent Calls</CardTitle>
                  <CardDescription className="text-gray-400">
                    Latest call activity with structured data and evaluations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Caller</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Structured Data</TableHead>
                        <TableHead>Evaluation</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Date/Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentCalls.map((call) => (
                        <TableRow key={call.id}>
                          <TableCell className="font-mono text-sm text-gray-300">{call.callerNumber}</TableCell>
                          <TableCell className="text-gray-300">{call.duration}s</TableCell>
                          <TableCell className="max-w-xs">
                            {/* Display structured data clearly */}
                            <div className="space-y-1">
                              {call.structuredData && typeof call.structuredData === 'object' && Object.keys(call.structuredData).length > 0 ? (
                                Object.entries(call.structuredData).map(([key, value]) => (
                                  <div key={key} className="text-sm">
                                    <span className="font-medium text-gray-400">{key}:</span>{' '}
                                    <span className="text-white">{String(value || '')}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-sm vm-text-muted">No structured data</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <SuccessEvaluationDisplay 
                              evaluation={call.successEvaluation}
                              rubricType={analytics.assistant.evaluationRubric}
                            />
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm">
                              {call.summary ? (
                                <p className="line-clamp-2">{call.summary}</p>
                              ) : (
                                <p className="vm-text-muted">No summary</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm vm-text-muted">
                            <div>
                              <div>{new Date(call.startedAt).toLocaleDateString()}</div>
                              <div className="text-xs">{new Date(call.startedAt).toLocaleTimeString()}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}