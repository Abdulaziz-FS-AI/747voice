'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Loader2, Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ModelSelector } from '@/components/assistants/model-selector'
import { VoiceSelector } from '@/components/assistants/voice-selector'
import { PersonalitySelector } from '@/components/assistants/personality-selector'
import { StructuredQuestions } from '@/components/assistants/structured-questions'
import { EvaluationSelector } from '@/components/assistants/evaluation-selector'
import { MessageType } from '@/components/assistants/client-messages-selector'
import { StructuredQuestion, EvaluationRubric } from '@/lib/structured-data'
import { useEnforcedAction } from '@/hooks/use-enforced-action'

// Form data interface
interface AssistantFormData {
  name: string
  company_name?: string
  personality_traits: string[]
  model_id: string
  voice_id: string
  max_call_duration: number
  first_message?: string
  first_message_mode: 'assistant-speaks-first' | 'user-speaks-first'
  background_sound: 'off' | 'office'
  structured_questions: StructuredQuestion[]
  evaluation_rubric: EvaluationRubric | null
  client_messages: MessageType[]
}



const backgroundSoundOptions = [
  { value: 'off', label: 'No Background Sound' },
  { value: 'office', label: 'Office Environment' }
]

interface CreateAssistantFormProps {
  templateData?: {
    templateId?: string
    name: string
    category: string
    config: any
    placeholders: any
  } | null
  onCancel?: () => void
}

