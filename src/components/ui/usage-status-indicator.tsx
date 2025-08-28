'use client'

import { useUsageLimits } from '@/hooks/use-usage-limits'
import { AlertTriangle, Lock, Clock, Bot, Zap, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface UsageStatusIndicatorProps {
  variant?: 'compact' | 'detailed' | 'card'
  className?: string
}

export function UsageStatusIndicator({ variant = 'compact', className = '' }: UsageStatusIndicatorProps) {
  const {
    usage,
    loading,
    canCreateAssistant,
    canMakeCall,
    isAtAssistantLimit,
    isOverMinuteLimit,
    getAssistantLimitMessage,
    getUsageWarningMessage
  } = useUsageLimits()

  if (loading || !usage) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-6 bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {/* Assistant Usage */}
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Assistants</div>
          <div className={`text-sm font-bold flex items-center gap-1 ${
            isAtAssistantLimit ? 'text-red-400' : 
            usage.assistants.count >= usage.assistants.limit * 0.8 ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            <Bot className="h-3 w-3" />
            {usage.assistants.count}/{usage.assistants.limit}
            {isAtAssistantLimit && <Lock className="h-3 w-3" />}
          </div>
        </div>

        {/* Minutes Usage */}
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Minutes</div>
          <div className={`text-sm font-bold flex items-center gap-1 ${
            isOverMinuteLimit ? 'text-red-400' : 
            usage.minutes.percentage >= 80 ? 'text-yellow-400' : 
            'text-green-400'
          }`}>
            <Clock className="h-3 w-3" />
            {usage.minutes.used.toFixed(1)}/{usage.minutes.limit}
            {isOverMinuteLimit && <Lock className="h-3 w-3" />}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-200">Usage Overview</h3>
            <Badge variant={
              usage.account_status === 'SUSPENDED' ? 'destructive' :
              usage.account_status === 'OVER_LIMIT' ? 'destructive' :
              usage.account_status === 'AT_ASSISTANT_LIMIT' ? 'destructive' :
              usage.account_status === 'WARNING' ? 'secondary' :
              'default'
            }>
              {usage.account_status || 'NORMAL'}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Assistant Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">AI Assistants</span>
                </div>
                <span className={`text-sm font-bold ${
                  isAtAssistantLimit ? 'text-red-400' : 'text-gray-200'
                }`}>
                  {usage.assistants.count}/{usage.assistants.limit}
                </span>
              </div>
              <Progress 
                value={(usage.assistants.count / usage.assistants.limit) * 100} 
                className="h-2"
              />
              {isAtAssistantLimit && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400">Limit reached</span>
                </div>
              )}
            </div>

            {/* Minutes Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Monthly Minutes</span>
                </div>
                <span className={`text-sm font-bold ${
                  isOverMinuteLimit ? 'text-red-400' : 'text-gray-200'
                }`}>
                  {usage.minutes.used.toFixed(1)}/{usage.minutes.limit}
                </span>
              </div>
              <Progress 
                value={usage.minutes.percentage} 
                className="h-2"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {usage.minutes.remaining.toFixed(1)} remaining
                </span>
                <span className="text-xs text-gray-400">
                  {usage.minutes.percentage.toFixed(1)}%
                </span>
              </div>
              {isOverMinuteLimit && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400">Usage limit exceeded</span>
                </div>
              )}
            </div>

            {/* Action Status */}
            <div className="pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    canCreateAssistant ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-gray-400">Can create assistants</span>
                </div>
                <span className={canCreateAssistant ? 'text-green-400' : 'text-red-400'}>
                  {canCreateAssistant ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    canMakeCall ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-gray-400">Can make calls</span>
                </div>
                <span className={canMakeCall ? 'text-green-400' : 'text-red-400'}>
                  {canMakeCall ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Upgrade Prompt */}
            {usage.assistants.limit <= 3 && (isAtAssistantLimit || usage.minutes.percentage > 75) && (
              <div className="mt-3 p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-purple-300 font-medium">
                    Upgrade to Pro: 10 assistants, 100 minutes
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">Usage Status</h3>
        <Badge variant={
          usage.account_status === 'SUSPENDED' ? 'destructive' :
          usage.account_status === 'OVER_LIMIT' ? 'destructive' :
          usage.account_status === 'AT_ASSISTANT_LIMIT' ? 'destructive' :
          usage.account_status === 'WARNING' ? 'secondary' :
          'default'
        }>
          {usage.account_status || 'NORMAL'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Assistant Usage */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-300">Assistants</span>
          </div>
          <div className="text-lg font-bold">
            {usage.assistants.count}/{usage.assistants.limit}
          </div>
          <Progress 
            value={(usage.assistants.count / usage.assistants.limit) * 100} 
            className="h-2"
          />
          {isAtAssistantLimit && (
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-red-400" />
              <span className="text-xs text-red-400">At limit</span>
            </div>
          )}
        </div>

        {/* Minutes Usage */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-gray-300">Minutes</span>
          </div>
          <div className="text-lg font-bold">
            {usage.minutes.used.toFixed(1)}/{usage.minutes.limit}
          </div>
          <Progress 
            value={usage.minutes.percentage} 
            className="h-2"
          />
          <div className="text-xs text-gray-400">
            {usage.minutes.remaining.toFixed(1)} remaining ({usage.minutes.percentage.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Warning Messages */}
      {(getAssistantLimitMessage() || getUsageWarningMessage()) && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">
              {getAssistantLimitMessage() || getUsageWarningMessage()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}