/**
 * Application sidebar navigation - Updated with developer mode support
 * Provides easy access to main features and hidden developer tools
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Settings, 
  Upload, 
  Image, 
  Brain, 
  Mic,
  Heart,
  Folder,
  BarChart3,
  Database,
  Cloud,
  User,
  TestTube,
  Code
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { supabase } from '../../services/supabase';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: 'setup' | 'slideshow' | 'settings' | 'photos' | 'dev-panel';
  description: string;
  category: 'main' | 'dev';
  requiresDeveloperMode?: boolean;
}

const navItems: NavItem[] = [
  // Main Features
  {
    id: 'slideshow',
    label: 'Start Slideshow',
    icon: <Play className="w-5 h-5" />,
    view: 'slideshow',
    description: 'Begin your photo journey',
    category: 'main',
  },
  {
    id: 'photos',
    label: 'Manage Photos',
    icon: <Image className="w-5 h-5" />,
    view: 'photos',
    description: 'Upload and organize',
    category: 'main',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    view: 'settings',
    description: 'Personalize your experience',
    category: 'main',
  },

  // Developer Tools (hidden unless developer mode is enabled)
  {
    id: 'dev-panel',
    label: 'Developer Panel',
    icon: <Code className="w-5 h-5" />,
    view: 'dev-panel',
    description: 'AI setup & debugging tools',
    category: 'dev',
    requiresDeveloperMode: true,
  },
];

export function Sidebar() {
  const { currentView, setCurrentView, photos, folders, settings, user } = useAppStore();
  const [photoCount, setPhotoCount] = useState(0);
  const [folderCount, setFolderCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Fetch photo count from database
  useEffect(() => {
    const fetchPhotoCount = async () => {
      if (!user) return;
      
      try {
        // Get photo count from the database
        const { count, error } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching photo count:', error);
          // Fallback to local photos array
          const photoArray = Array.isArray(photos) ? photos : [];
          setPhotoCount(photoArray.length);
        } else {
          console.log('Photo count from database:', count);
          setPhotoCount(count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch photo count:', error);
        // Fallback to local photos array
        const photoArray = Array.isArray(photos) ? photos : [];
        setPhotoCount(photoArray.length);
      }
    };
    
    fetchPhotoCount();
    
    // Set up interval to refresh count every 5 seconds
    const interval = setInterval(fetchPhotoCount, 5000);
    
    return () => clearInterval(interval);
  }, [user, photos]);

  // Calculate stats from local data as fallback
  useEffect(() => {
    // Ensure photos is an array before using filter
    const photoArray = Array.isArray(photos) ? photos : [];
    const folderArray = Array.isArray(folders) ? folders : [];
    
    // Use local data as fallback
    if (photoArray.length > 0) {
      setPhotoCount(photoArray.length);
      setFavoriteCount(photoArray.filter(p => p.is_favorite).length);
    }
    
    if (folderArray.length > 0) {
      setFolderCount(folderArray.length);
    }
  }, [photos, folders]);

  const renderNavSection = (category: NavItem['category'], title: string) => {
    const items = navItems.filter(item => {
      if (item.category !== category) return false;
      if (item.requiresDeveloperMode && !settings.developer_mode) return false;
      return true;
    });
    
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={currentView === item.view ? 'primary' : 'ghost'}
                size="lg"
                fullWidth
                onClick={() => setCurrentView(item.view)}
                className={`
                  justify-start text-left h-auto py-3 px-4 mx-2
                  ${currentView === item.view 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${item.requiresDeveloperMode ? 'border-l-4 border-orange-400' : ''}
                `}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${
                      currentView === item.view ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">MyLifePictures</h2>
            <p className="text-xs text-gray-600">AI-Powered Memories</p>
          </div>
        </div>
      </div>

      {/* User Status */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Signed In
              </span>
            </div>
            <p className="text-xs text-green-700 truncate">
              {user.email}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {renderNavSection('main', 'Main Features')}
        {renderNavSection('dev', 'Developer Tools')}
      </nav>

      {/* Stats Section */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Your Collection
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-2">
              <Image className="w-4 h-4" />
              Photos
            </span>
            <span className="font-medium text-gray-900">{photoCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Folders
            </span>
            <span className="font-medium text-gray-900">{folderCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </span>
            <span className="font-medium text-gray-900">{favoriteCount}</span>
          </div>
        </div>
      </div>

      {/* AI Assistant Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {settings.ai_assistant_name}
            </span>
          </div>
          <p className="text-xs text-blue-700">
            Your AI assistant is ready to help with voice commands and photo descriptions.
          </p>
        </div>
      </div>

      {/* Developer Mode Indicator */}
      {settings.developer_mode && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">
                Developer Mode
              </span>
            </div>
            <p className="text-xs text-orange-700">
              Advanced debugging tools are enabled. Disable in Settings if not needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}