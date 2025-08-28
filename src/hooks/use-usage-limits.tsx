'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { toast } from '@/hooks/use-toast'

interface UsageData {
  minutes: {
    used: number
    limit: number
    percentage: number
    remaining: number
    canMakeCall: boolean
  }
  assistants: {
    count: number
    limit: number
    canCreateAssistant: boolean
  }
  account_status?: 'NORMAL' | 'WARNING' | 'OVER_LIMIT' | 'AT_ASSISTANT_LIMIT' | 'SUSPENDED'
}

export function useUsageLimits() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!user) {
      // No user found, using default values
      // Set default values when no user (match actual demo limits)
      setUsage({
        minutes: { used: 0, limit: 10, percentage: 0, remaining: 10, canMakeCall: true },
        assistants: { count: 0, limit: 3, canCreateAssistant: true },
        account_status: 'NORMAL'
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/usage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Always get fresh data
      })

      if (!response.ok) {
        console.error('[useUsageLimits] API returned error:', response.status, response.statusText)
        // Set default values if API fails (match actual demo limits)
        setUsage({
          minutes: { used: 0, limit: 10, percentage: 0, remaining: 10, canMakeCall: true },
          assistants: { count: 0, limit: 3, canCreateAssistant: true },
          account_status: 'NORMAL'
        })
        throw new Error(`Failed to fetch usage data: ${response.statusText}`)
      }

      const data = await response.json()
      
      // API response received
      
      if (data.success) {
        setUsage(data.data)
      } else {
        // Set default values if API fails (match actual demo limits)
        setUsage({
          minutes: { used: 0, limit: 10, percentage: 0, remaining: 10, canMakeCall: true },
          assistants: { count: 0, limit: 3, canCreateAssistant: true },
          account_status: 'NORMAL'
        })
        throw new Error(data.error?.message || 'Failed to fetch usage data')
      }
    } catch (err) {
      console.error('Error fetching usage:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch usage data on mount and when user changes
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Auto-refresh usage data every 30 seconds to keep it current
  useEffect(() => {
    if (!user) return

    const interval = setInterval(fetchUsage, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [fetchUsage, user])

  // Default to true while loading, let the server check enforce the actual limit
  const canCreateAssistant = loading ? true : (usage?.assistants?.canCreateAssistant ?? false)
  const canMakeCall = loading ? true : (usage?.minutes?.canMakeCall ?? false)
  const isAtAssistantLimit = !canCreateAssistant
  const isOverMinuteLimit = !canMakeCall

  const getAssistantLimitMessage = () => {
    if (!usage) return ''
    
    if (usage.account_status === 'SUSPENDED') {
      return 'Account suspended - contact support to create assistants'
    }
    
    if (isAtAssistantLimit) {
      return `Assistant limit reached (${usage.assistants.count}/${usage.assistants.limit}). Upgrade your plan or delete existing assistants.`
    }
    
    const remaining = usage.assistants.limit - usage.assistants.count
    if (remaining <= 1) {
      return `Only ${remaining} assistant slot remaining`
    }
    
    return ''
  }

  const getUsageWarningMessage = () => {
    if (!usage) return ''
    
    if (usage.account_status === 'OVER_LIMIT') {
      return 'Usage limit exceeded - new assistants may be suspended'
    }
    
    if (usage.account_status === 'WARNING') {
      return `Warning: ${usage.minutes.remaining.toFixed(1)} minutes remaining`
    }
    
    return ''
  }

  return {
    usage,
    loading,
    error,
    refreshUsage: fetchUsage,
    canCreateAssistant,
    canMakeCall,
    isAtAssistantLimit,
    isOverMinuteLimit,
    getAssistantLimitMessage,
    getUsageWarningMessage
  }
}