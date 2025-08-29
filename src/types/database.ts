// =============================================
// DEMO SYSTEM DATABASE TYPES
// =============================================
// Clean types for demo-only system with no subscriptions
// =============================================

// Demo limits constants
export const DEMO_LIMITS = {
  MAX_ASSISTANTS: 3,
  MAX_MINUTES_TOTAL: 10,
  MAX_LIFETIME_DAYS: 7 // Legacy - no longer used but kept for compatibility
} as const;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          max_assistants: number
          max_minutes_total: number
          current_usage_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          max_assistants?: number
          max_minutes_total?: number
          current_usage_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          max_assistants?: number
          max_minutes_total?: number
          current_usage_minutes?: number
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          base_prompt: string
          customizable_fields: Json
          voice_settings: Json | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          base_prompt: string
          customizable_fields?: Json
          voice_settings?: Json | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          base_prompt?: string
          customizable_fields?: Json
          voice_settings?: Json | null
          is_active?: boolean | null
          created_at?: string
        }
      }
      user_assistants: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          vapi_assistant_id: string | null
          name: string
          personality: string
          config: Json
          usage_minutes: number
          max_lifetime_days: number
          expires_at: string
          will_auto_delete: boolean
          deletion_reason: string | null
          assistant_state: 'active' | 'expired' | 'deleted'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          vapi_assistant_id?: string | null
          name: string
          personality?: string
          config?: Json
          usage_minutes?: number
          max_lifetime_days?: number
          expires_at?: string
          will_auto_delete?: boolean
          deletion_reason?: string | null
          assistant_state?: 'active' | 'expired' | 'deleted'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          vapi_assistant_id?: string | null
          name?: string
          personality?: string
          config?: Json
          usage_minutes?: number
          max_lifetime_days?: number
          expires_at?: string
          will_auto_delete?: boolean
          deletion_reason?: string | null
          assistant_state?: 'active' | 'expired' | 'deleted'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      structured_questions: {
        Row: {
          id: string
          assistant_id: string
          form_title: string
          question_text: string
          structured_name: string
          data_type: 'string' | 'number' | 'boolean'
          is_required: boolean | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          assistant_id: string
          form_title?: string
          question_text: string
          structured_name: string
          data_type?: 'string' | 'number' | 'boolean'
          is_required?: boolean | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          assistant_id?: string
          form_title?: string
          question_text?: string
          structured_name?: string
          data_type?: 'string' | 'number' | 'boolean'
          is_required?: boolean | null
          order_index?: number
          created_at?: string
        }
      }
      user_phone_numbers: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          friendly_name: string
          vapi_phone_id: string
          vapi_credential_id: string | null
          assigned_assistant_id: string | null
          webhook_url: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
          provider: string | null
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          assigned_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          friendly_name: string
          vapi_phone_id: string
          vapi_credential_id?: string | null
          assigned_assistant_id?: string | null
          webhook_url?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
          provider?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          assigned_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          friendly_name?: string
          vapi_phone_id?: string
          vapi_credential_id?: string | null
          assigned_assistant_id?: string | null
          webhook_url?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
          provider?: string | null
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          assigned_at?: string | null
          notes?: string | null
        }
      }
      call_info_log: {
        Row: {
          id: string
          assistant_id: string
          vapi_call_id: string | null
          duration_minutes: number
          duration_seconds: number
          evaluation: string | number | boolean | null
          caller_number: string | null
          transcript: string | null
          summary: string | null
          structured_data: Json | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assistant_id: string
          vapi_call_id?: string | null
          duration_minutes?: number
          duration_seconds?: number
          evaluation?: string | number | boolean | null
          caller_number?: string | null
          transcript?: string | null
          summary?: string | null
          structured_data?: Json | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assistant_id?: string
          vapi_call_id?: string | null
          duration_minutes?: number
          duration_seconds?: number
          evaluation?: string | number | boolean | null
          caller_number?: string | null
          transcript?: string | null
          summary?: string | null
          structured_data?: Json | null
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
      call_analytics: {
        Row: {
          id: string
          user_id: string
          assistant_id: string | null
          date: string
          total_calls: number | null
          successful_calls: number | null
          failed_calls: number | null
          total_duration_minutes: number | null
          average_call_duration: number | null
          success_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assistant_id?: string | null
          date: string
          total_calls?: number | null
          successful_calls?: number | null
          failed_calls?: number | null
          total_duration_minutes?: number | null
          average_call_duration?: number | null
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assistant_id?: string | null
          date?: string
          total_calls?: number | null
          successful_calls?: number | null
          failed_calls?: number | null
          total_duration_minutes?: number | null
          average_call_duration?: number | null
          success_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      cleanup_jobs: {
        Row: {
          id: string
          job_type: string
          assistants_deleted: number
          users_affected: number
          execution_time_ms: number | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          job_type?: string
          assistants_deleted?: number
          users_affected?: number
          execution_time_ms?: number | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          job_type?: string
          assistants_deleted?: number
          users_affected?: number
          execution_time_ms?: number | null
          details?: Json
          created_at?: string
        }
      }
    }
    Views: {
      active_assistants_view: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          vapi_assistant_id: string | null
          name: string
          personality: string
          config: Json
          usage_minutes: number
          max_lifetime_days: number
          expires_at: string
          will_auto_delete: boolean
          deletion_reason: string | null
          assistant_state: 'active' | 'expired' | 'deleted'
          created_at: string
          updated_at: string
          deleted_at: string | null
          user_email: string
          user_total_usage: number
          user_max_minutes: number
          user_remaining_minutes: number
          days_until_expiry: number
          is_expired_by_time: boolean
          is_expired_by_usage: boolean
        }
        Insert: never
        Update: never
      }
      user_demo_status: {
        Row: {
          user_id: string
          email: string
          full_name: string | null
          current_usage_minutes: number
          max_minutes_total: number
          remaining_minutes: number
          active_assistants: number
          max_assistants: number
          remaining_assistant_slots: number
          usage_limit_reached: boolean
          assistant_limit_reached: boolean
        }
        Insert: never
        Update: never
      }
    }
    Functions: {
      cleanup_expired_assistants: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_usage_on_call_end: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_assistant_expiration: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      assistant_state: 'active' | 'expired' | 'deleted'
      data_type: 'string' | 'number' | 'boolean'
    }
    CompositeTypes: Record<string, never>
  }
}

// Helper types for demo system
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Assistant = Database['public']['Tables']['user_assistants']['Row']
export type CallLog = Database['public']['Tables']['call_info_log']['Row']
export type StructuredQuestion = Database['public']['Tables']['structured_questions']['Row']
export type Template = Database['public']['Tables']['templates']['Row']
export type PhoneNumber = Database['public']['Tables']['user_phone_numbers']['Row']
export type CleanupJob = Database['public']['Tables']['cleanup_jobs']['Row']
export type CallAnalytics = Database['public']['Tables']['call_analytics']['Row']

// Demo-specific types
export interface DemoUserStatus {
  userId: string
  email: string
  fullName: string | null
  currentUsageMinutes: number
  maxMinutesTotal: number
  remainingMinutes: number
  activeAssistants: number
  maxAssistants: number
  remainingAssistantSlots: number
  usageLimitReached: boolean
  assistantLimitReached: boolean
}

export interface AssistantWithStatus extends Assistant {
  userEmail: string
  userTotalUsage: number
  userMaxMinutes: number
  userRemainingMinutes: number
  daysUntilExpiry: number
  isExpiredByTime: boolean
  isExpiredByUsage: boolean
}