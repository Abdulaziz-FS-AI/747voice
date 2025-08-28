'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { ensureUserProfile } from '@/lib/profile-utils'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle successful sign in - let auth callback handle routing
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🚀 Auth context - SIGNED_IN event, current path:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
        
        // Only redirect from signin page after checking profile status (client-side only)
        if (typeof window !== 'undefined' && window.location.pathname === '/signin') {
          // Demo system: Ensure profile exists and redirect to dashboard
          ensureUserProfile(session.user.id).then((result) => {
            console.log('🚀 Auth context - ensure profile result:', result)
            
            if (result.success && result.profile) {
              // Demo system: Always redirect to dashboard for authenticated users
              console.log('🚀 Auth context - demo user authenticated, redirecting to dashboard')
              window.location.href = '/dashboard'
            } else {
              // Failed to create/get profile - still try dashboard
              console.log('🚀 Auth context - profile issue, still redirecting to dashboard')
              window.location.href = '/dashboard'
            }
          })
        }
        // For auth/callback and signup pages, let them handle their own navigation
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to sign out:', error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    console.log('🔄 [AUTH] Starting Google OAuth sign-in...')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('❌ [AUTH] Google OAuth error:', error)
        throw error
      }
      
      console.log('✅ [AUTH] Google OAuth initiated successfully')
    } catch (error) {
      console.error('❌ [AUTH] Failed to initiate Google OAuth:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signOut,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}