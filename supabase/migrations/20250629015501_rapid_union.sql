-- Fix profiles table schema for MyLifePictures.ai
-- This migration safely updates the profiles table structure

-- First, let's check the current structure and fix any issues
DO $$ 
DECLARE
    id_column_type text;
    has_identity boolean := false;
BEGIN
    -- Check if id column is an identity column
    SELECT data_type INTO id_column_type 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'id';
    
    -- Check if it's an identity column
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND is_identity = 'YES'
    ) INTO has_identity;
    
    RAISE NOTICE 'Current id column type: %, Is identity: %', id_column_type, has_identity;
    
    -- If it's an identity column, we need to drop the identity first
    IF has_identity THEN
        RAISE NOTICE 'Dropping identity from id column...';
        ALTER TABLE profiles ALTER COLUMN id DROP IDENTITY IF EXISTS;
    END IF;
    
    -- If the column is not UUID, we need to handle this carefully
    IF id_column_type != 'uuid' THEN
        RAISE NOTICE 'Converting id column to UUID type...';
        
        -- First, ensure we have the uuid-ossp extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Drop the primary key constraint temporarily
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
        
        -- Convert the column to UUID (this will only work if data is compatible)
        -- If you have existing data that's not UUID format, you'll need to handle this differently
        ALTER TABLE profiles ALTER COLUMN id TYPE uuid USING id::uuid;
        
        -- Re-add the primary key constraint
        ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
    END IF;
    
END $$;

-- Ensure the profiles table has all required columns
DO $$ 
BEGIN
    -- Add full_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name text;
        RAISE NOTICE 'Added full_name column';
    END IF;
    
    -- Add avatar_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url text;
        RAISE NOTICE 'Added avatar_url column';
    END IF;
    
    -- Add preferences if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences jsonb DEFAULT '{}';
        RAISE NOTICE 'Added preferences column';
    END IF;
    
    -- Add emergency_contacts if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contacts') THEN
        ALTER TABLE profiles ADD COLUMN emergency_contacts jsonb DEFAULT '[]';
        RAISE NOTICE 'Added emergency_contacts column';
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Ensure the foreign key relationship exists
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%auth_users%'
    ) THEN
        -- Add foreign key constraint to auth.users
        ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint to auth.users';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Foreign key constraint already exists';
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create the remaining tables needed for MyLifePictures.ai
CREATE TABLE IF NOT EXISTS photo_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id uuid REFERENCES photo_folders(id) ON DELETE SET NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  file_size bigint,
  mime_type text,
  width integer,
  height integer,
  taken_at timestamptz,
  location text,
  description text,
  ai_description text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audio_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  duration_seconds integer,
  transcript text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE photo_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for photo_folders
DROP POLICY IF EXISTS "Users can manage own folders" ON photo_folders;
CREATE POLICY "Users can manage own folders"
  ON photo_folders FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for photos
DROP POLICY IF EXISTS "Users can manage own photos" ON photos;
CREATE POLICY "Users can manage own photos"
  ON photos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for audio_recordings
DROP POLICY IF EXISTS "Users can manage own audio recordings" ON audio_recordings;
CREATE POLICY "Users can manage own audio recordings"
  ON audio_recordings FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_folders_user_id ON photo_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_photo_id ON audio_recordings(photo_id);

-- Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('photos', 'photos', true),
  ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for photos bucket
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for audio bucket
DROP POLICY IF EXISTS "Users can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;

CREATE POLICY "Users can upload own audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_photo_folders_updated_at ON photo_folders;
CREATE TRIGGER update_photo_folders_updated_at
  BEFORE UPDATE ON photo_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '=== MyLifePictures.ai Database Setup Complete ===';
    RAISE NOTICE 'Tables created/updated:';
    RAISE NOTICE '- profiles (enhanced with new columns)';
    RAISE NOTICE '- photo_folders';
    RAISE NOTICE '- photos';
    RAISE NOTICE '- audio_recordings';
    RAISE NOTICE 'Storage buckets: photos, audio';
    RAISE NOTICE 'RLS policies: enabled for all tables';
    RAISE NOTICE 'Triggers: user creation and timestamp updates';
END $$;

-- Show final table structure
SELECT 
  'profiles table structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;