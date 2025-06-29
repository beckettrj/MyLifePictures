/**
 * Application header component with improved sign-out button positioning
 * Shows current user, navigation, and quick actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, User, LogOut, Heart, Code } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { auth } from '../../services/supabase';
import { Button } from '../ui/Button';

export function Header() {
  const { user, currentView, setCurrentView, setUser, settings } = useAppStore();

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      await auth.signOut();
      setUser(null);
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Force sign out locally even if server call fails
      setUser(null);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'slideshow': return 'Slideshow';
      case 'settings': return 'Settings';
      case 'photos': return 'Photo Management';
      case 'dev-panel': return 'Developer Panel';
      default: return 'MyLifePictures.ai';
    }
  };

  const toggleDeveloperMode = () => {
    const { updateSettings } = useAppStore.getState();
    updateSettings({ developer_mode: !settings.developer_mode });
    
    if (!settings.developer_mode) {
      setCurrentView('dev-panel');
    }
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: App Title and Current View */}
        <div className="flex items-center gap-4">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                MyLifePictures.ai
              </h1>
              <p className="text-sm text-gray-600">
                {getViewTitle()}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right: User Actions - Improved layout to prevent overlap */}
        <div className="flex items-center gap-3">
          {user && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {/* User Info */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-gray-600">
                  Welcome back!
                </p>
              </div>

              {/* User Avatar */}
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </div>

              {/* Action Buttons - Improved spacing */}
              <div className="flex items-center gap-2">
                {/* Developer Mode Toggle (hidden) */}
                <button
                  onClick={toggleDeveloperMode}
                  className="text-gray-400 hover:text-gray-600 p-2"
                  aria-label="Toggle Developer Mode"
                  title={settings.developer_mode ? "Disable Developer Mode" : "Enable Developer Mode"}
                >
                  <Code className={`w-5 h-5 ${settings.developer_mode ? 'text-orange-500' : ''}`} />
                </button>

                {/* Settings Button */}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setCurrentView('settings')}
                  className="text-gray-600 hover:text-gray-900 p-2"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Button>

                {/* Sign Out Button - More prominent and accessible */}
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 border-gray-300 px-3 py-2"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}