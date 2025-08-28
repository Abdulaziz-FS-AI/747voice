'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Clock, Users, Zap, Timer } from 'lucide-react'
import { DEMO_LIMITS } from '@/types/database'

interface DemoStatus {
  currentUsageMinutes: number
  maxMinutesTotal: number
  remainingMinutes: number
  usagePercentage: number
  activeAssistants: number
  maxAssistants: number
  remainingAssistantSlots: number
  usageLimitReached: boolean
  assistantLimitReached: boolean
  anyLimitReached: boolean
  warningLevel: 'normal' | 'warning' | 'critical'
  assistants: Array<{
    id: string
    name: string
    usageMinutes: number
    daysUntilExpiry: number
    isExpiredByTime: boolean
    isExpiredByUsage: boolean
  }>
}

export function DemoStatusCard() {
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchDemoStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/demo-status')
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error?.message || 'Failed to fetch demo status')
        }

        setDemoStatus(data.data)
      } catch (err) {
        console.error('Failed to fetch demo status:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDemoStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDemoStatus, 30000)
    return () => clearInterval(interval)
  }, [mounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Demo Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Demo Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !demoStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Demo Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            {error || 'Unable to load demo status'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    if (demoStatus.anyLimitReached) {
      return <Badge variant="destructive">Limit Reached</Badge>
    }
    if (demoStatus.warningLevel === 'warning') {
      return <Badge variant="secondary">Warning</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Demo Account Status
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Usage</span>
            </div>
            <span className="text-sm text-gray-500">
              {demoStatus.currentUsageMinutes}/{demoStatus.maxMinutesTotal} minutes
            </span>
          </div>
          <Progress 
            value={demoStatus.usagePercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{demoStatus.remainingMinutes} minutes remaining</span>
            <span>{demoStatus.usagePercentage}% used</span>
          </div>
        </div>

        {/* Assistant Count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Assistants</span>
            </div>
            <span className="text-sm text-gray-500">
              {demoStatus.activeAssistants}/{demoStatus.maxAssistants} created
            </span>
          </div>
          <Progress 
            value={(demoStatus.activeAssistants / demoStatus.maxAssistants) * 100} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{demoStatus.remainingAssistantSlots} slots remaining</span>
            <span>{Math.round((demoStatus.activeAssistants / demoStatus.maxAssistants) * 100)}% used</span>
          </div>
        </div>

        {/* Warning Messages */}
        {demoStatus.anyLimitReached && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-800">Demo Limits Reached</p>
              <p className="text-red-600">
                {demoStatus.usageLimitReached && 'Usage limit exceeded. '}
                {demoStatus.assistantLimitReached && 'Assistant limit reached. '}
                All assistants have been automatically deleted.
              </p>
            </div>
          </div>
        )}

        {demoStatus.warningLevel === 'warning' && !demoStatus.anyLimitReached && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Approaching Limits</p>
              <p className="text-yellow-600">
                You're nearing your demo limits. Assistants will be automatically deleted when limits are reached.
              </p>
            </div>
          </div>
        )}

        {/* Demo Info */}
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Demo Limits</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="text-center">
              <div className="font-medium">{DEMO_LIMITS.MAX_ASSISTANTS}</div>
              <div>Max Assistants</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{DEMO_LIMITS.MAX_MINUTES_TOTAL} min</div>
              <div>Total Usage</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{DEMO_LIMITS.MAX_LIFETIME_DAYS} days</div>
              <div>Max Lifespan</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}