export function CreateAssistantForm({ templateData, onCancel }: CreateAssistantFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Usage enforcement for assistant creation
  const { executeAction, canPerform, isChecking, getAssistantLimitMessage } = useEnforcedAction({
    actionType: 'assistants',
    onSuccess: () => {} // Will be handled in form submit
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AssistantFormData>({
    defaultValues: {
      name: templateData?.placeholders?.name || '',
      company_name: templateData?.placeholders?.company_name || '',
      personality_traits: templateData?.config?.personality_traits || ['professional'],
      model_id: templateData?.config?.model_id || 'gpt-4.1-mini-2025-04-14', // Default recommended model
      voice_id: templateData?.config?.voice_id || 'Elliot', // Default voice
      max_call_duration: templateData?.config?.max_call_duration || 300, // 5 minutes default
      first_message: templateData?.config?.first_message || 'Hello! How can I help you today?',
      first_message_mode: templateData?.config?.first_message_mode || 'assistant-speaks-first',
      background_sound: templateData?.config?.background_sound || 'office',
      structured_questions: templateData?.config?.structured_questions || [],
      evaluation_rubric: templateData?.config?.evaluation_rubric || null,
      // client_messages removed - handled by backend with fixed values
    }
  })

  // Watch form values for preview
  const formValues = watch()

  const onSubmit = async (data: AssistantFormData) => {
    console.log('🚀 [FORM] Form submitted with data:', data)
    
    // Check if user can create assistant
    const canProceed = await executeAction();
    if (!canProceed) {
      return; // Upgrade modal will be shown
    }
    
    setIsLoading(true)
    
    try {
      // Manual validation
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Assistant name is required')
      }
      
      // Ensure data matches API schema
      const submitData = {
        name: data.name.trim(),
        company_name: data.company_name || undefined,
        personality: data.personality_traits?.[0] || 'professional', // Use first trait for legacy API
        personality_traits: data.personality_traits || ['professional'],
        model_id: data.model_id || 'gpt-4.1-mini-2025-04-14',
        voice_id: data.voice_id || 'Elliot',
        max_call_duration: Number(data.max_call_duration) || 300,
        first_message: data.first_message || 'Hello! How can I help you today?',
        first_message_mode: data.first_message_mode || 'assistant-speaks-first',
        background_sound: data.background_sound || 'office',
        structured_questions: data.structured_questions || [],
        evaluation_rubric: data.evaluation_rubric || null,
        // client_messages removed - handled by backend with fixed values
        template_id: templateData?.templateId || undefined
      }
      
      console.log('📤 [FORM] Submitting assistant data:', submitData)
      console.log('📤 [FORM] Current URL:', window.location.href)
      console.log('📤 [FORM] Making fetch request to /api/assistants')
      
      const response = await fetch('/api/assistants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      console.log('📥 [FORM] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      })

      let result
      try {
        const responseText = await response.text()
        console.log('📥 [FORM] Raw response text:', responseText)
        result = JSON.parse(responseText)
        console.log('📥 [FORM] Parsed response:', result)
      } catch (parseError) {
        console.error('❌ [FORM] Failed to parse response as JSON:', parseError)
        throw new Error(`Invalid response from server. Status: ${response.status}, Text: ${await response.text()}`)
      }

      // Check if assistant was created (even if voice service failed)
      if (result.success || (result.error?.assistantId)) {
        console.log('✅ [FORM] Assistant creation successful!')
        console.log('✅ [FORM] Result data:', result.data || result.error?.assistantId)
        
        toast({
          title: '🎉 Assistant Created Successfully!',
          description: `${data.name} has been created and is ready to use.`,
          variant: 'default'
        })
        
        // Show success for longer, then redirect
        setTimeout(() => {
          console.log('🔄 [FORM] Redirecting to assistants dashboard...')
          router.push('/dashboard/assistants')
          router.refresh() // Force refresh to show new assistant
        }, 2000)
      } else {
        console.error('❌ [FORM] Assistant creation failed:', result)
        console.error('❌ [FORM] Error details:', {
          success: result.success,
          error: result.error,
          errorCode: result.error?.code,
          errorMessage: result.error?.message,
          errorDetails: result.error?.details
        })
        throw new Error(result.error?.message || 'Failed to create assistant')
      }
    } catch (error) {
      console.error('❌ [FORM] Error creating assistant:', error)
      console.error('❌ [FORM] Error type:', typeof error)
      console.error('❌ [FORM] Error name:', error instanceof Error ? error.name : 'Unknown')
      console.error('❌ [FORM] Error message:', error instanceof Error ? error.message : String(error))
      console.error('❌ [FORM] Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--vm-void)' }}>
      {/* Professional Header */}
      <div className="border-b" style={{ borderColor: 'var(--vm-border-subtle)', background: 'var(--vm-surface)' }}>
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--vm-pure)' }}>
                Create New Assistant
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--vm-gray-400)' }}>
                Set up your AI voice assistant in just a few steps
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-full text-xs font-medium" 
                   style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--vm-emerald)' }}>
                Step 1 of 1
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Limit Warning */}
        {!canPerform && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Lock className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-1">Assistant Creation Blocked</h3>
                <p className="text-sm text-red-300">{getAssistantLimitMessage()}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Configuration Section */}
          <div className="rounded-xl p-6" style={{ background: 'var(--vm-surface)', border: '1px solid var(--vm-border-subtle)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, var(--vm-orange-primary), var(--vm-orange-light))' }}>
                <span className="text-white text-sm font-semibold">1</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--vm-pure)' }}>
                  Basic Configuration
                </h2>
                <p className="text-sm" style={{ color: 'var(--vm-gray-400)' }}>
                  Essential settings for your AI assistant
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--vm-gray-100)' }}>
                    Assistant Name *
                  </Label>
                  <Input
                    placeholder="Enter assistant name"
                    {...register('name', { required: 'Assistant name is required' })}
                    className="vm-input h-11"
                  />
                  {errors.name && (
                    <p className="text-xs mt-1" style={{ color: 'var(--vm-error)' }}>{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--vm-gray-100)' }}>
                    Company Name
                  </Label>
                  <Input
                    placeholder="Enter company name (optional)"
                    {...register('company_name')}
                    className="vm-input h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--vm-gray-100)' }}>
                    First Message *
                  </Label>
                  <Textarea
                    placeholder="Hello! How can I help you today?"
                    {...register('first_message', { required: 'First message is required' })}
                    rows={3}
                    className="vm-textarea resize-none"
                  />
                  {errors.first_message && (
                    <p className="text-xs mt-1" style={{ color: 'var(--vm-error)' }}>{errors.first_message.message}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--vm-gray-100)' }}>
                    AI Model
                  </Label>
                  <div className="p-4 rounded-lg" style={{ background: 'var(--vm-void)', border: '1px solid var(--vm-border-subtle)' }}>
                    <ModelSelector
                      selectedModel={formValues.model_id}
                      onModelSelect={(modelId) => setValue('model_id', modelId)}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--vm-gray-100)' }}>
                    Call Settings
                  </Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="assistant_speaks_first"
                        checked={formValues.first_message_mode === 'assistant-speaks-first'}
                        onCheckedChange={(checked) => 
                          setValue('first_message_mode', checked ? 'assistant-speaks-first' : 'user-speaks-first')
                        }
                        className="vm-focus-ring"
                      />
                      <Label htmlFor="assistant_speaks_first" className="text-sm cursor-pointer" style={{ color: 'var(--vm-gray-300)' }}>
                        Assistant speaks first
                      </Label>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm" style={{ color: 'var(--vm-gray-300)' }}>Max Call Duration</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--vm-orange-primary)' }}>
                          {Math.floor(formValues.max_call_duration / 60)}:{(formValues.max_call_duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <Slider
                        value={[formValues.max_call_duration]}
                        onValueChange={([value]) => setValue('max_call_duration', value)}
                        max={600}
                        min={30}
                        step={30}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-sm mb-2 block" style={{ color: 'var(--vm-gray-300)' }}>Background Sound</Label>
                      <Select value={formValues.background_sound} onValueChange={(value) => setValue('background_sound', value as 'off' | 'office')}>
                        <SelectTrigger className="vm-input h-11">
                          <SelectValue placeholder="Select background sound" />
                        </SelectTrigger>
                        <SelectContent>
                          {backgroundSoundOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Voice & Personality Section */}
          <div className="rounded-xl p-6" style={{ background: 'var(--vm-surface)', border: '1px solid var(--vm-border-subtle)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, var(--vm-emerald), var(--vm-cyan))' }}>
                <span className="text-white text-sm font-semibold">2</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--vm-pure)' }}>
                  Voice & Personality
                </h2>
                <p className="text-sm" style={{ color: 'var(--vm-gray-400)' }}>
                  Customize your assistant's voice and personality traits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--vm-gray-100)' }}>
                  Voice Selection
                </Label>
                <VoiceSelector
                  selectedVoice={formValues.voice_id}
                  onVoiceSelect={(voiceId) => setValue('voice_id', voiceId)}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--vm-gray-100)' }}>
                  Personality Traits
                </Label>
                <div className="p-4 rounded-lg" style={{ background: 'var(--vm-void)', border: '1px solid var(--vm-border-subtle)' }}>
                  <PersonalitySelector
                    selectedTraits={formValues.personality_traits || []}
                    onTraitsChange={(traits) => setValue('personality_traits', traits)}
                    maxSelections={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features Section */}
          <div className="rounded-xl p-6" style={{ background: 'var(--vm-surface)', border: '1px solid var(--vm-border-subtle)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, var(--vm-violet), var(--vm-violet-light))' }}>
                <span className="text-white text-sm font-semibold">3</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--vm-pure)' }}>
                  Advanced Features
                </h2>
                <p className="text-sm" style={{ color: 'var(--vm-gray-400)' }}>
                  Configure data collection and performance evaluation
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--vm-gray-100)' }}>
                  Structured Questions
                </Label>
                <div className="p-4 rounded-lg" style={{ background: 'var(--vm-void)', border: '1px solid var(--vm-border-subtle)' }}>
                  <StructuredQuestions
                    questions={formValues.structured_questions || []}
                    onQuestionsChange={(questions) => setValue('structured_questions', questions)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block" style={{ color: 'var(--vm-gray-100)' }}>
                  Performance Evaluation
                </Label>
                <div className="p-4 rounded-lg" style={{ background: 'var(--vm-void)', border: '1px solid var(--vm-border-subtle)' }}>
                  <EvaluationSelector
                    selectedRubric={formValues.evaluation_rubric}
                    onRubricChange={(rubric) => setValue('evaluation_rubric', rubric)}
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6" style={{ borderTop: '1px solid var(--vm-border-subtle)' }}>
            <Button
              type="button"
              onClick={onCancel || (() => router.back())}
              disabled={isLoading}
              variant="outline"
              className="px-6 h-11"
              style={{ borderColor: 'var(--vm-border-default)', color: 'var(--vm-gray-300)' }}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isLoading || !canPerform || isChecking} 
              className={`px-8 h-11 font-medium ${
                !canPerform ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ 
                background: canPerform 
                  ? 'var(--vm-gradient-primary)' 
                  : 'linear-gradient(135deg, #6b7280 0%, #374151 100%)', 
                color: 'white',
                boxShadow: canPerform 
                  ? '0 4px 12px rgba(139, 92, 246, 0.25)'
                  : '0 4px 12px rgba(107, 114, 128, 0.25)'
              }}
            >
              {(isLoading || isChecking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!canPerform && <Lock className="mr-2 h-4 w-4" />}
              {isLoading ? 'Creating Assistant...' : 
               isChecking ? 'Checking Limits...' :
               !canPerform ? 'Limit Reached' : 'Create Assistant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}