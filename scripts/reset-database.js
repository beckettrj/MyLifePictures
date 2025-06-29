#!/usr/bin/env node

/**
 * Database reset script for MyLifePictures.ai
 * WARNING: This will delete all data!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetDatabase() {
  console.log('🗑️ Resetting MyLifePictures.ai database...');
  console.log('⚠️ WARNING: This will delete ALL data!');
  
  try {
    const tables = ['ai_annotations', 'audio_recordings', 'photos', 'photo_folders', 'emergency_contacts', 'users'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error && !error.message.includes('does not exist')) {
          console.error(`❌ Failed to clear ${table}:`, error.message);
        } else {
          console.log(`✅ Cleared table: ${table}`);
        }
      } catch (err) {
        console.log(`⚠️ Table ${table} may not exist, skipping...`);
      }
    }
    
    console.log('✅ Database reset completed!');
    console.log('📝 Run npm run db:setup to recreate schema');
    
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();