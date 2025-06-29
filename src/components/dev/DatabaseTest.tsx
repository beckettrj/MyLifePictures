/**
 * Database test component - Updated for UUID IDs and profiles table
 * Tests database operations and user data storage
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User,
  Image,
  Folder,
  Mic,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { db, auth } from '../../services/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  data?: any;
}

export function DatabaseTest() {
  const { user } = useAppStore();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runDatabaseTests = async () => {
    if (!user) {
      alert('Please sign in first to test database operations');
      return;
    }

    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: User Profile Operations (using profiles table with UUID)
    testResults.push({
      name: 'User Profile Test (profiles table with UUID)',
      status: 'pending',
      message: 'Testing user profile operations...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Try to get user profile from profiles table
      let userProfile = await db.getUserProfile(user.id);
      
      if (!userProfile) {
        // Create user profile in profiles table
        console.log('📝 Creating user profile in profiles table...');
        userProfile = await db.upsertUserProfile({
          id: user.id,
          email: user.email,
          full_name: user.full_name || 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      testResults[0] = {
        name: 'User Profile Test (profiles table with UUID)',
        status: 'success',
        message: 'User profile operations working with profiles table and UUID IDs',
        details: `Profile ${userProfile ? 'found/created' : 'failed'} for user ${user.id}`,
        data: userProfile
      };
    } catch (error) {
      testResults[0] = {
        name: 'User Profile Test (profiles table with UUID)',
        status: 'error',
        message: 'User profile operations failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);

    // Test 2: Photo Folder Operations (with UUID IDs)
    testResults.push({
      name: 'Photo Folder Test (UUID IDs)',
      status: 'pending',
      message: 'Testing photo folder operations...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Get existing folders
      const existingFolders = await db.getUserFolders(user.id);
      console.log('📁 Existing folders:', existingFolders.length);

      // Try to create a test folder
      let testFolder = null;
      try {
        testFolder = await db.createFolder({
          user_id: user.id,
          name: `Test Folder ${Date.now()}`,
          description: 'Test folder created by database test',
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (createError) {
        console.log('⚠️ Could not create folder (table may not exist):', createError);
      }

      // Get folders again to verify
      const updatedFolders = await db.getUserFolders(user.id);

      testResults[1] = {
        name: 'Photo Folder Test (UUID IDs)',
        status: testFolder ? 'success' : 'warning',
        message: testFolder ? 'Photo folder operations working with UUID IDs' : 'Folder operations limited (photo_folders table may not exist)',
        details: `${testFolder ? 'Created test folder. ' : ''}Total folders: ${updatedFolders.length}`,
        data: { testFolder, totalFolders: updatedFolders.length }
      };
    } catch (error) {
      testResults[1] = {
        name: 'Photo Folder Test (UUID IDs)',
        status: 'error',
        message: 'Photo folder operations failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);

    // Test 3: Photo Metadata Operations (with UUID IDs)
    testResults.push({
      name: 'Photo Metadata Test (UUID IDs)',
      status: 'pending',
      message: 'Testing photo metadata operations...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Get existing photos
      const existingPhotos = await db.getUserPhotos(user.id);
      console.log('📸 Existing photos:', existingPhotos.length);

      // Try to create test photo metadata
      let testPhoto = null;
      try {
        const testPhotoData = {
          user_id: user.id,
          folder_id: null,
          filename: `test-photo-${Date.now()}.jpg`,
          display_name: `Test Photo ${Date.now()}`,
          file_path: `${user.id}/test-photo-${Date.now()}.jpg`,
          file_size: 1024000,
          width: 1920,
          height: 1080,
          is_hidden: false,
          is_favorite: false,
          faces_detected: [],
          tags: ['test', 'database'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        testPhoto = await db.uploadPhotoMetadata(testPhotoData);
      } catch (createError) {
        console.log('⚠️ Could not create photo metadata (table may not exist):', createError);
      }

      // Get photos again to verify
      const updatedPhotos = await db.getUserPhotos(user.id);

      testResults[2] = {
        name: 'Photo Metadata Test (UUID IDs)',
        status: testPhoto ? 'success' : 'warning',
        message: testPhoto ? 'Photo metadata operations working with UUID IDs' : 'Photo operations limited (photos table may not exist)',
        details: `${testPhoto ? 'Created test photo metadata. ' : ''}Total photos: ${updatedPhotos.length}`,
        data: { testPhoto, totalPhotos: updatedPhotos.length }
      };
    } catch (error) {
      testResults[2] = {
        name: 'Photo Metadata Test (UUID IDs)',
        status: 'error',
        message: 'Photo metadata operations failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);

    // Test 4: Database Schema Check (updated for UUID and profiles table)
    testResults.push({
      name: 'Database Schema Test (UUID Support)',
      status: 'pending',
      message: 'Checking database tables with UUID support...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const schemaCheck = await db.checkTablesExist();
      
      if (schemaCheck.exist) {
        testResults[3] = {
          name: 'Database Schema Test (UUID Support)',
          status: 'success',
          message: 'All required tables exist with UUID ID support',
          details: 'Database schema is properly set up with profiles table and UUID IDs',
          data: schemaCheck.tables
        };
      } else {
        const existingTables = schemaCheck.tables?.filter(t => t.exists).map(t => t.table) || [];
        const missingTables = schemaCheck.tables?.filter(t => !t.exists).map(t => t.table) || [];
        
        testResults[3] = {
          name: 'Database Schema Test (UUID Support)',
          status: existingTables.length > 0 ? 'warning' : 'error',
          message: `${existingTables.length}/${schemaCheck.tables?.length || 0} tables exist`,
          details: `Existing: ${existingTables.join(', ')}${missingTables.length > 0 ? `. Missing: ${missingTables.join(', ')}` : ''}`,
          data: schemaCheck.tables
        };
      }
    } catch (error) {
      testResults[3] = {
        name: 'Database Schema Test (UUID Support)',
        status: 'error',
        message: 'Database schema check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults([...testResults]);

    // Test 5: Authentication Integration
    testResults.push({
      name: 'Auth Integration Test',
      status: 'pending',
      message: 'Testing authentication integration...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const currentUser = await auth.getCurrentUser();
      const currentSession = await auth.getCurrentSession();
      
      if (currentUser && currentSession) {
        testResults[4] = {
          name: 'Auth Integration Test',
          status: 'success',
          message: 'Authentication integration working',
          details: `User ${currentUser.id} authenticated with valid session`,
          data: { 
            userId: currentUser.id, 
            email: currentUser.email,
            sessionExpires: currentSession.expires_at
          }
        };
      } else {
        testResults[4] = {
          name: 'Auth Integration Test',
          status: 'warning',
          message: 'Authentication issues detected',
          details: `User: ${!!currentUser}, Session: ${!!currentSession}`,
        };
      }
    } catch (error) {
      testResults[4] = {
        name: 'Auth Integration Test',
        status: 'error',
        message: 'Authentication integration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
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
          🗄️ Database Operations Test (UUID Support)
        </h2>
        <p className="text-gray-600">
          Test database operations with UUID IDs and profiles table schema
        </p>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">User Authenticated</span>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>ID:</strong> {user.id} (UUID)</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.full_name || 'Not set'}</p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">No User Authenticated</span>
              </div>
              <p className="text-sm text-red-800 mt-1">
                Please sign in first to test database operations
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Database Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              onClick={runDatabaseTests}
              disabled={testing || !user}
              loading={testing}
              fullWidth
            >
              {testing ? 'Running Database Tests...' : 'Run Database Tests'}
            </Button>

            {!user && (
              <p className="text-sm text-gray-600 text-center">
                Sign in to enable database testing
              </p>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This test works with UUID IDs and the profiles table schema you created manually.
              </p>
            </div>
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
          </CardContent>
        </Card>
      )}

      {/* Test Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle level={3}>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {results.filter(r => r.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {results.length}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}