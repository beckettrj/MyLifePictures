-- SQL to update your existing profiles table for MyLifePictures.ai
-- Run this in your Supabase SQL Editor

-- First, let's see what columns you currently have
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Add missing columns to the profiles table (if they don't exist)
DO $$ 
BEGIN
    -- Add full_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name text;
    END IF;
    
    -- Add avatar_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url text;
    END IF;
    
    -- Add preferences if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences jsonb DEFAULT '{}';
    END IF;
    
    -- Add emergency_contacts if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contacts') THEN
        ALTER TABLE profiles ADD COLUMN emergency_contacts jsonb DEFAULT '[]';
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Ensure the id column references auth.users (if it doesn't already)
-- Note: This might fail if the constraint already exists, which is fine
DO $$
BEGIN
    BEGIN
        ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
        WHEN duplicate_object THEN
            -- Constraint already exists, ignore
            NULL;
    END;
END $$;

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
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
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
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

-- Enable RLS on all new tables
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

-- Verification: Check what we have now
SELECT 'Setup completed! Here is your table structure:' as message;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check storage buckets
SELECT 'Storage buckets:' as message;
SELECT name, public FROM storage.buckets WHERE name IN ('photos', 'audio');