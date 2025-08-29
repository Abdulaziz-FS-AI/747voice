-- Add duration_seconds column to call_info_log table if it doesn't exist
-- This ensures we can store precise duration data

DO $$ 
BEGIN 
    -- Check if duration_seconds column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'call_info_log' 
        AND column_name = 'duration_seconds'
    ) THEN
        -- Add duration_seconds column
        ALTER TABLE public.call_info_log 
        ADD COLUMN duration_seconds NUMERIC DEFAULT 0;
        
        -- Update existing records: convert duration_minutes to duration_seconds
        UPDATE public.call_info_log 
        SET duration_seconds = duration_minutes * 60 
        WHERE duration_seconds IS NULL OR duration_seconds = 0;
        
        -- Make duration_seconds NOT NULL now that we have data
        ALTER TABLE public.call_info_log 
        ALTER COLUMN duration_seconds SET NOT NULL;
    END IF;
END $$;