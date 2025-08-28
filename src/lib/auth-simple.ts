// REAL AUTH - Using actual Supabase session
import { createServerSupabaseClient } from '@/lib/supabase';

export class AuthError extends Error {
  public statusCode: number;
  public code: string;
  
  constructor(message: string, code: string = 'AUTH_ERROR', statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Real authentication using actual user session
export async function requireAuth(): Promise<{ user: any; profile: any }> {
  console.log('🔐 [AUTH] Getting authenticated user from session');
  
  const supabase = await createServerSupabaseClient();
  
  // Get the authenticated user from the session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('🔐 [AUTH] No authenticated user:', authError);
    throw new AuthError('Authentication required', 'NO_SESSION', 401);
  }
  
  console.log('🔐 [AUTH] Found authenticated user:', user.id, user.email);
  
  // Check if profile exists
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  
  if (profileError) {
    console.error('🔐 [AUTH] Error fetching profile:', profileError);
    throw new AuthError('Failed to fetch user profile', 'PROFILE_ERROR', 500);
  }
  
  if (existingProfile) {
    console.log('🔐 [AUTH] Found existing profile for user');
    return {
      user: user,
      profile: existingProfile
    };
  }
  
  // Profile doesn't exist, let the API create it
  console.log('🔐 [AUTH] No profile found, will be created by API');
  
  return {
    user: user,
    profile: null
  };
}