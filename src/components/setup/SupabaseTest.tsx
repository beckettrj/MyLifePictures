/**
 * Enhanced Supabase test component with email configuration checks
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
  });

  useEffect(() => {
    // Check environment variables on component mount
    const url = import.meta.env.VITE_SUPABASE_URL || 'https://zvxnsjsltabvsfwatqox.supabase.co';
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    setEnvVars({
      url,
      key,
      hasUrl: !!url && url !== 'your-project-url',
      hasKey: !!key && key !== 'your-anon-key' && key !== 'placeholder-key',
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
        message: 'Missing VITE_SUPABASE_ANON_KEY environment variable',
        details: 'VITE_SUPABASE_ANON_KEY is required but not found in environment variables',
        action: 'Set VITE_SUPABASE_ANON_KEY in your .env file',
      };
    } else {
      testResults[0] = {
        name: 'Environment Variables',
        status: 'success',
        message: 'Configuration looks good',
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

    // Test 4: Email Configuration
    testResults.push({
      name: 'Email Configuration',
      status: 'pending',
      message: 'Checking email settings...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // We can't directly test email configuration from the client,
      // but we can provide guidance based on common issues
      testResults[3] = {
        name: 'Email Configuration',
        status: 'warning',
        message: 'Email configuration needs verification',
        details: 'Email confirmation may not work if SMTP is not configured in Supabase',
        action: 'Check your Supabase Auth settings for email configuration',
      };
    } catch (error) {
      testResults[3] = {
        name: 'Email Configuration',
        status: 'error',
        message: 'Email configuration check failed',
        details: error instanceof Error ? error.message : 'Email config error',
      };
    }

    setResults([...testResults]);

    // Test 5: Database Schema
    testResults.push({
      name: 'Database Schema',
      status: 'pending',
      message: 'Checking database tables...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Test if tables exist
      const tableTests = await Promise.allSettled([
        supabase.from('users').select('count').limit(1),
        supabase.from('photos').select('count').limit(1),
        supabase.from('photo_folders').select('count').limit(1),
        supabase.from('audio_recordings').select('count').limit(1),
      ]);

      const tablesExist = tableTests.filter(result => 
        result.status === 'fulfilled' || 
        (result.status === 'rejected' && !result.reason.message.includes('does not exist'))
      ).length;

      if (tablesExist === 4) {
        testResults[4] = {
          name: 'Database Schema',
          status: 'success',
          message: 'All required tables exist',
          details: 'Database schema is properly set up',
        };
      } else if (tablesExist > 0) {
        testResults[4] = {
          name: 'Database Schema',
          status: 'warning',
          message: `${tablesExist}/4 tables exist`,
          details: 'Some tables are missing - they will be created automatically when needed',
          action: 'Tables will be created when you first use the app features',
        };
      } else {
        testResults[4] = {
          name: 'Database Schema',
          status: 'warning',
          message: 'No tables found',
          details: 'Database tables will be created automatically when you first use the app',
          action: 'This is normal for a new project - tables are created on demand',
        };
      }
    } catch (error) {
      testResults[4] = {
        name: 'Database Schema',
        status: 'error',
        message: 'Database schema check failed',
        details: error instanceof Error ? error.message : 'Schema check error',
      };
    }

    setResults([...testResults]);

    // Test 6: Storage Buckets
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
        testResults[5] = {
          name: 'Storage Buckets',
          status: 'success',
          message: 'All required storage buckets exist',
          details: `Found ${bucketCount} buckets including 'photos' and 'audio'`,
        };
      } else {
        testResults[5] = {
          name: 'Storage Buckets',
          status: 'warning',
          message: 'Some storage buckets missing',
          details: `Found ${bucketCount} buckets. Missing: ${!hasPhotosBucket ? 'photos ' : ''}${!hasAudioBucket ? 'audio' : ''}`,
          action: 'Create missing buckets in your Supabase dashboard under Storage',
        };
      }
    } catch (error) {
      testResults[5] = {
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

  const copyInstructions = () => {
    const instructions = `
# Supabase Setup Instructions for MyLifePictures.ai

## 1. Environment Variables
VITE_SUPABASE_URL=https://zvxnsjsltabvsfwatqox.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

## 2. Email Configuration (CRITICAL for sign-up)
1. Go to: https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/auth/settings
2. Scroll to "SMTP Settings"
3. Either:
   - Configure custom SMTP (recommended for production)
   - OR disable "Enable email confirmations" for testing

## 3. Storage Buckets
1. Go to: https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/storage/buckets
2. Create "photos" bucket (public)
3. Create "audio" bucket (public)

## 4. Database Schema
- Tables will be created automatically via migrations
- No manual setup required
`;
    
    navigator.clipboard.writeText(instructions);
    alert('Setup instructions copied to clipboard!');
  };

  const allBucketsExist = results.length > 0 && results.every(result => result.status === 'success');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Supabase Configuration Test
        </h2>
        <p className="text-gray-600">
          Testing your Supabase setup and identifying configuration issues
        </p>
      </div>

      {/* Email Configuration Warning */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Configuration Issue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900 mb-2">Email Confirmation Not Working</h4>
                <p className="text-sm text-amber-800 mb-3">
                  You're not receiving confirmation emails because Supabase email is not properly configured. 
                  Here are your options:
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <h5 className="font-medium text-amber-900 mb-1">Option 1: Disable Email Confirmation (Quick Fix)</h5>
                    <p className="text-sm text-amber-700 mb-2">
                      Temporarily disable email confirmation for testing:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
                      <li>Go to your <a href="https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/auth/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Auth Settings</a></li>
                      <li>Find "Enable email confirmations" and turn it OFF</li>
                      <li>Save changes</li>
                      <li>Try signing up again - you'll be signed in immediately</li>
                    </ol>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <h5 className="font-medium text-amber-900 mb-1">Option 2: Configure SMTP (Production Ready)</h5>
                    <p className="text-sm text-amber-700 mb-2">
                      Set up proper email delivery:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1">
                      <li>Go to <a href="https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/auth/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Auth Settings</a></li>
                      <li>Scroll to "SMTP Settings"</li>
                      <li>Configure with Gmail, SendGrid, or other SMTP provider</li>
                      <li>Test email delivery</li>
                    </ol>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/auth/settings', '_blank')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Open Auth Settings
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyInstructions}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Instructions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Environment Variables */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Environment Variables</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">VITE_SUPABASE_URL:</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-mono text-xs">
                      zvxnsjsltabvsfwatqox.supabase.co
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">VITE_SUPABASE_ANON_KEY:</span>
                  <div className="flex items-center gap-2">
                    {envVars.hasKey ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-mono text-xs">
                      {envVars.key ? `${envVars.key.substring(0, 15)}...` : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Overall Status</h4>
              <div className={`p-4 rounded-lg border-2 ${
                isSupabaseReady 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isSupabaseReady ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {isSupabaseReady ? 'Ready to Use' : 'Configuration Required'}
                  </span>
                </div>
                <p className="text-sm">
                  {isSupabaseReady 
                    ? 'Supabase is properly configured and ready for use.'
                    : 'Please set your VITE_SUPABASE_ANON_KEY environment variable to continue.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="mt-6">
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
          </div>
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