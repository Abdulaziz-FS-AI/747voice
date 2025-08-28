'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Mic, Zap, Mail, UserPlus, Clock, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { DEMO_LIMITS } from '@/types/database'

function SignUpContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientSupabaseClient()
  const { signInWithGoogle, user, loading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      console.log('🎯 User already authenticated, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      setError('')
      
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError(error.message || 'Google sign-in failed')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Basic validation
      if (!email || !password || !firstName) {
        throw new Error('Please fill in all required fields')
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      console.log('🎯 Creating demo account with email:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      if (error) {
        throw error
      }

      if (data?.user && !data?.user?.email_confirmed_at) {
        toast({
          title: 'Check your email',
          description: 'We sent you a confirmation link. Please check your email to complete signup.',
        })
        return
      }

      router.push('/dashboard')

    } catch (error: any) {
      console.error('Email signup error:', error)
      setError(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vm-primary-dark)' }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'var(--vm-secondary-purple)' }} />
          <p style={{ color: 'var(--vm-neutral-400)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--vm-primary-dark)' }}>
      <Card className="w-full max-w-lg" style={{ 
        background: 'var(--vm-surface-elevated)', 
        borderColor: 'var(--vm-border-default)' 
      }}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl" style={{ background: 'var(--vm-gradient-primary)' }}>
              <Mic className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" style={{ color: 'var(--vm-primary-light)' }}>
            Start Your Demo Journey
          </CardTitle>
          <CardDescription style={{ color: 'var(--vm-neutral-400)' }}>
            Create your free demo account and explore Voice Matrix
          </CardDescription>
          
          {/* Demo Benefits */}
          <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--vm-surface-default)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--vm-primary-light)' }}>
              🎯 What you get with your demo:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: 'var(--vm-secondary-purple)' }} />
                <span style={{ color: 'var(--vm-neutral-200)' }}>
                  {DEMO_LIMITS.MAX_ASSISTANTS} AI voice assistants
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: 'var(--vm-accent-blue)' }} />
                <span style={{ color: 'var(--vm-neutral-200)' }}>
                  {DEMO_LIMITS.MAX_MINUTES_TOTAL} minutes total usage
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: 'var(--vm-success-green)' }} />
                <span style={{ color: 'var(--vm-neutral-200)' }}>
                  Full feature access for {DEMO_LIMITS.MAX_LIFETIME_DAYS} days
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            style={{ 
              borderColor: 'var(--vm-border-default)',
              color: 'var(--vm-neutral-200)'
            }}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'var(--vm-border-default)' }}></div>
            <span className="text-sm" style={{ color: 'var(--vm-neutral-400)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--vm-border-default)' }}></div>
          </div>

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" style={{ color: 'var(--vm-neutral-200)' }}>
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ 
                    background: 'var(--vm-surface-default)',
                    borderColor: 'var(--vm-border-default)',
                    color: 'var(--vm-neutral-100)'
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" style={{ color: 'var(--vm-neutral-200)' }}>
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ 
                    background: 'var(--vm-surface-default)',
                    borderColor: 'var(--vm-border-default)',
                    color: 'var(--vm-neutral-100)'
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: 'var(--vm-neutral-200)' }}>
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  background: 'var(--vm-surface-default)',
                  borderColor: 'var(--vm-border-default)',
                  color: 'var(--vm-neutral-100)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: 'var(--vm-neutral-200)' }}>
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  background: 'var(--vm-surface-default)',
                  borderColor: 'var(--vm-border-default)',
                  color: 'var(--vm-neutral-100)'
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" style={{ color: 'var(--vm-neutral-200)' }}>
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ 
                  background: 'var(--vm-surface-default)',
                  borderColor: 'var(--vm-border-default)',
                  color: 'var(--vm-neutral-100)'
                }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isGoogleLoading}
              style={{ background: 'var(--vm-gradient-primary)', border: 'none' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Demo Account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Demo Account
                </>
              )}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <p className="text-sm" style={{ color: 'var(--vm-neutral-400)' }}>
              Already have an account?{' '}
              <Link 
                href="/signin" 
                className="font-medium hover:underline"
                style={{ color: 'var(--vm-secondary-purple)' }}
              >
                Sign in
              </Link>
            </p>
            
            <p className="text-xs leading-relaxed" style={{ color: 'var(--vm-neutral-500)' }}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
              This is a demo account with limited features for evaluation purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--vm-primary-dark)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--vm-secondary-purple)' }} />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}