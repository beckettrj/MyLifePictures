-- Add display_theme column to users table if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'display_theme'
    ) THEN
        -- Add the column with default value
        ALTER TABLE users 
        ADD COLUMN display_theme varchar(20) DEFAULT 'Light';
        
        RAISE NOTICE 'Added display_theme column to users table with default value of Light';
    ELSE
        RAISE NOTICE 'display_theme column already exists in users table';
    END IF;
END $$;

-- Set default value for existing rows that might have NULL values
UPDATE users 
SET display_theme = 'Light' 
WHERE display_theme IS NULL;

-- Ensure the column has a default value for new rows
ALTER TABLE users 
ALTER COLUMN display_theme SET DEFAULT 'Light';

-- Add comment to explain the column
COMMENT ON COLUMN users.display_theme IS 'Display theme preference (Light, Dark, Auto)';

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
    AND column_name = 'display_theme';