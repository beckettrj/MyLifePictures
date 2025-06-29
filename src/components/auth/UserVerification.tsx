/**
 * User verification component - Updated for profiles table
 * Shows current user status and database verification
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Eye,
  Calendar,
  Mail,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { auth, db } from '../../services/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface UserData {
  authUser: any;
  dbUser: any;
  isInDatabase: boolean;
  lastSignIn: string;
  emailVerified: boolean;
}

export function UserVerification() {
  const { user } = useAppStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('🔍 Loading user verification data for:', user.id);

      // Get current auth user
      const authUser = await auth.getCurrentUser();
      console.log('👤 Auth user:', authUser?.id, authUser?.email);

      // Get user from profiles table
      let dbUser = null;
      try {
        dbUser = await db.getUserProfile(user.id);
        console.log('💾 Database user (profiles table):', dbUser?.id, dbUser?.email);
      } catch (dbError) {
        console.warn('⚠️ Database user not found in profiles table:', dbError);
      }

      // Get session info
      const session = await auth.getCurrentSession();
      console.log('🔐 Session info:', {
        exists: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at
      });

      setUserData({
        authUser,
        dbUser,
        isInDatabase: !!dbUser,
        lastSignIn: authUser?.last_sign_in_at || authUser?.created_at || '',
        emailVerified: authUser?.email_confirmed_at ? true : false
      });

    } catch (err) {
      console.error('💥 Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const createDatabaseProfile = async () => {
    if (!user || !userData?.authUser) return;

    setLoading(true);
    setError('');

    try {
      console.log('📝 Creating database profile in profiles table for user:', user.id);

      const profile = {
        id: user.id,
        email: user.email,
        full_name: user.full_name || userData.authUser.user_metadata?.full_name || '',
        preferences: {
          ai_assistant_name: 'Sunny',
          night_mode_start: '20:00',
          night_mode_end: '07:00',
          coaxing_mode: false
        },
        emergency_contacts: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dbUser = await db.upsertUserProfile(profile);
      console.log('✅ Database profile created in profiles table:', dbUser);

      // Reload user data
      await loadUserData();
    } catch (err) {
      console.error('💥 Error creating database profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to create database profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No user signed in</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          👤 User Verification
        </h2>
        <p className="text-gray-600">
          Verify your account status and database integration (using profiles table)
        </p>
      </div>

      {/* Current User Overview */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <p className="text-sm">{user.full_name || 'Not set'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">AI Assistant</label>
                <p className="text-sm">{user.preferred_ai_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Account Created</label>
                <p className="text-sm">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm">{formatDate(user.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="secondary"
              size="md"
              onClick={loadUserData}
              disabled={loading}
              loading={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh User Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      {userData && (
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Authentication Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Authentication</p>
                    <p className="text-sm text-gray-600">Signed in successfully</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Last sign in:</p>
                  <p>{formatDate(userData.lastSignIn)}</p>
                </div>
              </div>

              {/* Email Verification */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {userData.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-gray-600">
                      {userData.emailVerified ? 'Email confirmed' : 'Email not confirmed'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {userData.emailVerified ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
              </div>

              {/* Database Profile (profiles table) */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {userData.isInDatabase ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Database Profile (profiles table)</p>
                    <p className="text-sm text-gray-600">
                      {userData.isInDatabase ? 'Profile exists in profiles table' : 'Profile missing from profiles table'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {userData.isInDatabase ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={createDatabaseProfile}
                      disabled={loading}
                    >
                      Create Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed User Data */}
      {userData && (
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Detailed User Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Auth User Data */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Authentication Data
                </h4>
                {userData.authUser ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-xs">{userData.authUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{userData.authUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span>{userData.authUser.phone || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Confirmed:</span>
                      <span>{userData.authUser.email_confirmed_at ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{formatDate(userData.authUser.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Sign In:</span>
                      <span>{formatDate(userData.authUser.last_sign_in_at)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">No auth user data found</p>
                )}
              </div>

              {/* Database User Data (profiles table) */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database Profile (profiles table)
                </h4>
                {userData.dbUser ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-xs">{userData.dbUser.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{userData.dbUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name:</span>
                      <span>{userData.dbUser.full_name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avatar:</span>
                      <span>{userData.dbUser.avatar_url ? 'Set' : 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preferences:</span>
                      <span>{userData.dbUser.preferences ? 'Set' : 'Default'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Emergency Contacts:</span>
                      <span>{userData.dbUser.emergency_contacts?.length || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 text-sm">
                    <p>No database profile found in profiles table</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={createDatabaseProfile}
                      disabled={loading}
                      className="mt-2"
                    >
                      Create Database Profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Error</h4>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {import.meta.env.DEV && userData && (
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Raw Auth User Data:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(userData.authUser, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Raw Database User Data (profiles table):</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                  {JSON.stringify(userData.dbUser, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}