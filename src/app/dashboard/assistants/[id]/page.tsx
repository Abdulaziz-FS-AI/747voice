'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Building, Clock, Globe, Edit, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth-context'
import type { Database } from '@/types/database'

type Assistant = Database['public']['Tables']['assistants']['Row'] & {
  assistant_questions: Database['public']['Tables']['assistant_questions']['Row'][]
}

export default function AssistantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [loading, setLoading] = useState(true)

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
                  <span className="text-sm font-medium">{assistant.language || 'en-US'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Duration</span>
                  <span className="text-sm font-medium">{assistant.max_call_duration}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
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
                      <span className="font-medium">{assistant.agent_name || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{assistant.company_name || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Tone:</span>
                      <Badge variant="outline" className="capitalize">
                        {assistant.tone || assistant.personality}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Voice ID:</span>
                      <span className="font-mono text-xs">{assistant.voice_id || 'default'}</span>
                    </div>
                  </div>
                </div>
                {assistant.custom_instructions && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Custom Instructions</h4>
                    <p className="text-sm text-muted-foreground">
                      {assistant.custom_instructions}
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
                  {assistant.system_prompt || assistant.generated_system_prompt || 'No system prompt configured'}
                </pre>
              </CardContent>
            </Card>
            {assistant.first_message && (
              <Card>
                <CardHeader>
                  <CardTitle>First Message</CardTitle>
                  <CardDescription>
                    How your assistant greets callers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{assistant.first_message}</p>
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
                {assistant.assistant_questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No questions configured
                  </p>
                ) : (
                  <div className="space-y-4">
                    {assistant.assistant_questions
                      .sort((a, b) => a.display_order - b.display_order)
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
                            <p>{question.answer_description}</p>
                            <div className="flex gap-4 text-xs">
                              <span>Field: <code>{question.structured_field_name}</code></span>
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
        </Tabs>
      </div>
    </DashboardLayout>
  )
}