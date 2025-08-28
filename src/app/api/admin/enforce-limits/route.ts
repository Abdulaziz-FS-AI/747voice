import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/enforce-limits - Run limit enforcement across all users
export async function POST(request: NextRequest) {
  try {
    const { adminEmail = 'system@automated' } = await request.json();

    // Run the comprehensive limit enforcement
    const { data: enforcementResult, error } = await supabase
      .rpc('enforce_limits_with_vapi_cleanup');

    if (error) {
      throw error;
    }

    const vapiDeletions = enforcementResult.vapi_deletion_queue || [];

    // Process VAPI deletions if any
    const deletionResults = [];
    for (const deletion of vapiDeletions) {
      try {
        // Call VAPI to delete the assistant
        const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${deletion.vapi_assistant_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (vapiResponse.ok) {
          deletionResults.push({
            assistantId: deletion.assistant_id,
            vapiAssistantId: deletion.vapi_assistant_id,
            status: 'success',
            reason: deletion.reason
          });
        } else {
          deletionResults.push({
            assistantId: deletion.assistant_id,
            vapiAssistantId: deletion.vapi_assistant_id,
            status: 'failed',
            error: `VAPI deletion failed: ${vapiResponse.statusText}`,
            reason: deletion.reason
          });
        }
      } catch (vapiError) {
        deletionResults.push({
          assistantId: deletion.assistant_id,
          vapiAssistantId: deletion.vapi_assistant_id,
          status: 'error',
          error: vapiError instanceof Error ? vapiError.message : 'Unknown error',
          reason: deletion.reason
        });
      }
    }

    // Log the enforcement results
    await supabase.from('cleanup_jobs').insert({
      job_type: 'vapi_deletion_enforcement',
      assistants_deleted: deletionResults.filter(r => r.status === 'success').length,
      details: {
        admin_email: adminEmail,
        enforcement_timestamp: new Date().toISOString(),
        vapi_deletion_results: deletionResults,
        total_processed: deletionResults.length
      }
    });

    return NextResponse.json({
      success: true,
      enforcementResult,
      vapiDeletionResults: deletionResults,
      summary: {
        assistantsMarkedForDeletion: enforcementResult.assistants_marked_for_deletion,
        vapiDeletionsSuccessful: deletionResults.filter(r => r.status === 'success').length,
        vapiDeletionsFailed: deletionResults.filter(r => r.status !== 'success').length
      }
    });
  } catch (error) {
    console.error('Error enforcing limits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enforce limits' },
      { status: 500 }
    );
  }
}

// GET /api/admin/enforce-limits - Get enforcement status and queue
export async function GET() {
  try {
    // Get recent cleanup jobs
    const { data: recentJobs, error } = await supabase
      .from('cleanup_jobs')
      .select('*')
      .in('job_type', ['limit_enforcement_cleanup', 'vapi_deletion_enforcement'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // Get current users that need enforcement
    const { data: usersNeedingEnforcement } = await supabase
      .from('admin_user_monitoring')
      .select('user_id, email, account_status, active_assistants, max_assistants, current_usage_minutes, max_minutes_total')
      .in('account_status', ['SUSPENDED', 'OVER_LIMIT', 'AT_ASSISTANT_LIMIT']);

    return NextResponse.json({
      success: true,
      recentEnforcementJobs: recentJobs,
      usersNeedingEnforcement: usersNeedingEnforcement || [],
      summary: {
        totalUsersNeedingEnforcement: usersNeedingEnforcement?.length || 0,
        lastEnforcementRun: recentJobs?.[0]?.created_at || null
      }
    });
  } catch (error) {
    console.error('Error getting enforcement status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get enforcement status' },
      { status: 500 }
    );
  }
}