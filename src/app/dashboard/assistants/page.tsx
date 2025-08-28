'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useUsageLimits } from '@/hooks/use-usage-limits'
import { Plus, Search, Edit, Trash2, MoreVertical, Bot, Zap, Sparkles, RefreshCw, Lock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DashboardLayout } from '@/components/dashboard/layout'
import { EditAssistantModal } from '@/components/assistants/edit-assistant-modal'
import { DeleteAssistantModal } from '@/components/assistants/delete-assistant-modal'
import { useToast } from '@/hooks/use-toast'
import { motion, useScroll, useTransform } from 'framer-motion'

interface Assistant {
  id: string
  user_id: string
  name: string
  template_id: string | null
  vapi_assistant_id: string
  config: any
  assistant_state: 'active' | 'expired' | 'deleted'
  created_at: string
  updated_at: string
}

export default function AssistantsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const { 
    usage, 
    loading: usageLoading, 
    canCreateAssistant, 
    isAtAssistantLimit,
    getAssistantLimitMessage 
  } = useUsageLimits()
  
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [syncing, setSyncing] = useState(false)
  const [filteredAssistants, setFilteredAssistants] = useState<Assistant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active'>('all')
  
  // Modal states
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchAssistants()
  }, [user])

  useEffect(() => {
    filterAssistants()
  }, [assistants, searchQuery, statusFilter])

  const fetchAssistants = async () => {
    try {
      setLoading(true)
      console.log('🔄 [ASSISTANTS] Fetching assistants...')
      
      const response = await fetch('/api/assistants', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Always get fresh data
      })
      
      console.log('📥 [ASSISTANTS] Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [ASSISTANTS] API error:', errorText)
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('📥 [ASSISTANTS] Response data:', data)
      
      if (data.success) {
        const assistantsData = data.data || []
        console.log('✅ [ASSISTANTS] Loaded', assistantsData.length, 'assistants')
        setAssistants(assistantsData)
      } else {
        console.error('❌ [ASSISTANTS] API returned error:', data.error)
        toast({
          title: 'Error Loading Assistants',
          description: data.error?.message || 'Failed to fetch assistants',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ [ASSISTANTS] Failed to fetch assistants:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch assistants',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAssistants = () => {
    let filtered = assistants

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(assistant =>
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.config?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter - only show active assistants (demo system)
    filtered = filtered.filter(assistant => assistant.assistant_state === 'active')

    setFilteredAssistants(filtered)
  }


  const handleEdit = (assistant: Assistant) => {
    setSelectedAssistant(assistant)
    setIsEditModalOpen(true)
  }

  const handleDelete = (assistant: Assistant) => {
    setSelectedAssistant(assistant)
    setIsDeleteModalOpen(true)
  }

  const handleEditSuccess = (updatedAssistant: Assistant) => {
    setAssistants(prev => 
      prev.map(a => a.id === updatedAssistant.id ? updatedAssistant : a)
    )
    setIsEditModalOpen(false)
    setSelectedAssistant(null)
    toast({
      title: 'Success',
      description: 'Assistant updated successfully'
    })
  }

  const handleDeleteSuccess = (deletedId: string) => {
    setAssistants(prev => prev.filter(a => a.id !== deletedId))
    setIsDeleteModalOpen(false)
    setSelectedAssistant(null)
    toast({
      title: 'Success',
      description: 'Assistant deleted successfully'
    })
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        // Refresh data after sync
        await fetchAssistants()
        
        // Show detailed sync results
        const details = data.data
        let description = data.message
        
        if (details.assistants.details.length > 0) {
          description += '\n\nRemoved assistants:'
          details.assistants.details.forEach((item: any) => {
            description += `\n• ${item.name} - ${item.action}`
          })
        }
        
        toast({
          title: 'Sync Complete',
          description: description
        })
      } else {
        throw new Error(data.error?.message || 'Sync failed')
      }
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: error instanceof Error ? error.message : 'Failed to sync voice assistants',
        variant: 'destructive'
      })
    } finally {
      setSyncing(false)
    }
  }


  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Modern Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl p-8 mb-6"
             style={{
               background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
               border: '1px solid rgba(139, 92, 246, 0.3)'
             }}>
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-20"
                 style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)' }} />
            <div className="absolute top-20 right-20 w-60 h-60 rounded-full opacity-15"
                 style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)' }} />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative flex justify-between items-center py-8"
          >
            <div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  AI Voice Assistants
                </h1>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-gray-400"
              >
                Deploy and manage your intelligent AI voice agents
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              {/* Usage Status Indicator */}
              {usage && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-right"
                >
                  <div className="text-sm text-gray-300 mb-1">
                    Assistant Usage
                  </div>
                  <div className={`text-lg font-bold flex items-center gap-2 ${
                    isAtAssistantLimit ? 'text-red-400' : usage.assistants.count >= usage.assistants.limit * 0.8 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {usage.assistants.count}/{usage.assistants.limit}
                    {isAtAssistantLimit && <Lock className="h-4 w-4" />}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={handleSync}
                  disabled={syncing}
                  variant="outline"
                  className="relative overflow-hidden group bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{syncing ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: canCreateAssistant ? 1.02 : 1 }}
                whileTap={{ scale: canCreateAssistant ? 0.98 : 1 }}
              >
                <Button 
                  onClick={() => {
                    if (canCreateAssistant) {
                      router.push('/dashboard/assistants/new')
                    } else {
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
                    }
                  }}
                  disabled={!canCreateAssistant || usageLoading}
                  className={`relative overflow-hidden group shadow-xl transition-all ${
                    canCreateAssistant 
                      ? 'hover:shadow-2xl' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  style={{
                    background: canCreateAssistant 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
                    border: 'none'
                  }}
                >
                  {canCreateAssistant && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  )}
                  {canCreateAssistant ? (
                    <Plus className="mr-2 h-5 w-5" />
                  ) : (
                    <Lock className="mr-2 h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {canCreateAssistant ? 'Create AI Voice Agent Assistant' : 'Assistant Limit Reached'}
                  </span>
                  {canCreateAssistant ? (
                    <Sparkles className="ml-2 h-4 w-4" />
                  ) : (
                    <AlertTriangle className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Quantum Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border border-gray-700 bg-gray-900/50 backdrop-blur">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Search className="h-5 w-5 text-purple-400" />
                  Search & Filter
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assistants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 transition-all duration-300 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    style={{
                      border: '1px solid var(--vm-border-subtle)',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48" style={{
                    background: 'var(--vm-void)',
                    border: '1px solid var(--vm-border-subtle)',
                    borderRadius: '8px'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active Agents</SelectItem>
                    <SelectItem value="active">Active Agents Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quantum Assistants Grid */}
        {loading ? (
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="relative overflow-hidden" style={{
                  background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 107, 53, 0.02) 100%)',
                  border: '1px solid var(--vm-border-brand)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  <div className="absolute inset-0">
                    <div className="animate-pulse">
                      <div className="h-2 w-full bg-gradient-to-r from-orange-500/20 via-orange-500/40 to-orange-500/20 rounded-full" />
                    </div>
                  </div>
                  <CardHeader className="relative">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl animate-pulse" style={{ background: 'var(--vm-surface-elevated)' }} />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--vm-surface-elevated)', width: '75%' }} />
                        <div className="h-3 rounded animate-pulse" style={{ background: 'var(--vm-surface-elevated)', width: '50%' }} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3">
                      <div className="h-3 rounded animate-pulse" style={{ background: 'var(--vm-surface-elevated)' }} />
                      <div className="h-3 rounded animate-pulse" style={{ background: 'var(--vm-surface-elevated)', width: '80%' }} />
                      <div className="h-3 rounded animate-pulse" style={{ background: 'var(--vm-surface-elevated)', width: '60%' }} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : filteredAssistants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="text-center py-16 relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.03) 0%, rgba(139, 92, 246, 0.02) 100%)',
              border: '1px solid var(--vm-border-subtle)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              {/* Floating Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-10" style={{ background: 'var(--vm-gradient-brand)' }} />
                <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full opacity-10" style={{ background: 'var(--vm-gradient-premium)' }} />
              </div>
              
              <CardContent className="relative">
                <div className="text-muted-foreground mb-4">
                  {assistants.length === 0 ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-6"
                      >
                        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--vm-gradient-brand)' }}>
                          <Bot className="h-10 w-10 text-white" />
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--vm-pure)' }}>No AI Voice Agent Agents Deployed</h3>
                      <p className="mb-6 text-lg" style={{ color: 'var(--vm-gray-400)' }}>Initialize your first AI consciousness to begin the voice agent matrix</p>
                      <motion.div
                        whileHover={{ scale: canCreateAssistant ? 1.05 : 1 }}
                        whileTap={{ scale: canCreateAssistant ? 0.95 : 1 }}
                      >
                        <Button 
                          onClick={() => {
                            if (canCreateAssistant) {
                              router.push('/dashboard/assistants/new')
                            } else {
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
                            }
                          }}
                          disabled={!canCreateAssistant || usageLoading}
                          className={`relative overflow-hidden group ${
                            canCreateAssistant 
                              ? '' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                          style={{
                            background: canCreateAssistant 
                              ? 'var(--vm-gradient-brand)'
                              : 'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
                            border: 'none',
                            boxShadow: canCreateAssistant 
                              ? '0 8px 32px rgba(255, 107, 53, 0.3)'
                              : '0 8px 32px rgba(107, 114, 128, 0.3)'
                          }}
                        >
                          {canCreateAssistant && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
                          )}
                          {canCreateAssistant ? (
                            <Plus className="mr-2 h-5 w-5" />
                          ) : (
                            <Lock className="mr-2 h-5 w-5" />
                          )}
                          <span className="font-semibold">
                            {canCreateAssistant ? 'Deploy First Agent' : 'Limit Reached'}
                          </span>
                          {canCreateAssistant ? (
                            <Zap className="ml-2 h-4 w-4" />
                          ) : (
                            <AlertTriangle className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--vm-surface-elevated)' }}>
                        <Search className="h-8 w-8" style={{ color: 'var(--vm-orange-primary)' }} />
                      </div>
                      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--vm-pure)' }}>No AI Voice Agent Patterns Found</h3>
                      <p style={{ color: 'var(--vm-gray-400)' }}>Adjust your search parameters to locate agents</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {filteredAssistants.map((assistant, index) => (
              <motion.div
                key={assistant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="relative p-6 rounded-2xl backdrop-blur-sm border overflow-hidden cursor-pointer h-full" style={{
                  background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.05) 0%, rgba(255, 107, 53, 0.02) 100%)',
                  border: '1px solid var(--vm-border-brand)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                  {/* Floating Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-violet-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
                  
                  {/* AI Voice Agent Status Indicator */}
                  <div className="absolute top-3 right-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  
                  <CardHeader className="pb-4 relative">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl" style={{ background: 'var(--vm-gradient-brand)' }}>
                            <Bot className="h-5 w-5" style={{ color: 'white' }} />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold" style={{ color: 'var(--vm-pure)' }}>
                              {assistant.name}
                            </CardTitle>
                            <p className="text-sm" style={{ color: 'var(--vm-gray-400)' }}>
                              {assistant.config?.companyName || 'AI Voice Agent Network'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" style={{ color: 'var(--vm-gray-400)' }} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 z-50">
                          <DropdownMenuItem onClick={() => handleEdit(assistant)} className="group">
                            <Edit className="mr-2 h-4 w-4 group-hover:text-blue-400" />
                            Modify Agent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(assistant)}
                            className="text-destructive group"
                          >
                            <Trash2 className="mr-2 h-4 w-4 group-hover:text-red-400" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge 
                        variant="default"
                        className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      >
                        Active
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="bg-violet-500/10 text-violet-400 border-violet-500/30"
                      >
                        {assistant.config?.personality || 'Professional'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: 'var(--vm-gray-300)' }}>AI Voice Agent Network:</span>
                        <span style={{ color: 'var(--vm-gray-100)' }}>{assistant.config?.companyName || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: 'var(--vm-gray-300)' }}>Max Duration:</span>
                        <span style={{ color: 'var(--vm-gray-100)' }}>{assistant.config?.maxCallDuration || 1800}s</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium" style={{ color: 'var(--vm-gray-300)' }}>Language Matrix:</span>
                        <span style={{ color: 'var(--vm-gray-100)' }}>{assistant.config?.language || 'en-US'}</span>
                      </div>
                      {assistant.vapi_assistant_id && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: 'var(--vm-gray-300)' }}>AI Voice Agent ID:</span>
                          <span className="font-mono text-xs px-2 py-1 rounded" style={{ 
                            background: 'var(--vm-void)', 
                            color: 'var(--vm-orange-primary)',
                            border: '1px solid var(--vm-border-subtle)'
                          }}>
                            {assistant.vapi_assistant_id.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--vm-border-subtle)' }}>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span style={{ color: 'var(--vm-gray-400)' }}>AI Voice Agent Activity</span>
                        <span style={{ color: 'var(--vm-orange-primary)' }}>Active</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-1000" 
                          style={{ 
                            width: '98%',
                            background: 'var(--vm-gradient-brand)'
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {selectedAssistant && (
        <>
          <EditAssistantModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedAssistant(null)
            }}
            assistant={selectedAssistant}
            onSuccess={handleEditSuccess}
          />
          
          <DeleteAssistantModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setSelectedAssistant(null)
            }}
            assistant={selectedAssistant}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </DashboardLayout>
  )
}