import { createClientSupabaseClient } from '@/lib/supabase'

export async function ensureUserProfile(userId: string) {
  const supabase = createClientSupabaseClient()
  
  try {
    // First check if demo profile exists
    const { data: profile, error: profileError } = await supabase
      .from('demo_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profile) {
      console.log('✅ Profile exists for user:', userId)
      return { success: true, profile, exists: true }
    }
    
    // Profile doesn't exist, create it
    if (profileError?.code === 'PGRST116') {
      console.log('🔨 Creating profile for user:', userId)
      
      // Get user data from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('❌ Could not get user data:', userError)
        return { success: false, error: 'Could not get user data' }
      }
      
      // Create demo profile with default values
      const { data: newProfile, error: createError } = await supabase
        .from('demo_profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                     user.email?.split('@')[0] || 'User',
          total_usage_minutes: 0,
          assistant_count: 0,
          onboarding_completed: false
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating profile:', createError)
        return { success: false, error: createError.message }
      }
      
      console.log('✅ Profile created successfully:', newProfile)
      return { success: true, profile: newProfile, exists: false }
    }
    
    // Other error
    console.error('❌ Error fetching profile:', profileError)
    return { success: false, error: profileError?.message || 'Unknown error' }
    
  } catch (error) {
    console.error('❌ Unexpected error in ensureUserProfile:', error)
    return { success: false, error: 'Unexpected error' }
  }
}

export async function debugUserProfile() {
  const supabase = createClientSupabaseClient()
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        authenticated: false,
        error: authError?.message || 'Not authenticated'
      }
    }
    
    // Get demo profile
    const { data: profile, error: profileError } = await supabase
      .from('demo_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError || null
    }
  } catch (error) {
    return {
      authenticated: false,
      error: 'Unexpected error',
      details: error
    }
  }
}