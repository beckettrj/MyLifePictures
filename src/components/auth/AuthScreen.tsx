/**
 * Simplified authentication screen
 * Provides login/signup UI without actual authentication
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo login - create a fake user
      const demoUser = {
        id: 'demo-user-id',
        email: email || 'demo@example.com',
        full_name: fullName || 'Demo User',
        preferred_ai_name: 'Sunny',
        night_mode_start: '20:00',
        night_mode_end: '07:00',
        coaxing_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(demoUser);
      console.log('✅ Demo login successful');
      
    } catch (err) {
      console.error('💥 Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle level={1} className="text-2xl">
              MyLifePictures.ai
            </CardTitle>
            <p className="text-gray-600 mt-2">
              AI-powered slideshow for your precious memories
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {mode === 'signup' 
                    ? 'Already have an account? Sign in' 
                    : 'Need an account? Sign up'
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-600"
        >
          <p>✨ Perfect for elderly users and family caregivers</p>
          <p>🎤 Voice-controlled • 🤖 AI-powered • 📸 Memory-focused</p>
          <p className="mt-2 text-blue-600 font-medium">
            Demo Mode: Enter any email/password to continue
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}