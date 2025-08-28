import { NextRequest, NextResponse } from 'next/server';
import { requireAuth as authenticateRequest } from '@/lib/auth-simple';
import { handleAPIError } from '@/lib/errors';
import { createServiceRoleClient } from '@/lib/supabase';
import { DEMO_LIMITS } from '@/types/database';

// GET /api/demo-status - Get current demo status for user
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest();
    const user = authResult.user;

    const supabase = createServiceRoleClient('demo_status');

    // Get user profile from profiles table
    let { data: userProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Demo Status API] Error fetching user demo status:', error);
      throw error;
    }

    // If no profile found, create one with default values
    if (!userProfile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          max_assistants: DEMO_LIMITS.MAX_ASSISTANTS,
          max_minutes_total: DEMO_LIMITS.MAX_MINUTES_TOTAL,
          current_usage_minutes: 0
        })
        .select('*')
        .single();

      if (createError) {
        console.error('[Demo Status API] Error creating user profile:', createError);
        throw createError;
      }
      
      // Use the new profile
      userProfile = newProfile;
    }

    // Get active assistants from user_assistants table
    const { data: activeAssistants } = await supabase
      .from('user_assistants')
      .select('*')
      .eq('user_id', user.id)
      .eq('assistant_state', 'active');

    // Get actual usage from monitoring view
    const actualUsageMinutes = userProfile?.total_minutes_used_actual || userProfile?.current_usage_minutes || 0

    // Calculate assistant info from user_assistants (no expiry since we removed time-based expiration)
    const assistantExpiryInfo = activeAssistants?.map(assistant => {
      return {
        id: assistant.id,
        name: assistant.name,
        usageMinutes: assistant.usage_minutes || 0,
        daysUntilExpiry: -1, // No time-based expiry
        isExpiredByTime: false, // No time-based expiry
        isExpiredByUsage: actualUsageMinutes >= (userProfile?.max_minutes_total || DEMO_LIMITS.MAX_MINUTES_TOTAL)
      };
    }) || [];

    const activeAssistantCount = activeAssistants?.length || 0;
    const maxMinutesTotal = userProfile?.max_minutes_total || DEMO_LIMITS.MAX_MINUTES_TOTAL;
    const maxAssistants = userProfile?.max_assistants || DEMO_LIMITS.MAX_ASSISTANTS;
    const remainingMinutes = Math.max(0, maxMinutesTotal - actualUsageMinutes);
    const remainingAssistantSlots = Math.max(0, maxAssistants - activeAssistantCount);
    const usageLimitReached = actualUsageMinutes >= maxMinutesTotal;
    const assistantLimitReached = activeAssistantCount >= maxAssistants;

    // Build demo status response from actual schema data
    const demoStatus = {
      userId: user.id,
      email: userProfile?.email || user.email,
      fullName: userProfile?.full_name || 'User',
      
      // Usage tracking (using actual usage from call logs)
      currentUsageMinutes: Number(actualUsageMinutes),
      maxMinutesTotal,
      remainingMinutes: Number(remainingMinutes),
      usagePercentage: Math.round((actualUsageMinutes / maxMinutesTotal) * 100),
      
      // Assistant limits
      activeAssistants: activeAssistantCount,
      maxAssistants,
      remainingAssistantSlots,
      
      // Limit status
      usageLimitReached,
      assistantLimitReached,
      anyLimitReached: usageLimitReached || assistantLimitReached,
      
      // Demo info
      demoLimits: {
        maxAssistants: DEMO_LIMITS.MAX_ASSISTANTS,
        maxMinutesTotal: DEMO_LIMITS.MAX_MINUTES_TOTAL,
        maxLifetimeDays: DEMO_LIMITS.MAX_LIFETIME_DAYS
      },
      
      // Assistant expiry details
      assistants: assistantExpiryInfo,
      
      // Status indicators
      warningLevel: (() => {
        if (usageLimitReached || assistantLimitReached) return 'critical';
        if (actualUsageMinutes >= maxMinutesTotal * 0.8) return 'warning';
        if (activeAssistantCount >= maxAssistants * 0.8) return 'warning';
        return 'normal';
      })()
    };

    return NextResponse.json({
      success: true,
      data: demoStatus
    });

  } catch (error) {
    console.error('[Demo Status API] Failed to fetch demo status:', error);
    return handleAPIError(error);
  }
}