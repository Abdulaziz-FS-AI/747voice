-- Create/update function to properly calculate user usage in seconds
-- This function sums all call durations for a user's assistants and returns total seconds

CREATE OR REPLACE FUNCTION public.get_user_actual_usage_seconds(p_user_id UUID)
RETURNS TABLE (
  total_usage_seconds NUMERIC,
  total_usage_minutes NUMERIC,
  total_calls INTEGER,
  user_assistants INTEGER
) 
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    -- Sum all duration_seconds from call_info_log for this user's assistants
    COALESCE(SUM(
      CASE 
        -- If duration_seconds column exists, use it
        WHEN cil.duration_seconds IS NOT NULL THEN cil.duration_seconds
        -- Otherwise convert duration_minutes to seconds  
        ELSE cil.duration_minutes * 60
      END
    )::numeric, 0) as total_usage_seconds,
    
    -- Convert seconds to minutes with 2 decimal precision
    COALESCE(ROUND(
      SUM(
        CASE 
          WHEN cil.duration_seconds IS NOT NULL THEN cil.duration_seconds
          ELSE cil.duration_minutes * 60
        END
      ) / 60.0, 2
    )::numeric, 0) as total_usage_minutes,
    
    -- Count total calls
    COALESCE(COUNT(cil.id)::integer, 0) as total_calls,
    
    -- Count user's assistants
    COALESCE(COUNT(DISTINCT ua.id)::integer, 0) as user_assistants
    
  FROM public.profiles p
  LEFT JOIN public.user_assistants ua ON p.id = ua.user_id
  LEFT JOIN public.call_info_log cil ON ua.vapi_assistant_id = cil.assistant_id
  WHERE p.id = p_user_id
  GROUP BY p.id;
END;
$function$;

-- Also create a simpler version that just returns minutes (for backward compatibility)
CREATE OR REPLACE FUNCTION public.get_user_actual_usage(p_user_id UUID)
RETURNS TABLE (
  actual_usage NUMERIC,
  total_calls INTEGER, 
  user_assistants INTEGER
) 
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    usage_data.total_usage_minutes as actual_usage,
    usage_data.total_calls,
    usage_data.user_assistants
  FROM public.get_user_actual_usage_seconds(p_user_id) as usage_data;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_actual_usage_seconds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_actual_usage_seconds(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_actual_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_actual_usage(UUID) TO service_role;