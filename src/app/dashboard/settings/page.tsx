'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { Settings, User, Bell, Database, Shield, Sparkles, Zap, Activity, CreditCard } from 'lucide-react'
// Card components replaced with AI Voice Agent design system
import { DashboardLayout } from '@/components/dashboard/layout'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Voice Agent Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div>
            <motion.h1 
              className="vm-text-display mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="vm-text-gradient">Voice Agent</span> Settings
            </motion.h1>
            <motion.p 
              className="vm-text-secondary text-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Configure your Voice Matrix experience and preferences
            </motion.p>
          </div>
          <motion.div
            className="vm-energy-pulse p-4 rounded-2xl"
            style={{ background: 'var(--vm-gradient-surface)' }}
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Settings className="w-8 h-8" style={{ color: 'var(--vm-orange-primary)' }} />
          </motion.div>
        </motion.div>

        {/* AI Voice Agent Settings Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="vm-card-feature p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--vm-gradient-brand)' }}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <User className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold vm-text-gradient">Account Matrix</h3>
                <p className="vm-text-secondary text-sm">AI Voice Agent profile configuration</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium" style={{ color: 'var(--vm-pure)' }}>AI Voice Agent Identity</label>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                  <span className="vm-text-secondary font-mono text-sm">{user.email}</span>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <Activity className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </motion.div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium" style={{ color: 'var(--vm-pure)' }}>Access Level</label>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                  <span className="vm-text-secondary font-semibold">Pro AI Voice Agent Access</span>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Badge className="vm-badge">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>


          {/* AI Voice Agent Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="vm-card-feature p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--vm-violet), var(--vm-pulse-purple))' }}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Bell className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold vm-text-voice agent">AI Voice Agent Alerts</h3>
                <p className="vm-text-secondary text-sm">Voice intelligence notifications</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>AI Voice Agent Call Alerts</div>
                  <div className="text-sm vm-text-secondary">Real-time voice activity monitoring</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Zap className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </motion.div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>Matrix Analytics</div>
                  <div className="text-sm vm-text-secondary">Weekly voice agent performance reports</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Activity className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* AI Voice Agent Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="vm-card-feature p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--vm-emerald), var(--vm-cyan))' }}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: 'var(--vm-emerald)' }}>AI Voice Agent Vault</h3>
                <p className="vm-text-secondary text-sm">Advanced data protection protocols</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>Data Matrix Retention</div>
                  <div className="text-sm vm-text-secondary">AI Voice Agent conversation storage period</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    90 voice agent cycles
                  </Badge>
                </motion.div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>Intelligence Tracking</div>
                  <div className="text-sm vm-text-secondary">AI Voice Agent pattern analysis permissions</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Zap className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* AI Voice Agent System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="vm-card-feature p-8 group"
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center vm-status-online"
                style={{ background: 'linear-gradient(135deg, var(--vm-signal-blue), var(--vm-violet))' }}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Database className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: 'var(--vm-signal-blue)' }}>AI Voice Agent Core Status</h3>
                <p className="vm-text-secondary text-sm">System health monitoring</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>AI Voice Agent Database</div>
                  <div className="text-sm vm-text-secondary">Core data matrix connectivity</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 vm-glow-pulse">
                    <Activity className="w-3 h-3 mr-1" />
                    AI Voice Agent Active
                  </Badge>
                </motion.div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>Voice Intelligence Service</div>
                  <div className="text-sm vm-text-secondary">Voice intelligence service status</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 vm-glow-pulse">
                    <Zap className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </motion.div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--vm-surface)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--vm-pure)' }}>Event Webhooks</div>
                  <div className="text-sm vm-text-secondary">Real-time voice agent event processing</div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge className="vm-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 vm-glow-pulse">
                    <Activity className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Voice Agent Evolution Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="vm-card-feature p-8 md:col-span-2"
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--vm-gradient-voice agent)' }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-semibold vm-text-voice agent">AI Voice Agent Evolution Pipeline</h3>
              <p className="vm-text-secondary">Advanced features currently in voice agent development</p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Quantum Analytics",
                description: "Advanced voice agent conversation analysis with predictive intelligence patterns",
                icon: "📊",
                color: "var(--vm-violet)"
              },
              {
                title: "Team AI Voice Agent Network",
                description: "Collaborative matrix management with distributed voice agent permissions", 
                icon: "👥",
                color: "var(--vm-cyan)"
              },
              {
                title: "Matrix Integrations",
                description: "AI Voice Agent connections to your enterprise CRM and business intelligence systems",
                icon: "🔗",
                color: "var(--vm-emerald)"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="p-6 rounded-2xl group cursor-pointer"
                style={{ 
                  background: 'var(--vm-surface)',
                  border: `1px solid ${feature.color}30`
                }}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <div className="font-semibold mb-3" style={{ color: 'var(--vm-pure)' }}>
                  {feature.title}
                </div>
                <div className="text-sm vm-text-secondary mb-4 leading-relaxed">
                  {feature.description}
                </div>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Badge 
                    className="vm-badge" 
                    style={{ 
                      background: `${feature.color}10`,
                      color: feature.color,
                      borderColor: `${feature.color}30`
                    }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    AI Voice Agent Development
                  </Badge>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}