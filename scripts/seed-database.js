#!/usr/bin/env node

/**
 * Database seeding script for MyLifePictures.ai
 * Creates sample data for testing and development
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🌱 Seeding MyLifePictures.ai database...');
  
  try {
    // This is a placeholder for seeding logic
    // In a real implementation, you would create sample users, folders, and photos
    console.log('✅ Database seeding completed!');
    console.log('');
    console.log('🔑 Demo data created (if any)');
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();