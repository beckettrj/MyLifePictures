/**
 * Supabase client configuration and utilities
 * Handles database, authentication, and storage operations
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Environment variables with proper Vite prefixes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zvxnsjsltabvsfwatqox.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  console.error('Please set VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create Supabase client only if we have the required configuration
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Check if Supabase is properly configured
export const isSupabaseReady = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your-project-url' && 
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseAnonKey !== 'placeholder-key'
);

/**
 * Test Supabase connection and configuration
 */
export async function testSupabaseConnection() {
  try {
    if (!isSupabaseReady) {
      return {
        configured: false,
        connected: false,
        error: 'Supabase not properly configured. Please set VITE_SUPABASE_ANON_KEY environment variable.'
      };
    }

    // Test basic connection by getting the current session
    const { data, error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('Invalid JWT')) {
      return {
        configured: true,
        connected: false,
        error: error.message
      };
    }

    return {
      configured: true,
      connected: true,
      session: data.session
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}

/**
 * Authentication utilities
 */
export const auth = {
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!isSupabaseReady) {
        console.warn('Supabase not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.');
        return null;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Don't throw for common auth errors - just return null
        if (error.message.includes('Invalid JWT') || 
            error.message.includes('session_not_found') ||
            error.message.includes('Auth session missing!')) {
          return null;
        }
        console.error('Auth error:', error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    try {
      if (!isSupabaseReady) {
        return null;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Get session error:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.');
    }

    console.log('🔐 Attempting sign in for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }

    console.log('✅ Sign in successful:', data.user?.id);
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.');
    }

    console.log('🔐 Attempting sign up for:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          email_confirm: true
        }
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      throw error;
    }

    console.log('✅ Sign up result:', {
      user: data.user?.id,
      session: !!data.session,
      needsConfirmation: !data.session && data.user
    });

    return data;
  },

  /**
   * Resend email confirmation
   */
  async resendConfirmation(email: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('📧 Resending confirmation email to:', email);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      console.error('❌ Resend confirmation error:', error);
      throw error;
    }

    console.log('✅ Confirmation email sent successfully');
  },

  /**
   * Sign out
   */
  async signOut() {
    if (!isSupabaseReady) {
      return;
    }

    console.log('🚪 Signing out user');

    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }

    console.log('✅ Sign out successful');
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseReady) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * Database utilities
 */
export const db = {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  },

  /**
   * Create or update user profile
   */
  async upsertUserProfile(profile: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(profile)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  /**
   * Get user photos with error handling
   */
  async getUserPhotos(userId: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    try {
      console.log('🔍 Fetching photos for user:', userId);
      
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error fetching photos:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01') {
          console.warn('⚠️ Photos table does not exist. Please run database migrations.');
          return [];
        }
        throw error;
      }

      console.log('✅ Successfully fetched photos:', data?.length || 0, 'photos found');
      return data || [];
    } catch (error) {
      console.error('💥 Error fetching user photos:', error);
      return [];
    }
  },

  /**
   * Upload photo metadata with enhanced debugging
   */
  async uploadPhotoMetadata(photoData: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('📝 Uploading photo metadata to database:', {
      user_id: photoData.user_id,
      filename: photoData.filename,
      file_path: photoData.file_path,
      public_url: photoData.public_url,
      file_size: photoData.file_size,
      mime_type: photoData.mime_type
    });

    try {
      const { data, error } = await supabase
        .from('photos')
        .insert(photoData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Photo metadata saved successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Failed to save photo metadata:', error);
      throw error;
    }
  },

  /**
   * Create folder
   */
  async createFolder(folderData: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('📁 Creating folder:', folderData);

    try {
      const { data, error } = await supabase
        .from('photo_folders')
        .insert(folderData)
        .select()
        .single();

      if (error) {
        console.error('❌ Folder creation error:', error);
        throw error;
      }

      console.log('✅ Folder created successfully:', data);
      return data;
    } catch (error) {
      console.error('💥 Failed to create folder:', error);
      throw error;
    }
  },

  /**
   * Get user folders
   */
  async getUserFolders(userId: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    try {
      console.log('📁 Fetching folders for user:', userId);
      
      const { data, error } = await supabase
        .from('photo_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error fetching folders:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01') {
          console.warn('⚠️ Photo folders table does not exist. Please run database migrations.');
          return [];
        }
        throw error;
      }

      console.log('✅ Successfully fetched folders:', data?.length || 0, 'folders found');
      return data || [];
    } catch (error) {
      console.error('💥 Error fetching user folders:', error);
      return [];
    }
  },

  /**
   * Check if database tables exist
   */
  async checkTablesExist() {
    if (!isSupabaseReady) {
      return { exist: false, error: 'Supabase not configured' };
    }

    try {
      // Try to query each table to see if it exists
      const tables = ['users', 'photos', 'photo_folders', 'audio_recordings'];
      const results = await Promise.allSettled(
        tables.map(async (table) => {
          const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
          return { table, exists: !error };
        })
      );

      const tableStatus = results.map((result, index) => ({
        table: tables[index],
        exists: result.status === 'fulfilled' ? result.value.exists : false
      }));

      const allExist = tableStatus.every(t => t.exists);

      return {
        exist: allExist,
        tables: tableStatus,
        error: null
      };
    } catch (error) {
      return {
        exist: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Storage utilities with enhanced debugging
 */
export const storage = {
  /**
   * Upload file to storage with comprehensive logging
   */
  async uploadFile(bucket: string, path: string, file: File) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('☁️ Starting storage upload:', {
      bucket,
      path,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      timestamp: new Date().toISOString()
    });

    try {
      // Check if bucket exists first
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Failed to list buckets:', bucketsError);
        throw new Error(`Storage error: ${bucketsError.message}`);
      }

      const bucketExists = buckets?.some(b => b.name === bucket);
      if (!bucketExists) {
        console.error(`❌ Bucket '${bucket}' does not exist. Available buckets:`, buckets?.map(b => b.name));
        throw new Error(`Storage bucket '${bucket}' does not exist. Please create it in your Supabase dashboard.`);
      }

      console.log('✅ Bucket exists, proceeding with upload...');

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', {
          code: error.message,
          statusCode: (error as any).statusCode,
          error: error
        });
        
        // Provide more specific error messages
        if (error.message.includes('Duplicate')) {
          throw new Error(`File already exists at ${path}. Please try again or rename the file.`);
        } else if (error.message.includes('Policy')) {
          throw new Error('Storage permission denied. Please check your Supabase storage policies.');
        } else if (error.message.includes('size')) {
          throw new Error('File too large. Please use a smaller file (max 10MB).');
        } else {
          throw new Error(`Storage upload failed: ${error.message}`);
        }
      }

      console.log('✅ Storage upload successful:', {
        path: data.path,
        id: data.id,
        fullPath: data.fullPath
      });

      return data;
    } catch (error) {
      console.error('💥 Storage upload failed:', error);
      throw error;
    }
  },

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('🔗 Generating public URL for:', { bucket, path });

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('✅ Public URL generated:', data.publicUrl);
    return data.publicUrl;
  },

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('🗑️ Deleting file from storage:', { bucket, path });

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('❌ Storage delete error:', error);
      throw error;
    }

    console.log('✅ File deleted successfully');
  }
};

