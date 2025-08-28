'use client'

import { useState } from 'react'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StructuredQuestion } from '@/lib/structured-data'

interface StructuredQuestionsProps {
  questions: StructuredQuestion[]
  onQuestionsChange: (questions: StructuredQuestion[]) => void
  className?: string
}

export function StructuredQuestions({ questions, onQuestionsChange, className }: StructuredQuestionsProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const addQuestion = () => {
    const newQuestion: StructuredQuestion = {
      id: `question_${Date.now()}`,
      question: '',
      structuredName: '',
      type: 'string',
      description: '',
      required: false
    }
    
    onQuestionsChange([...questions, newQuestion])
    setExpandedQuestion(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<StructuredQuestion>) => {
    const updatedQuestions = questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    )
    onQuestionsChange(updatedQuestions)
  }

  const removeQuestion = (id: string) => {
    const filteredQuestions = questions.filter(q => q.id !== id)
    onQuestionsChange(filteredQuestions)
    if (expandedQuestion === id) {
      setExpandedQuestion(null)
    }
  }

  const generateStructuredName = (question: string) => {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 30)
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-5 w-5" style={{ color: 'var(--vm-secondary-purple)' }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--vm-text-primary)' }}>Structured Questions</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--vm-text-secondary)' }}>
          Define questions to extract specific data from conversations. The AI will analyze responses and store structured information.
        </p>
      </div>

      {/* Questions List */}
      <div className="space-y-4 mb-6">
        {questions.map((question, index) => (
          <Card key={question.id} className="vm-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'var(--vm-primary)' }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base" style={{ color: 'var(--vm-text-primary)' }}>
                      {question.question || `Question ${index + 1}`}
                    </CardTitle>
                    <CardDescription style={{ color: 'var(--vm-text-muted)' }}>
                      Extract as: {question.structuredName || 'field_name'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedQuestion(
                      expandedQuestion === question.id ? null : question.id
                    )}
                  >
                    {expandedQuestion === question.id ? 'Collapse' : 'Edit'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedQuestion === question.id && (
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div className="space-y-2">
                  <Label htmlFor={`question-${question.id}`} className="text-sm font-medium" style={{ color: 'var(--vm-text-primary)' }}>Question *</Label>
                  <Textarea
                    id={`question-${question.id}`}
                    placeholder="e.g., What is your name?"
                    value={question.question}
                    onChange={(e) => {
                      const newQuestion = e.target.value
                      updateQuestion(question.id, { 
                        question: newQuestion,
                        structuredName: question.structuredName || generateStructuredName(newQuestion)
                      })
                    }}
                    className="vm-textarea"
                  />
                  <p className="text-xs" style={{ color: 'var(--vm-text-muted)' }}>
                    The actual question the assistant will ask during the conversation
                  </p>
                </div>

                {/* Structured Name & Type Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${question.id}`} className="text-sm font-medium" style={{ color: 'var(--vm-text-primary)' }}>Structured Name *</Label>
                    <Input
                      id={`name-${question.id}`}
                      placeholder="e.g., customer_name"
                      value={question.structuredName}
                      onChange={(e) => updateQuestion(question.id, { structuredName: e.target.value })}
                      className="vm-input"
                    />
                    <p className="text-xs" style={{ color: 'var(--vm-text-muted)' }}>
                      Field name for storing the extracted data (use snake_case)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`type-${question.id}`} className="text-sm font-medium" style={{ color: 'var(--vm-text-primary)' }}>Data Type</Label>
                    <Select 
                      value={question.type} 
                      onValueChange={(value: 'string' | 'number' | 'boolean') => 
                        updateQuestion(question.id, { type: value })
                      }
                    >
                      <SelectTrigger className="vm-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String (Text)</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs" style={{ color: 'var(--vm-text-muted)' }}>
                      Expected format of the answer
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor={`desc-${question.id}`} className="text-sm font-medium" style={{ color: 'var(--vm-text-primary)' }}>AI Description</Label>
                  <Textarea
                    id={`desc-${question.id}`}
                    placeholder="e.g., Extract the customer's full name from their response"
                    value={question.description}
                    onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                    className="vm-textarea"
                  />
                  <p className="text-xs" style={{ color: 'var(--vm-text-muted)' }}>
                    Instructions for the AI on how to extract and format this data
                  </p>
                </div>

                {/* Required Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`required-${question.id}`}
                    checked={question.required}
                    onCheckedChange={(checked) => updateQuestion(question.id, { required: !!checked })}
                  />
                  <Label 
                    htmlFor={`required-${question.id}`} 
                    className="cursor-pointer font-medium"
                    style={{ color: 'var(--vm-text-primary)' }}
                  >
                    Mark as required
                  </Label>
                </div>
                <p className="text-xs ml-6" style={{ color: 'var(--vm-text-muted)' }}>
                  If checked, the assistant will ensure this information is collected during the call
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Add Question Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        className="w-full vm-button-secondary"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Question
      </Button>

      {/* Questions Summary */}
      {questions.length > 0 && (
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--vm-surface-elevated)' }}>
          <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--vm-text-primary)' }}>
            Questions Summary ({questions.length} total):
          </h4>
          <div className="space-y-2">
            {questions.map((question, index) => (
              <div key={question.id} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--vm-text-primary)' }}>
                  {index + 1}. {question.question || 'Untitled Question'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded font-medium" style={{ 
                    background: 'var(--vm-secondary-purple)', 
                    color: '#FFFFFF' 
                  }}>
                    {question.type}
                  </span>
                  {question.required && (
                    <span className="text-xs px-2 py-1 rounded font-medium" style={{ 
                      background: 'var(--vm-warning-amber)', 
                      color: '#FFFFFF' 
                    }}>
                      Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}