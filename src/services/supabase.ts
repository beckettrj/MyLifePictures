/**
 * Supabase client configuration and utilities
 * Updated to work with BIGINT schema and proper file upload
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
 * Authentication utilities - NO database calls
 */
export const auth = {
  /**
   * Get current user - NO database calls
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
    
    // After successful sign in, update user_id_uuid in photos table
    if (data.user) {
      try {
        console.log('Updating user_id_uuid in photos table for user:', data.user.id);
        
        // Update all photos that don't have a user_id_uuid set
        const { error: updateError } = await supabase
          .from('photos')
          .update({ user_id_uuid: data.user.id })
          .is('user_id_uuid', null);
          
        if (updateError) {
          console.error('Error updating user_id_uuid in photos:', updateError);
        } else {
          console.log('Successfully updated user_id_uuid in photos table');
        }
      } catch (updateError) {
        console.error('Failed to update user_id_uuid in photos:', updateError);
      }
    }
    
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, options?: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.');
    }

    console.log('🔐 Attempting sign up for:', email);
    console.log('🌐 Using redirect URL:', `${window.location.origin}/auth/callback`);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: options?.options?.emailRedirectTo || `${window.location.origin}/auth/callback`,
        data: {
          full_name: options?.data?.full_name || '',
          ...options?.data
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
  async resendConfirmation(email: string, options?: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('📧 Resending confirmation email to:', email);
    console.log('🌐 Using redirect URL:', options?.emailRedirectTo || `${window.location.origin}/auth/callback`);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: options?.emailRedirectTo || `${window.location.origin}/auth/callback`
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

    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      // When user signs in, update user_id_uuid in photos table
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          console.log('Updating user_id_uuid in photos table for user:', session.user.id);
          
          // Update all photos that don't have a user_id_uuid set
          const { error: updateError } = await supabase
            .from('photos')
            .update({ user_id_uuid: session.user.id })
            .is('user_id_uuid', null);
            
          if (updateError) {
            console.error('Error updating user_id_uuid in photos:', updateError);
          } else {
            console.log('Successfully updated user_id_uuid in photos table');
          }
        } catch (updateError) {
          console.error('Failed to update user_id_uuid in photos:', updateError);
        }
      }
      
      callback(event, session);
    });
  }
};

/**
 * Database utilities - OPTIONAL, only used when needed, with BIGINT support
 */
export const db = {
  /**
   * Get user profile from profiles table - OPTIONAL
   */
  async getUserProfile(userId: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('👤 Getting user profile from profiles table for:', userId);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error getting user profile:', error);
        throw error;
      }

      console.log('✅ User profile retrieved:', data?.id);
      return data;
    } catch (err) {
      console.error('💥 Failed to get user profile:', err);
      throw err;
    }
  },

  /**
   * Create or update user profile in profiles table - OPTIONAL
   */
  async upsertUserProfile(profile: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('👤 Upserting user profile in profiles table');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single();

      if (error) {
        console.error('❌ Error upserting user profile:', error);
        throw error;
      }

      console.log('✅ User profile upserted:', data?.id);
      return data;
    } catch (err) {
      console.error('💥 Failed to upsert user profile:', err);
      throw err;
    }
  },

  /**
   * Get user photos with error handling - OPTIONAL
   */
  async getUserPhotos(userId: string) {
    if (!isSupabaseReady) {
      console.warn('Supabase not configured - returning empty photos array');
      return [];
    }

    try {
      console.log('🔍 Fetching photos for user:', userId);
      
      // Try to get photos by user_id_uuid (UUID)
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id_uuid', userId);

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
   * Upload photo metadata with enhanced debugging - OPTIONAL
   */
  async uploadPhotoMetadata(photoData: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('📝 Uploading photo metadata to database:', {
      folder_id: photoData.folder_id,
      display_name: photoData.display_name,
      file_size: photoData.file_size,
      user_id_uuid: photoData.user_id_uuid
    });

    try {
      // Adapt to your schema structure
      const adaptedPhotoData = {
        folder_id: photoData.folder_id || 1, // Default to folder ID 1
        display_name: photoData.display_name || photoData.filename,
        created_at: photoData.created_at || new Date().toISOString(),
        user_id_uuid: photoData.user_id_uuid // Include user_id_uuid
      };

      const { data, error } = await supabase
        .from('photos')
        .insert(adaptedPhotoData)
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
   * Get user folders - Using folders table - OPTIONAL
   */
  async getUserFolders(userId: string) {
    if (!isSupabaseReady) {
      console.warn('Supabase not configured - returning empty folders array');
      return [];
    }

    try {
      console.log('📁 Fetching folders for user:', userId);
      
      // Try to get folders by user_id (BIGINT) or user_id_uuid (UUID)
      const { data, error } = await supabase
        .from('folders')
        .select('*');

      if (error) {
        console.error('❌ Database error fetching folders:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01') {
          console.warn('⚠️ Folders table does not exist. Please run database migrations.');
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
   * Create folder - Using folders table - OPTIONAL
   */
  async createFolder(folderData: any) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured');
    }

    console.log('📁 Creating folder:', folderData);

    try {
      // Adapt to your schema structure
      const adaptedFolderData = {
        name: folderData.name,
        user_id: 1, // Default to user ID 1 for testing with BIGINT
        user_id_uuid: folderData.user_id, // Include UUID user ID
        created_at: folderData.created_at || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('folders')
        .insert(adaptedFolderData)
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
   * Check if database tables exist - OPTIONAL
   */
  async checkTablesExist() {
    if (!isSupabaseReady) {
      return { exist: false, error: 'Supabase not configured' };
    }

    try {
      // Test if tables exist by trying to query them
      const tables = [
        { name: 'profiles', query: () => supabase.from('profiles').select('count', { count: 'exact', head: true }) },
        { name: 'photos', query: () => supabase.from('photos').select('count', { count: 'exact', head: true }) },
        { name: 'folders', query: () => supabase.from('folders').select('count', { count: 'exact', head: true }) },
        { name: 'audio_recordings', query: () => supabase.from('audio_recordings').select('count', { count: 'exact', head: true }) }
      ];

      const results = await Promise.allSettled(
        tables.map(async (table) => {
          try {
            const { error } = await table.query();
            return { table: table.name, exists: !error };
          } catch (err) {
            return { table: table.name, exists: false };
          }
        })
      );

      const tableStatus = results.map((result, index) => ({
        table: tables[index].name,
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
 * Storage utilities with enhanced error handling
 */
export const storage = {
  // Expose supabase instance for direct access
  supabase,

  /**
   * Check if storage buckets exist
   */
  async checkStorageBuckets() {
    try {
      const { data, error } = await supabase.storage.from('photos').list();
      if (error) {
        console.error('Error fetching buckets:', error);
        return [];
      }
      console.log('Available files in photos bucket:', data);
      return data;
    } catch (error) {
      console.error('Error checking storage buckets:', error);
      return [];
    }
  },

  /**
   * Upload file to storage using Supabase example pattern
   */
  async uploadFile(file: File, userId: string) {
    if (!isSupabaseReady) {
      throw new Error('Supabase not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.');
    }

    console.log('☁️ Starting storage upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      userId: userId,
      timestamp: new Date().toISOString()
    });

    try {
      // Validate file type using the pattern from your example
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        console.error('Unsupported file type');
        throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or GIF.`);
      }

      // Generate a unique filename to avoid duplicates
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const uniqueFileName = `${timestamp}-${randomId}.${fileExt}`;

      // Use the exact pattern from your Supabase example
      const { data, error } = await supabase.storage
        .from('photos')
        .upload(`public/${uniqueFileName}`, file);

      if (error) {
        console.error('❌ Storage upload error:', {
          code: error.message,
          statusCode: (error as any).statusCode,
          error: error
        });
        
        throw error;
      }

      console.log('✅ Storage upload successful:', {
        path: data.path,
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
 * Folder service utilities - OPTIONAL
 */
export const folderService = {
  /**
   * Create a new folder
   */
  async createFolder(name: string, userId: string) {
    console.log('📁 Creating new folder:', { name, userId });
    
    const folderData = {
      name,
      user_id: 1, // Default to user ID 1 for testing with BIGINT
      user_id_uuid: userId, // Include UUID user ID
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
   * Upload photo with metadata using Supabase example pattern and BIGINT schema
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
      // Validate file using the pattern from your example
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        console.error('Unsupported file type');
        throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or GIF.`);
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large. Please use a file smaller than 10MB.');
      }

      console.log('✅ File validation passed');

      // Generate a unique filename to avoid duplicates
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const uniqueFileName = `${timestamp}-${randomId}.${fileExt}`;

      // Step 1: Upload file to storage using your example pattern
      console.log('⬆️ Step 1: Uploading to storage with unique filename:', uniqueFileName);
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(`public/${uniqueFileName}`, file);

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Storage upload completed');

      // Step 2: Get public URL
      console.log('🔗 Step 2: Generating public URL...');
      const publicUrl = storage.getPublicUrl('photos', uploadResult.path);
      console.log('✅ Public URL generated');

      // Step 3: Store metadata in database (optional - only if database is available)
      console.log('💾 Step 3: Saving metadata to database...');
      let metadata = null;
      
      try {
        // Map to your actual schema structure
        const photoData = {
          // Use the correct column names from your schema
          folder_id: folderId ? parseInt(folderId) : 1, // BIGINT folder ID
          display_name: file.name,
          created_at: new Date().toISOString(),
          user_id_uuid: userId // Set the user_id_uuid to the current user's ID
        };

        metadata = await db.uploadPhotoMetadata(photoData);
        console.log('✅ Database metadata saved');
      } catch (dbError) {
        console.warn('⚠️ Database metadata save failed (continuing without database):', dbError);
        // Continue without database - storage upload was successful
      }

      const result = {
        upload: uploadResult,
        metadata,
        publicUrl,
        filePath: uploadResult.path
      };

      console.log('🎉 Photo upload completed successfully:', {
        id: metadata?.id || 'no-db',
        filename: file.name,
        publicUrl: result.publicUrl,
        user_id_uuid: userId
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