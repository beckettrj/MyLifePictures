/**
 * Main application component
 * Handles routing, authentication, and global state management
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { auth, db, storage, folderService } from './services/supabase';
import { Layout } from './components/layout/Layout';
import { SlideshowViewer } from './components/slideshow/SlideshowViewer';
import { AIProviderSetup } from './components/setup/AIProviderSetup';
import { PhotoUploader } from './components/setup/PhotoUploader';
import { SupabaseTest } from './components/setup/SupabaseTest';
import { MicrophoneTest } from './components/setup/MicrophoneTest';
import { StorageBucketSetup } from './components/setup/StorageBucketSetup';
import { AuthScreen } from './components/auth/AuthScreen';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Loader2, Heart, Brain, Image, Settings as SettingsIcon, Database, Cloud } from 'lucide-react';

// Settings Component
function SettingsView() {
  const { settings, updateSettings } = useAppStore();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Settings</h2>
        <p className="text-lg text-gray-600">
          Customize your MyLifePictures experience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Assistant Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assistant Name
              </label>
              <input
                type="text"
                value={settings.ai_assistant_name}
                onChange={(e) => updateSettings({ ai_assistant_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Sunny"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wake Word
              </label>
              <input
                type="text"
                value={settings.wake_word}
                onChange={(e) => updateSettings({ wake_word: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Hey Sunny"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.coaxing_mode}
                  onChange={(e) => updateSettings({ coaxing_mode: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable coaxing mode (ask about photos)
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={settings.font_size}
                onChange={(e) => updateSettings({ font_size: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.high_contrast}
                  onChange={(e) => updateSettings({ high_contrast: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  High contrast mode
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Night Mode Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3}>Night Mode Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.night_mode_start}
                  onChange={(e) => updateSettings({ night_mode_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.night_mode_end}
                  onChange={(e) => updateSettings({ night_mode_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedtime Message
              </label>
              <textarea
                value={settings.bedtime_message}
                onChange={(e) => updateSettings({ bedtime_message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Sweet dreams! Sleep well and we'll see you tomorrow."
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3}>Safety & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.profanity_filter}
                  onChange={(e) => updateSettings({ profanity_filter: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable profanity filter
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contacts (comma-separated emails)
              </label>
              <input
                type="text"
                value={settings.emergency_contacts.join(', ')}
                onChange={(e) => updateSettings({ 
                  emergency_contacts: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="family@example.com, caregiver@example.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { 
    user, 
    currentView, 
    setUser, 
    setPhotos, 
    setFolders, 
    setLoading, 
    isLoading 
  } = useAppStore();

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        console.log('🔍 Checking authentication status...');
        const user = await auth.getCurrentUser();
        
        if (user) {
          console.log('✅ User found:', user.id, user.email);
          setUser({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
            preferred_ai_name: user.user_metadata?.preferred_ai_name || 'Sunny',
            night_mode_start: user.user_metadata?.night_mode_start || '20:00',
            night_mode_end: user.user_metadata?.night_mode_end || '07:00',
            coaxing_mode: user.user_metadata?.coaxing_mode || false,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          console.log('❌ No authenticated user found');
        }
      } catch (error) {
        console.error('💥 Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || '',
          preferred_ai_name: session.user.user_metadata?.preferred_ai_name || 'Sunny',
          night_mode_start: session.user.user_metadata?.night_mode_start || '20:00',
          night_mode_end: session.user.user_metadata?.night_mode_end || '07:00',
          coaxing_mode: session.user.user_metadata?.coaxing_mode || false,
          created_at: session.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading]);

  // Load user data when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        console.log('📊 Loading user data for:', user.id);
        
        // Load photos and folders using the new db service
        const [photos, folders] = await Promise.all([
          db.getUserPhotos(user.id),
          folderService.getUserFolders(user.id)
        ]);

        if (photos) {
          setPhotos(photos);
          console.log('📸 Loaded photos:', photos.length);
        }

        if (folders) {
          setFolders(folders);
          console.log('📁 Loaded folders:', folders.length);
        }
      } catch (error) {
        console.error('💥 Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [user, setPhotos, setFolders]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading MyLifePictures...</p>
        </div>
      </div>
    );
  }

  // Authentication required
  if (!user) {
    return <AuthScreen />;
  }

  // Main application views
  const renderCurrentView = () => {
    switch (currentView) {
      case 'slideshow':
        return <SlideshowViewer className="h-full" />;
      case 'setup':
        return (
          <div className="p-6">
            <AIProviderSetup />
          </div>
        );
      case 'photos':
        return (
          <div className="p-6">
            <PhotoUploader />
          </div>
        );
      case 'settings':
        return <SettingsView />;
      case 'test':
        return (
          <div className="p-6">
            <SupabaseTest />
          </div>
        );
      case 'microphone':
        return (
          <div className="p-6">
            <MicrophoneTest />
          </div>
        );
      case 'storage':
        return (
          <div className="p-6">
            <StorageBucketSetup />
          </div>
        );
      default:
        return (
          <div className="p-6">
            <StorageBucketSetup />
          </div>
        );
    }
  };

  return (
    <Layout>
      <AnimatePresence mode="wait">
        {renderCurrentView()}
      </AnimatePresence>
    </Layout>
  );
}

export default App;