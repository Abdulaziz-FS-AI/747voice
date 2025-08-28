'use client'

import { useState } from 'react'
import { useUsageLimits } from './use-usage-limits'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Sparkles } from 'lucide-react'

interface UseEnforcedActionOptions {
  actionType: 'assistants' | 'minutes';
  onSuccess: () => void | Promise<void>;
  customMessage?: string;
}

export function useEnforcedAction({ 
  actionType, 
  onSuccess,
  customMessage 
}: UseEnforcedActionOptions) {
  const { 
    usage, 
    loading, 
    canCreateAssistant, 
    canMakeCall, 
    getAssistantLimitMessage,
    getUsageWarningMessage,
    refreshUsage 
  } = useUsageLimits()
  
  const [isChecking, setIsChecking] = useState(false)

  // Debug logging removed for production

  const canPerform = () => {
    // If still loading, allow action (will be checked again on submit)
    if (loading) return true
    
    if (actionType === 'assistants') return canCreateAssistant
    if (actionType === 'minutes') return canMakeCall
    return true
  }

  const executeAction = async () => {
    setIsChecking(true)
    
    try {
      // Refresh usage data to get latest limits
      await refreshUsage()
      
      // Check if action is allowed
      if (actionType === 'assistants' && !canCreateAssistant) {
        const message = getAssistantLimitMessage()
        
        toast({
          title: "Assistant Limit Reached",
          description: (
            <div className="space-y-3">
              <p className="text-sm">{message}</p>
              {usage?.assistants.limit === 3 && (
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-purple-300">
                    Upgrade to Pro for 10 assistants
                  </span>
                </div>
              )}
            </div>
          ),
          variant: "destructive",
          duration: 6000
        })
        return false
      }
      
      if (actionType === 'minutes' && !canMakeCall) {
        const warningMessage = getUsageWarningMessage()
        
        toast({
          title: "Usage Limit Exceeded",
          description: (
            <div className="space-y-3">
              <p className="text-sm">{warningMessage || 'You have exceeded your monthly usage limit.'}</p>
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-orange-300">
                  Upgrade your plan or wait for next month's reset
                </span>
              </div>
            </div>
          ),
          variant: "destructive",
          duration: 6000
        })
        return false
      }
      
      // Execute the action if allowed
      await onSuccess()
      return true
      
    } catch (error) {
      console.error('Action failed:', error)
      toast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      })
      return false
    } finally {
      setIsChecking(false)
    }
  }

  return {
    executeAction,
    canPerform: canPerform(),
    isChecking,
    loading,
    usage,
    getAssistantLimitMessage,
    getUsageWarningMessage
  }
}