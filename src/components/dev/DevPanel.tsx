/**
 * Developer Panel - All debugging and testing tools including AI Setup
 * Hidden behind developer mode toggle in settings
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Database, 
  Cloud, 
  Mic, 
  User, 
  TestTube,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Brain
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { AIProviderSetup } from '../setup/AIProviderSetup';
import { StorageBucketSetup } from './StorageBucketSetup';
import { DatabaseTest } from './DatabaseTest';
import { SupabaseTest } from './SupabaseTest';
import { MicrophoneTest } from './MicrophoneTest';
import { UserVerification } from './UserVerification';

type DevView = 'overview' | 'ai-setup' | 'storage' | 'database' | 'supabase' | 'microphone' | 'user';

export function DevPanel() {
  const { setCurrentView } = useAppStore();
  const [devView, setDevView] = useState<DevView>('overview');

  const devTools = [
    {
      id: 'ai-setup' as DevView,
      title: 'AI Provider Setup',
      description: 'Configure OpenAI, Anthropic, and Gemini API keys',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-purple-500',
    },
    {
      id: 'storage' as DevView,
      title: 'Storage Bucket Setup',
      description: 'Create and configure Supabase storage buckets',
      icon: <Cloud className="w-6 h-6" />,
      color: 'bg-blue-500',
    },
    {
      id: 'database' as DevView,
      title: 'Database Testing',
      description: 'Test database operations and schema',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-green-500',
    },
    {
      id: 'supabase' as DevView,
      title: 'Supabase Connection',
      description: 'Test Supabase configuration and connectivity',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-indigo-500',
    },
    {
      id: 'microphone' as DevView,
      title: 'Microphone Testing',
      description: 'Test voice recognition and audio input',
      icon: <Mic className="w-6 h-6" />,
      color: 'bg-red-500',
    },
    {
      id: 'user' as DevView,
      title: 'User Verification',
      description: 'Verify user authentication and profiles',
      icon: <User className="w-6 h-6" />,
      color: 'bg-yellow-500',
    },
  ];

  const renderDevView = () => {
    switch (devView) {
      case 'ai-setup':
        return <AIProviderSetup />;
      case 'storage':
        return <StorageBucketSetup />;
      case 'database':
        return <DatabaseTest />;
      case 'supabase':
        return <SupabaseTest />;
      case 'microphone':
        return <MicrophoneTest />;
      case 'user':
        return <UserVerification />;
      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🛠️ Developer Panel
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Advanced debugging and testing tools for MyLifePictures.ai development
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-2">Developer Mode Active</h4>
                  <p className="text-amber-800 text-sm">
                    These tools are for development and debugging purposes. 
                    Regular users should not need to access this panel.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {devTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    hover 
                    onClick={() => setDevView(tool.id)}
                    className="cursor-pointer h-full"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`${tool.color} text-white p-3 rounded-lg flex-shrink-0`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle level={3} className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setDevView('ai-setup')}
                    fullWidth
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Setup AI Providers
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setDevView('storage')}
                    fullWidth
                  >
                    <Cloud className="w-5 h-5 mr-2" />
                    Setup Storage
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setDevView('database')}
                    fullWidth
                  >
                    <Database className="w-5 h-5 mr-2" />
                    Test Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            if (devView === 'overview') {
              setCurrentView('slideshow');
            } else {
              setDevView('overview');
            }
          }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {devView === 'overview' ? 'Back to App' : 'Back to Overview'}
        </Button>

        {devView !== 'overview' && (
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">Developer Panel</span>
            <span className="text-gray-400">•</span>
            <span className="font-medium text-gray-900">
              {devTools.find(t => t.id === devView)?.title || devView}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {renderDevView()}
    </div>
  );
}