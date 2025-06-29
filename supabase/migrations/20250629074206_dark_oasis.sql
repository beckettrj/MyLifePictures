/*
  # Add delay_seconds to users table
  
  1. Changes
    - Add delay_seconds column to users table with default value of 10 seconds
    - This column stores the user's preferred slideshow delay between photos
  
  2. Default Value
    - Default is set to 10 seconds
    - This matches the default in the application
*/

-- Add delay_seconds column to users table if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'delay_seconds'
    ) THEN
        -- Add the column with default value
        ALTER TABLE users 
        ADD COLUMN delay_seconds integer DEFAULT 10;
        
        RAISE NOTICE 'Added delay_seconds column to users table with default value of 10 seconds';
    ELSE
        RAISE NOTICE 'delay_seconds column already exists in users table';
    END IF;
END $$;

-- Set default value for existing rows that might have NULL values
UPDATE users 
SET delay_seconds = 10 
WHERE delay_seconds IS NULL;

-- Ensure the column has a default value for new rows
ALTER TABLE users 
ALTER COLUMN delay_seconds SET DEFAULT 10;

-- Add comment to explain the column
COMMENT ON COLUMN users.delay_seconds IS 'Number of seconds to display each photo in slideshow (default: 10)';

-- Verification
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'users' 
    AND column_name = 'delay_seconds';