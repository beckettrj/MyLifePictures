-- SQL to update your existing profiles table for MyLifePictures.ai
-- Run this in your Supabase SQL Editor

-- Add missing columns to the profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emergency_contacts jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure the table has the correct structure
-- If you need to rename the table from 'profiles' to 'users', uncomment the next line:
-- ALTER TABLE profiles RENAME TO users;

-- Enable Row Level Security on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
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

-- Create function to handle new user creation (if it doesn't exist)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
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

CREATE TABLE IF NOT EXISTS ai_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL,
  annotation_type text NOT NULL,
  content text NOT NULL,
  confidence_score real,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE photo_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for ai_annotations
DROP POLICY IF EXISTS "Users can manage own AI annotations" ON ai_annotations;
CREATE POLICY "Users can manage own AI annotations"
  ON ai_annotations FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for emergency_contacts
DROP POLICY IF EXISTS "Users can manage own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can manage own emergency contacts"
  ON emergency_contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_folder_id ON photos(folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_folders_user_id ON photo_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_user_id ON audio_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_recordings_photo_id ON audio_recordings(photo_id);
CREATE INDEX IF NOT EXISTS idx_ai_annotations_user_id ON ai_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_annotations_photo_id ON ai_annotations(photo_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- Create storage buckets (if they don't exist)
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
CREATE TRIGGER update_photo_folders_updated_at
  BEFORE UPDATE ON photo_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification queries (run these to check everything worked)
-- SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
-- UNION ALL
-- SELECT 'photo_folders', count(*) FROM photo_folders
-- UNION ALL
-- SELECT 'photos', count(*) FROM photos
-- UNION ALL
-- SELECT 'audio_recordings', count(*) FROM audio_recordings
-- UNION ALL
-- SELECT 'ai_annotations', count(*) FROM ai_annotations
-- UNION ALL
-- SELECT 'emergency_contacts', count(*) FROM emergency_contacts;

-- Check storage buckets
-- SELECT name, public FROM storage.buckets WHERE name IN ('photos', 'audio');