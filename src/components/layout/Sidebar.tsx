/**
 * Application sidebar navigation
 * Provides easy access to all main features
 */

import React from 'react';
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
  Cloud
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: 'setup' | 'slideshow' | 'settings' | 'photos' | 'test' | 'microphone' | 'storage';
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'storage',
    label: 'Setup Storage',
    icon: <Cloud className="w-5 h-5" />,
    view: 'storage',
    description: 'Configure storage buckets',
  },
  {
    id: 'slideshow',
    label: 'Start Slideshow',
    icon: <Play className="w-5 h-5" />,
    view: 'slideshow',
    description: 'Begin your photo journey',
  },
  {
    id: 'photos',
    label: 'Manage Photos',
    icon: <Image className="w-5 h-5" />,
    view: 'photos',
    description: 'Upload and organize',
  },
  {
    id: 'setup',
    label: 'AI Setup',
    icon: <Brain className="w-5 h-5" />,
    view: 'setup',
    description: 'Configure your assistant',
  },
  {
    id: 'microphone',
    label: 'Test Microphone',
    icon: <Mic className="w-5 h-5" />,
    view: 'microphone',
    description: 'Test voice commands',
  },
  {
    id: 'test',
    label: 'Test Supabase',
    icon: <Database className="w-5 h-5" />,
    view: 'test',
    description: 'Check database connection',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    view: 'settings',
    description: 'Personalize your experience',
  },
];

export function Sidebar() {
  const { currentView, setCurrentView, photos, folders, settings } = useAppStore();

  const getStats = () => {
    return {
      totalPhotos: photos.length,
      totalFolders: folders.length,
      favoritePhotos: photos.filter(p => p.is_favorite).length,
    };
  };

  const stats = getStats();

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

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item, index) => (
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
                  justify-start text-left h-auto py-4 px-4
                  ${currentView === item.view 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
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
            <span className="font-medium text-gray-900">{stats.totalPhotos}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Folders
            </span>
            <span className="font-medium text-gray-900">{stats.totalFolders}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </span>
            <span className="font-medium text-gray-900">{stats.favoritePhotos}</span>
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
    </div>
  );
}