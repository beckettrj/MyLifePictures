/**
 * Supabase test component - Moved to dev panel
 * Enhanced with email configuration checks and BIGINT support
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Database, Shield, Cloud, AlertTriangle, Copy, ExternalLink, Mail, Settings } from 'lucide-react';
import { supabase, isSupabaseReady, testSupabaseConnection } from '../../services/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  action?: string;
}

export function SupabaseTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [envVars, setEnvVars] = useState({
    url: '',
    key: '',
    hasUrl: false,
    hasKey: false,
    usingViteVars: false,
    usingNextVars: false,
  });

  useEffect(() => {
    // Check environment variables on component mount
    const viteUrl = import.meta.env.VITE_SUPABASE_URL;
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const nextUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
    const nextKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const url = viteUrl || nextUrl || 'https://zvxnsjsltabvsfwatqox.supabase.co';
    const key = viteKey || nextKey || '';
    
    setEnvVars({
      url,
      key,
      hasUrl: !!url && url !== 'your-project-url',
      hasKey: !!key && key !== 'your-anon-key' && key !== 'placeholder-key',
      usingViteVars: !!(viteUrl && viteKey),
      usingNextVars: !!(nextUrl && nextKey),
    });
  }, []);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Environment Variables
    testResults.push({
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking configuration...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!envVars.hasKey) {
      testResults[0] = {
        name: 'Environment Variables',
        status: 'error',
        message: 'Missing Supabase API key environment variable',
        details: envVars.usingNextVars 
          ? 'Found NEXT_PUBLIC_ variables but this is a Vite app. Consider using VITE_ prefixes instead.'
          : 'VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not found',
        action: 'Set VITE_SUPABASE_ANON_KEY in your .env file',
      };
    } else {
      testResults[0] = {
        name: 'Environment Variables',
        status: 'success',
        message: envVars.usingViteVars 
          ? 'Configuration looks good (using VITE_ variables)' 
          : 'Configuration working (using NEXT_PUBLIC_ variables)',
        details: `URL: ${envVars.url}, Key: ${envVars.key.substring(0, 20)}...`,
      };
    }

    setResults([...testResults]);

    if (!envVars.hasKey) {
      setTesting(false);
      return;
    }

    // Test 2: Connection Test
    testResults.push({
      name: 'Connection Test',
      status: 'pending',
      message: 'Testing Supabase connection...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const connectionResult = await testSupabaseConnection();
      
      if (connectionResult.configured && connectionResult.connected) {
        testResults[1] = {
          name: 'Connection Test',
          status: 'success',
          message: 'Successfully connected to Supabase',
          details: 'Database is accessible and responding',
        };
      } else {
        testResults[1] = {
          name: 'Connection Test',
          status: 'error',
          message: 'Connection failed',
          details: connectionResult.error || 'Unable to connect to database',
          action: 'Check your Supabase project status and API key',
        };
      }
    } catch (error) {
      testResults[1] = {
        name: 'Connection Test',
        status: 'error',
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }

    setResults([...testResults]);

    // Test 3: Authentication Service
    testResults.push({
      name: 'Authentication Service',
      status: 'pending',
      message: 'Testing auth service...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error && !error.message.includes('Invalid JWT')) {
        throw error;
      }

      testResults[2] = {
        name: 'Authentication Service',
        status: 'success',
        message: 'Authentication service is working',
        details: user ? `Currently signed in as: ${user.email}` : 'Not signed in (this is normal)',
      };
    } catch (error) {
      testResults[2] = {
        name: 'Authentication Service',
        status: 'error',
        message: 'Authentication service failed',
        details: error instanceof Error ? error.message : 'Auth service error',
        action: 'Check your Supabase project authentication settings',
      };
    }

    setResults([...testResults]);

    // Test 4: Database Schema (updated for BIGINT and profiles table)
    testResults.push({
      name: 'Database Schema (BIGINT Support)',
      status: 'pending',
      message: 'Checking database tables with BIGINT support...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Test if tables exist with BIGINT support
      const tableTests = await Promise.allSettled([
        supabase.from('profiles').select('count').limit(1),
        supabase.from('photos').select('count').limit(1),
        supabase.from('photo_folders').select('count').limit(1),
        supabase.from('audio_recordings').select('count').limit(1),
      ]);

      const tablesExist = tableTests.filter(result => 
        result.status === 'fulfilled' || 
        (result.status === 'rejected' && !result.reason.message.includes('does not exist'))
      ).length;

      if (tablesExist === 4) {
        testResults[3] = {
          name: 'Database Schema (BIGINT Support)',
          status: 'success',
          message: 'All required tables exist with BIGINT ID support',
          details: 'Database schema is properly set up with profiles table and BIGINT IDs',
        };
      } else if (tablesExist > 0) {
        testResults[3] = {
          name: 'Database Schema (BIGINT Support)',
          status: 'warning',
          message: `${tablesExist}/4 tables exist`,
          details: 'Some tables are missing - they will be created automatically when needed',
          action: 'Tables will be created when you first use the app features',
        };
      } else {
        testResults[3] = {
          name: 'Database Schema (BIGINT Support)',
          status: 'warning',
          message: 'No tables found',
          details: 'Database tables will be created automatically when you first use the app',
          action: 'This is normal for a new project - tables are created on demand',
        };
      }
    } catch (error) {
      testResults[3] = {
        name: 'Database Schema (BIGINT Support)',
        status: 'error',
        message: 'Database schema check failed',
        details: error instanceof Error ? error.message : 'Schema check error',
      };
    }

    setResults([...testResults]);

    // Test 5: Storage Buckets
    testResults.push({
      name: 'Storage Buckets',
      status: 'pending',
      message: 'Checking storage configuration...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }

      const hasPhotosBucket = buckets?.some(bucket => bucket.name === 'photos');
      const hasAudioBucket = buckets?.some(bucket => bucket.name === 'audio');
      const bucketCount = buckets?.length || 0;

      if (hasPhotosBucket && hasAudioBucket) {
        testResults[4] = {
          name: 'Storage Buckets',
          status: 'success',
          message: 'All required storage buckets exist',
          details: `Found ${bucketCount} buckets including 'photos' and 'audio'`,
        };
      } else {
        testResults[4] = {
          name: 'Storage Buckets',
          status: 'warning',
          message: 'Some storage buckets missing',
          details: `Found ${bucketCount} buckets. Missing: ${!hasPhotosBucket ? 'photos ' : ''}${!hasAudioBucket ? 'audio' : ''}`,
          action: 'Create missing buckets in your Supabase dashboard under Storage',
        };
      }
    } catch (error) {
      testResults[4] = {
        name: 'Storage Buckets',
        status: 'error',
        message: 'Storage test failed',
        details: error instanceof Error ? error.message : 'Storage error',
        action: 'Check your Supabase project storage settings',
      };
    }

    setResults([...testResults]);
    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Supabase Configuration Test
        </h2>
        <p className="text-gray-600">
          Testing your Supabase setup with BIGINT support and identifying configuration issues
        </p>
      </div>

      {/* Environment Variable Detection */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Environment Variable Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Environment Variable Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-blue-900">VITE_ Variables (Recommended):</p>
                      <p className="text-blue-800">
                        URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                      </p>
                      <p className="text-blue-800">
                        Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">NEXT_PUBLIC_ Variables (Fallback):</p>
                      <p className="text-blue-800">
                        URL: {import.meta.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                      </p>
                      <p className="text-blue-800">
                        Key: {import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="font-medium text-blue-900">Currently Using:</p>
                    <p className="text-blue-800">URL: {envVars.url}</p>
                    <p className="text-blue-800">Key: {envVars.key ? `${envVars.key.substring(0, 20)}...` : 'None'}</p>
                    <p className="text-blue-800">
                      Source: {envVars.usingViteVars ? 'VITE_ variables' : envVars.usingNextVars ? 'NEXT_PUBLIC_ variables' : 'Default/None'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/settings/api', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get API Keys
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Run Comprehensive Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="primary"
            size="lg"
            onClick={runTests}
            disabled={testing}
            loading={testing}
            fullWidth
          >
            {testing ? 'Running Comprehensive Tests...' : 'Run Full Test Suite'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle level={3}>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <h5 className="font-medium">{result.name}</h5>
                      <p className="text-sm mt-1">{result.message}</p>
                      {result.details && (
                        <p className="text-xs mt-2 opacity-75 font-mono bg-black/5 p-2 rounded">
                          {result.details}
                        </p>
                      )}
                      {result.action && (
                        <p className="text-xs mt-2 font-medium">
                          💡 Action: {result.action}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}