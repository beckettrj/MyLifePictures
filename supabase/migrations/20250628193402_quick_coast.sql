/*
  # Initial Database Schema for MyLifePictures.ai

  1. New Tables
    - `users` - User profiles and preferences
    - `photos` - Photo metadata and storage references
    - `photo_folders` - Organization folders for photos
    - `audio_recordings` - Voice recordings and annotations
    - `ai_annotations` - AI-generated photo descriptions
    - `emergency_contacts` - Emergency contact information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for emergency contact access

  3. Storage
    - Create storage buckets for photos and audio files
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}',
  emergency_contacts jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photo folders table
CREATE TABLE IF NOT EXISTS photo_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- Create audio recordings table
CREATE TABLE IF NOT EXISTS audio_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  public_url text NOT NULL,
  duration_seconds integer,
  transcript text,
  created_at timestamptz DEFAULT now()
);

-- Create AI annotations table
CREATE TABLE IF NOT EXISTS ai_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL, -- 'openai', 'gemini', 'grok', 'anthropic'
  annotation_type text NOT NULL, -- 'description', 'story', 'memory'
  content text NOT NULL,
  confidence_score real,
  created_at timestamptz DEFAULT now()
);

-- Create emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship text,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for photo_folders table
CREATE POLICY "Users can manage own folders"
  ON photo_folders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for photos table
CREATE POLICY "Users can manage own photos"
  ON photos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for audio_recordings table
CREATE POLICY "Users can manage own audio recordings"
  ON audio_recordings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for ai_annotations table
CREATE POLICY "Users can manage own AI annotations"
  ON ai_annotations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for emergency_contacts table
CREATE POLICY "Users can manage own emergency contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
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

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('photos', 'photos', true),
  ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for photos bucket
CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for audio bucket
CREATE POLICY "Users can upload own audio"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audio"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own audio"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
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

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_folders_updated_at
  BEFORE UPDATE ON photo_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();