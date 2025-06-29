/**
 * Enhanced storage bucket setup component with automatic RLS fix
 * Now includes one-click fix for the 403 Forbidden error
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
            avatar_url: user.avatar_url || null,
            preferences: {
              ai_assistant_name: 'Sunny',
              night_mode_start: '20:00',
              night_mode_end: '07:00'
            },
            emergency_contacts: [],
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
      alert('🎉 SUCCESS! The 403 Forbidden error has been fixed!\n\n✅ User profile created\n✅ Storage buckets verified\n✅ Upload permissions working\n\nYou can now upload your DSC03565.JPG file!');
      
      // Refresh bucket status
      await checkBuckets();
      
    } catch (error) {
      console.error('💥 Quick fix failed:', error);
      alert(`❌ Quick fix failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try the manual steps or contact support.`);
    } finally {
      setQuickFixing(false);
    }
  };

  /**
   * Your custom bucket testing function - integrated into the component
   */
  const testListBuckets = async () => {
    console.log('🧪 Running your custom bucket test...');
    
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        return {
          success: false,
          error: error.message,
          data: null
        };
      } else {
        console.log('Buckets:', data);
        return {
          success: true,
          error: null,
          data: data
        };
      }
    } catch (err) {
      console.error('Exception in testListBuckets:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        data: null
      };
    }
  };

  const runComprehensiveTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const results: TestResult[] = [];

    // Test 1: Your custom bucket listing test
    console.log('🧪 Test 1: Custom Bucket Listing Test');
    const bucketListResult = await testListBuckets();
    
    results.push({
      name: 'Custom Bucket Listing Test',
      status: bucketListResult.success ? 'success' : 'error',
      message: bucketListResult.success 
        ? `Found ${bucketListResult.data?.length || 0} buckets`
        : 'Failed to list buckets',
      details: bucketListResult.error || `Buckets: ${bucketListResult.data?.map(b => b.name).join(', ') || 'none'}`,
      data: bucketListResult.data
    });

    setTestResults([...results]);

    // Test 2: Required Buckets Check
    console.log('🧪 Test 2: Required Buckets Check');
    
    if (bucketListResult.success && bucketListResult.data) {
      const existingBucketNames = bucketListResult.data.map(b => b.name);
      const missingBuckets = requiredBuckets.filter(rb => !existingBucketNames.includes(rb.name));
      const foundBuckets = requiredBuckets.filter(rb => existingBucketNames.includes(rb.name));

      results.push({
        name: 'Required Buckets Check',
        status: missingBuckets.length === 0 ? 'success' : 'warning',
        message: `${foundBuckets.length}/${requiredBuckets.length} required buckets found`,
        details: missingBuckets.length > 0 
          ? `Missing: ${missingBuckets.map(b => b.name).join(', ')}`
          : 'All required buckets exist',
        data: { found: foundBuckets.map(b => b.name), missing: missingBuckets.map(b => b.name) }
      });
    } else {
      results.push({
        name: 'Required Buckets Check',
        status: 'error',
        message: 'Cannot check required buckets',
        details: 'Bucket listing failed',
      });
    }

    setTestResults([...results]);

    // Test 3: User Profile Check (this fixes the RLS policy error)
    console.log('🧪 Test 3: User Profile Check');
    
    if (user) {
      try {
        // Check if user profile exists in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist - this is the cause of the RLS policy error!
          results.push({
            name: 'User Profile Check',
            status: 'error',
            message: 'User profile missing in profiles table',
            details: 'This is causing the "New row violates new-row security policy" error. Use Quick Fix to resolve.',
            data: { userId: user.id, profileExists: false }
          });
        } else if (profileError) {
          results.push({
            name: 'User Profile Check',
            status: 'error',
            message: 'Error checking user profile',
            details: profileError.message,
            data: { userId: user.id, error: profileError }
          });
        } else {
          results.push({
            name: 'User Profile Check',
            status: 'success',
            message: 'User profile exists in profiles table',
            details: `Profile found for user ${user.id}`,
            data: { userId: user.id, profileExists: true }
          });
        }
      } catch (profileCheckError) {
        results.push({
          name: 'User Profile Check',
          status: 'error',
          message: 'User profile check failed',
          details: profileCheckError instanceof Error ? profileCheckError.message : 'Unknown error',
        });
      }
    } else {
      results.push({
        name: 'User Profile Check',
        status: 'warning',
        message: 'No authenticated user',
        details: 'Sign in to check user profile',
      });
    }

    setTestResults([...results]);

    // Test 4: Upload Permission Test
    console.log('🧪 Test 4: Upload Permission Test');
    
    if (user) {
      try {
        // Test if we can upload a small test file
        const testContent = 'Test upload for MyLifePictures.ai';
        const testFile = new Blob([testContent], { type: 'text/plain' });
        const testPath = `${user.id}/test-${Date.now()}.txt`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(testPath, testFile);

        if (uploadError) {
          results.push({
            name: 'Upload Permission Test',
            status: 'error',
            message: 'Upload test failed',
            details: `Error: ${uploadError.message}. This indicates the 403/RLS policy issue.`,
            data: { error: uploadError }
          });
        } else {
          // Clean up test file
          await supabase.storage.from('photos').remove([testPath]);
          
          results.push({
            name: 'Upload Permission Test',
            status: 'success',
            message: 'Upload permissions working correctly',
            details: 'Successfully uploaded and deleted test file',
            data: { testPath }
          });
        }
      } catch (uploadTestError) {
        results.push({
          name: 'Upload Permission Test',
          status: 'error',
          message: 'Upload permission test failed',
          details: uploadTestError instanceof Error ? uploadTestError.message : 'Unknown error',
        });
      }
    } else {
      results.push({
        name: 'Upload Permission Test',
        status: 'warning',
        message: 'No authenticated user',
        details: 'Sign in to test upload permissions',
      });
    }

    setTestResults([...results]);

    // Test 5: Overall Health Check
    console.log('🧪 Test 5: Overall Health Check');
    
    const successCount = results.filter(r => r.status === 'success').length;
    const totalTests = results.length;
    const healthScore = (successCount / totalTests) * 100;

    results.push({
      name: 'Overall Health Check',
      status: healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'error',
      message: `Storage health: ${healthScore.toFixed(0)}% (${successCount}/${totalTests} tests passed)`,
      details: healthScore >= 80 
        ? 'Storage is ready for photo uploads' 
        : 'Some issues detected - use Quick Fix to resolve',
      data: { healthScore, successCount, totalTests }
    });

    setTestResults([...results]);
    setTesting(false);

    console.log('🎉 Comprehensive storage tests completed!');
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

  const copyInstructions = () => {
    const instructions = `
# FIXED: 403 Forbidden Error Solution for MyLifePictures.ai

## The Problem:
The "Failed to load resource: the server responded with a status of 403" error was caused by:
1. Missing user profile in the 'profiles' table
2. RLS (Row Level Security) policies requiring this profile to exist
3. Storage operations failing due to policy violations

## The Solution:
✅ FIXED: User profile is now automatically created when you sign in/up
✅ FIXED: RLS policies now work correctly
✅ FIXED: Storage uploads should work without 403 errors

## Your Custom Test Function (now working):
async function testListBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets:', data);
    }
}

## Required Buckets:
1. photos (public) - For user uploaded images
2. audio (public) - For voice recordings

## Quick Test:
1. Use the "Quick Fix 403 Error" button above
2. Try uploading your DSC03565.JPG file
3. It should work without 403 errors now!

## Manual Verification:
1. Go to Supabase Dashboard > Authentication > Users
2. Verify your user exists
3. Go to Database > profiles table
4. Verify your profile record exists
5. Go to Storage > photos bucket
6. Try uploading a file - should work!
`;
    
    navigator.clipboard.writeText(instructions);
    alert('Fixed instructions copied to clipboard!');
  };

  const allBucketsExist = buckets.length > 0 && buckets.every(bucket => bucket.exists);
  const anyBucketMissing = buckets.some(bucket => !bucket.exists);

  const getTestStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const getTestStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

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

      {/* User Profile Status */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              User Profile Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Current User Information:</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Full Name:</strong> {user.full_name || 'Not set'}</p>
              </div>
              <p className="text-sm text-blue-700 mt-3">
                The 403 error occurs when this user doesn't have a corresponding record in the 'profiles' table. 
                The quick fix button above will create this profile record automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Comprehensive Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Comprehensive Storage & 403 Error Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🧪 Complete Diagnostic Test</h4>
              <p className="text-sm text-blue-800 mb-3">
                This test includes your custom <code className="bg-blue-100 px-1 rounded">testListBuckets()</code> function 
                plus tests for user profiles, upload permissions, and 403 error detection.
              </p>
              
              <Button
                variant="primary"
                size="lg"
                onClick={runComprehensiveTests}
                disabled={testing}
                loading={testing}
                fullWidth
              >
                <Play className="w-5 h-5 mr-2" />
                {testing ? 'Running Comprehensive Tests...' : 'Run Complete Diagnostic Tests'}
              </Button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Test Results:</h4>
                {testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${getTestStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getTestStatusIcon(result.status)}
                      <div className="flex-1">
                        <h5 className="font-medium">{result.name}</h5>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.details && (
                          <p className="text-xs mt-2 opacity-75 font-mono bg-black/5 p-2 rounded">
                            {result.details}
                          </p>
                        )}
                        {result.data && import.meta.env.DEV && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer">Show raw data</summary>
                            <pre className="text-xs mt-1 bg-black/5 p-2 rounded overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border-2 ${
            allBucketsExist 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {allBucketsExist ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {allBucketsExist ? 'Storage Ready' : 'Storage Setup Required'}
              </span>
            </div>
            <p className="text-sm">
              {allBucketsExist 
                ? 'All required storage buckets are configured and ready for use.'
                : 'Some storage buckets are missing. Photo uploads will fail until these are created.'
              }
            </p>
          </div>

          <div className="mt-4 flex gap-3">
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
              variant="ghost"
              size="md"
              onClick={copyInstructions}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Fix Instructions
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

      {/* Ready for Upload */}
      {allBucketsExist && (
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Ready for Photo Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 mb-3">
                ✅ Storage buckets are ready and 403 errors should be fixed! You can now upload your DSC03565.JPG file.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => window.location.href = '#photos'}
                className="w-full"
              >
                <Upload className="w-5 h-5 mr-2" />
                Go to Photo Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}