'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Phone, Building, Clock, Globe, Edit, Power, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Skeleton } from '@/components/ui/skeleton'

interface Assistant {
  id: string
  user_id: string
  name: string
  template_id: string | null
  vapi_assistant_id: string
  config: any
  is_active: boolean
  created_at: string
  updated_at: string
  assistant_questions?: Array<{
    id: string
    assistant_id: string
    question_text: string
    field_name: string
    field_type: string
    description: string | null
    is_required: boolean
    validation_rules: any | null
    order_index: number
    created_at: string
    updated_at: string
  }>
}

export default function AssistantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchAssistant()
  }, [user, params.id])

  const fetchAssistant = async () => {
    try {
      const response = await fetch(`/api/assistants/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setAssistant(data.data)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch assistant:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!assistant?.id) return
    
    try {
      setAnalyticsLoading(true)
      const response = await fetch(`/api/analytics/assistant/${assistant.id}`)
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const onTabChange = (value: string) => {
    if (value === 'analytics' && !analyticsData && !analyticsLoading) {
      fetchAnalytics()
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!assistant) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{assistant.name}</h1>
              <p className="text-muted-foreground">
                Created {new Date(assistant.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/assistants/${assistant.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={assistant.is_active ? "default" : "secondary"}>
                    {assistant.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deployment</span>
                  {assistant.vapi_assistant_id ? (
                    <Badge variant="outline" className="text-xs">
                      <Power className="mr-1 h-3 w-3" />
                      Deployed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Deployed</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <span className="text-sm font-medium">{assistant.config?.language || 'en-US'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Duration</span>
                  <span className="text-sm font-medium">{assistant.config?.maxCallDuration || 1800}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4" onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assistant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Agent Name:</span>
                      <span className="font-medium">{assistant.config?.agentName || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{assistant.config?.companyName || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tone:</span>
                      <Badge variant="outline" className="capitalize">
                        {assistant.config?.tone || assistant.config?.personality || 'professional'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Voice ID:</span>
                      <span className="font-mono text-xs">{assistant.config?.voiceId || 'Paige'}</span>
                    </div>
                  </div>
                </div>
                {assistant.config?.customInstructions && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Custom Instructions</h4>
                    <p className="text-sm text-muted-foreground">
                      {assistant.config?.customInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>
                  The instructions that guide your assistant's behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {assistant.config?.systemPrompt || assistant.config?.generatedSystemPrompt || 'No system prompt configured'}
                </pre>
              </CardContent>
            </Card>
            {assistant.config?.firstMessage && (
              <Card>
                <CardHeader>
                  <CardTitle>First Message</CardTitle>
                  <CardDescription>
                    How your assistant greets callers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{assistant.config?.firstMessage}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Structured Questions</CardTitle>
                <CardDescription>
                  Questions your assistant asks to collect information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(!assistant.assistant_questions || assistant.assistant_questions.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No questions configured
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assistant.assistant_questions
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">
                              {index + 1}. {question.question_text}
                            </h4>
                            {question.is_required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{question.description}</p>
                            <div className="flex gap-4 text-xs">
                              <span>Field: <code>{question.field_name}</code></span>
                              <span>Type: {question.field_type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {analyticsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Analytics Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData?.totalCalls || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.round(analyticsData?.avgDuration || 0)}s</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.round(analyticsData?.successRate || 0)}%</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Calls */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Calls</CardTitle>
                    <CardDescription>
                      Latest call activity for this assistant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!analyticsData?.recentCalls || analyticsData.recentCalls.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No calls yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {analyticsData.recentCalls.map((call: any, index: number) => (
                          <div key={call.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{call.caller_number}</span>
                                <Badge variant={call.success_evaluation ? "default" : "secondary"}>
                                  {call.success_evaluation ? "Success" : "Pending"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {call.duration_seconds}s
                                </span>
                                <span>{new Date(call.started_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {call.structured_data && (
                              <div className="text-right">
                                <div className="text-sm font-medium">Data Collected</div>
                                <div className="text-xs text-muted-foreground">
                                  {Object.keys(call.structured_data).length} fields
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dynamic Questions Analytics */}
                {analyticsData?.questionAnalytics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Question Performance</CardTitle>
                      <CardDescription>
                        Success rates for structured questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analyticsData.questionAnalytics).map(([fieldName, stats]: [string, any]) => (
                          <div key={fieldName} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">
                                {fieldName.replace(/_/g, ' ')}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {stats.answeredCount}/{stats.totalAsked} answered
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(stats.answeredCount / stats.totalAsked) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}