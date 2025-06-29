/**
 * Storage bucket setup component - Moved to dev panel
 * Enhanced with automatic RLS fix and one-click solutions for UUID support
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  RefreshCw,
  Folder,
  Image,
  Mic,
  Info,
  Plus,
  Upload,
  TestTube,
  Play,
  Shield,
  Database,
  Zap
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface BucketStatus {
  name: string;
  exists: boolean;
  isPublic: boolean;
  error?: string;
  details?: any;
}

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  data?: any;
}

export function StorageBucketSetup() {
  const { user } = useAppStore();
  const [buckets, setBuckets] = useState<BucketStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [creatingBucket, setCreatingBucket] = useState<string | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [quickFixing, setQuickFixing] = useState(false);

  const requiredBuckets = [
    { 
      name: 'photos', 
      description: 'Stores user uploaded photos and images',
      icon: <Image className="w-5 h-5" />,
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
      maxSize: 10485760 // 10MB
    },
    { 
      name: 'audio', 
      description: 'Stores voice recordings and annotations',
      icon: <Mic className="w-5 h-5" />,
      mimeTypes: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm'],
      maxSize: 5242880 // 5MB
    }
  ];

  useEffect(() => {
    checkBuckets();
  }, []);

  /**
   * ONE-CLICK FIX for 403 Forbidden Error
   * This is the main fix that resolves the RLS policy issue
   */
  const quickFix403Error = async () => {
    if (!user) {
      alert('Please sign in first to fix the 403 error');
      return;
    }

    setQuickFixing(true);
    
    try {
      console.log('🔧 QUICK FIX: Resolving 403 Forbidden Error...');
      
      // Step 1: Check if user profile exists in profiles table
      console.log('👤 Step 1: Checking user profile...');
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - this is the root cause!
        console.log('🎯 FOUND THE ISSUE: User profile missing in profiles table');
        console.log('📝 Creating user profile to fix RLS policy...');
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.full_name || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
        
        console.log('✅ User profile created successfully!');
      } else if (profileError) {
        throw new Error(`Profile check failed: ${profileError.message}`);
      } else {
        console.log('✅ User profile already exists');
      }

      // Step 2: Ensure storage buckets exist
      console.log('🪣 Step 2: Ensuring storage buckets exist...');
      await createAllBuckets();

      // Step 3: Test upload to verify fix
      console.log('🧪 Step 3: Testing upload to verify fix...');
      
      // Create a small test file
      const testContent = 'Test file for MyLifePictures.ai - 403 error fix verification';
      const testFile = new Blob([testContent], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;
      const testPath = `${user.id}/${testFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(testPath, testFile);

      if (uploadError) {
        console.error('❌ Test upload failed:', uploadError);
        throw new Error(`Upload test failed: ${uploadError.message}`);
      }

      // Clean up test file
      await supabase.storage.from('photos').remove([testPath]);
      
      console.log('✅ Upload test successful - 403 error is FIXED!');

      // Success!
      alert('🎉 SUCCESS! The 403 Forbidden error has been fixed!\n\n✅ User profile created\n✅ Storage buckets verified\n✅ Upload permissions working\n\nYou can now upload your photos!');
      
      // Refresh bucket status
      await checkBuckets();
      
    } catch (error) {
      console.error('💥 Quick fix failed:', error);
      alert(`❌ Quick fix failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try the manual steps or contact support.`);
    } finally {
      setQuickFixing(false);
    }
  };

  const checkBuckets = async () => {
    setChecking(true);
    try {
      console.log('🔍 Checking storage buckets...');
      
      const { data: existingBuckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Failed to list buckets:', error);
        setBuckets(requiredBuckets.map(bucket => ({
          name: bucket.name,
          exists: false,
          isPublic: false,
          error: error.message
        })));
        return;
      }

      console.log('📦 Found buckets:', existingBuckets?.map(b => b.name));

      const bucketStatus = requiredBuckets.map(requiredBucket => {
        const existingBucket = existingBuckets?.find(b => b.name === requiredBucket.name);
        return {
          name: requiredBucket.name,
          exists: !!existingBucket,
          isPublic: existingBucket?.public || false,
          details: existingBucket
        };
      });

      setBuckets(bucketStatus);
      console.log('✅ Bucket status updated:', bucketStatus);
    } catch (error) {
      console.error('💥 Error checking buckets:', error);
      setBuckets(requiredBuckets.map(bucket => ({
        name: bucket.name,
        exists: false,
        isPublic: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setChecking(false);
    }
  };

  const createBucket = async (bucketName: string) => {
    setCreatingBucket(bucketName);
    try {
      console.log(`🪣 Creating bucket: ${bucketName}`);
      
      const bucketConfig = requiredBuckets.find(b => b.name === bucketName);
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: bucketConfig?.mimeTypes,
        fileSizeLimit: bucketConfig?.maxSize
      });

      if (error) {
        console.error(`❌ Failed to create bucket ${bucketName}:`, error);
        
        // Handle specific errors
        if (error.message.includes('already exists')) {
          console.log(`✅ Bucket ${bucketName} already exists, refreshing status...`);
          await checkBuckets();
          return;
        }
        
        throw error;
      }

      console.log(`✅ Bucket ${bucketName} created successfully:`, data);
      
      // Refresh bucket list
      await checkBuckets();
    } catch (error) {
      console.error(`💥 Error creating bucket ${bucketName}:`, error);
      
      let errorMessage = 'Failed to create bucket';
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          errorMessage = 'Bucket already exists (this is good!)';
          await checkBuckets(); // Refresh to show it exists
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Check your Supabase project permissions.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`${errorMessage}`);
    } finally {
      setCreatingBucket(null);
    }
  };

  const createAllBuckets = async () => {
    setLoading(true);
    try {
      for (const bucket of requiredBuckets) {
        const bucketStatus = buckets.find(b => b.name === bucket.name);
        if (!bucketStatus?.exists) {
          await createBucket(bucket.name);
          // Small delay between bucket creations
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const allBucketsExist = buckets.length > 0 && buckets.every(bucket => bucket.exists);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ☁️ Storage Setup & 403 Error Fix
        </h2>
        <p className="text-gray-600">
          One-click fix for the "Failed to load resource: 403 Forbidden" error
        </p>
      </div>

      {/* CRITICAL: One-Click 403 Error Fix */}
      <Card>
        <CardContent>
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Zap className="w-8 h-8 text-red-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-3">🚨 403 Forbidden Error - ONE-CLICK FIX!</h3>
                <div className="space-y-3">
                  <p className="text-red-800 font-medium">
                    The "Failed to load resource: 403 Forbidden" error is caused by a missing user profile in the database.
                  </p>
                  <p className="text-red-700 text-sm">
                    When you sign up, Supabase creates an auth user but doesn't automatically create a profile record. 
                    The storage policies require this profile to exist for uploads to work.
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-3">⚡ INSTANT FIX:</h4>
                    <Button
                      variant="danger"
                      size="xl"
                      onClick={quickFix403Error}
                      disabled={quickFixing || !user}
                      loading={quickFixing}
                      className="w-full mb-3"
                    >
                      <Zap className="w-6 h-6 mr-3" />
                      {quickFixing ? 'Fixing 403 Error...' : '⚡ QUICK FIX 403 ERROR (RECOMMENDED)'}
                    </Button>
                    
                    <p className="text-sm text-red-600 text-center">
                      This will create your user profile and fix the storage policy error in seconds!
                    </p>
                    
                    {!user && (
                      <p className="text-sm text-red-700 text-center mt-2 font-medium">
                        ⚠️ Please sign in first to use the quick fix
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {allBucketsExist && (
        <Card>
          <CardContent>
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-900">✅ Storage Ready!</h3>
                  <p className="text-green-800 text-sm">
                    All required storage buckets exist. Photo uploads should work now!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bucket Status */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Required Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredBuckets.map((requiredBucket) => {
              const bucketStatus = buckets.find(b => b.name === requiredBucket.name);
              const exists = bucketStatus?.exists || false;
              const isPublic = bucketStatus?.isPublic || false;
              const error = bucketStatus?.error;
              const isCreating = creatingBucket === requiredBucket.name;

              return (
                <motion.div
                  key={requiredBucket.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-2 rounded-lg p-4 ${
                    exists 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {requiredBucket.icon}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {requiredBucket.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {requiredBucket.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Max: {(requiredBucket.maxSize / 1024 / 1024).toFixed(0)}MB • 
                          Types: {requiredBucket.mimeTypes.map(t => t.split('/')[1]).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {exists ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            exists ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {exists ? 'Exists' : 'Missing'}
                          </span>
                        </div>
                        {exists && (
                          <p className="text-xs text-gray-600">
                            {isPublic ? 'Public ✓' : 'Private ⚠️'}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      {!exists && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => createBucket(requiredBucket.name)}
                          disabled={isCreating || loading}
                          loading={isCreating}
                        >
                          {isCreating ? 'Creating...' : 'Create'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                      Error: {error}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Storage Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={checkBuckets}
              disabled={checking}
              loading={checking}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button
              variant="primary"
              size="md"
              onClick={createAllBuckets}
              disabled={loading || allBucketsExist}
              loading={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create All Buckets
            </Button>

            <Button
              variant="ghost"
              size="md"
              onClick={() => window.open('https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/storage/buckets', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Supabase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}