/**
 * Folder service utilities
 */
export const folderService = {
  /**
   * Create a new folder
   */
  async createFolder(name: string, userId: string) {
    console.log('📁 Creating new folder:', { name, userId });
    
    const folderData = {
      name,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return await db.createFolder(folderData);
  },

  /**
   * Get user folders
   */
  async getUserFolders(userId: string) {
    return await db.getUserFolders(userId);
  }
};

/**
 * Photo service utilities with comprehensive error handling
 */
export const photoService = {
  /**
   * Upload photo with metadata and enhanced debugging
   */
  async uploadPhoto(file: File, userId: string, folderId?: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.');
    }

    console.log('📸 Starting photo upload process:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      userId,
      folderId: folderId || 'none',
      timestamp: new Date().toISOString()
    });

    try {
      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large. Please use a file smaller than 10MB.');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, GIF, WebP, or BMP.`);
      }

      console.log('✅ File validation passed');

      // Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('📝 Generated file path:', filePath);

      // Step 1: Upload file to storage
      console.log('⬆️ Step 1: Uploading to storage...');
      const uploadResult = await storage.uploadFile('photos', filePath, file);
      console.log('✅ Storage upload completed');

      // Step 2: Get public URL
      console.log('🔗 Step 2: Generating public URL...');
      const publicUrl = storage.getPublicUrl('photos', filePath);
      console.log('✅ Public URL generated');

      // Step 3: Store metadata in database
      console.log('💾 Step 3: Saving metadata to database...');
      const photoData = {
        user_id: userId,
        folder_id: folderId || null,
        filename: file.name,
        file_path: filePath, // Storage path
        public_url: publicUrl, // Public URL for display
        file_size: file.size,
        mime_type: file.type,
        width: null, // Will be updated when image loads
        height: null, // Will be updated when image loads
        taken_at: null, // Could be extracted from EXIF data
        location: null,
        description: null,
        ai_description: null,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const metadata = await db.uploadPhotoMetadata(photoData);
      console.log('✅ Database metadata saved');

      const result = {
        upload: uploadResult,
        metadata,
        publicUrl,
        filePath
      };

      console.log('🎉 Photo upload completed successfully:', {
        id: metadata.id,
        filename: metadata.filename,
        publicUrl: result.publicUrl
      });

      return result;
    } catch (error) {
      console.error('💥 Photo upload failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
        userId,
        timestamp: new Date().toISOString()
      });
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Upload failed: ${error.message}`);
      } else {
        throw new Error('Upload failed: Unknown error occurred');
      }
    }
  },

  /**
   * Get user photos
   */
  async getUserPhotos(userId: string) {
    return await db.getUserPhotos(userId);
  }
};

export default supabase;