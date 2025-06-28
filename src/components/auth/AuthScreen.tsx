/**
 * Enhanced authentication screen with better email confirmation handling
 * Provides multiple options for users who aren't receiving emails
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  ExternalLink,
  Settings,
  Info
} from 'lucide-react';
import { auth } from '../../services/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm' | 'troubleshoot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const { setUser } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        console.log('🔐 Attempting sign up for:', email);
        
        const { user, session, error } = await auth.signUp(email, password);
        
        if (error) {
          console.error('❌ Sign up error:', error);
          
          // Handle specific signup errors
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Try signing in instead, or use a different email address.');
            return;
          } else if (error.message.includes('weak password')) {
            setError('Password is too weak. Please use at least 6 characters with a mix of letters and numbers.');
            return;
          }
          
          throw error;
        }

        console.log('✅ Sign up result:', { user: user?.id, session: !!session });

        if (user && !session) {
          // Email confirmation required
          setMode('confirm');
          setConfirmationSent(true);
          setSuccess(`Account created! We've sent a confirmation email to ${email}. Please check your inbox and click the link to activate your account.`);
        } else if (user && session) {
          // Immediate sign in (email confirmation disabled)
          console.log('🎉 User signed up and signed in immediately');
          setUser({
            id: user.id,
            email: user.email || '',
            full_name: fullName,
            preferred_ai_name: 'Sunny',
            night_mode_start: '20:00',
            night_mode_end: '07:00',
            coaxing_mode: false,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else if (mode === 'signin') {
        console.log('🔐 Attempting sign in for:', email);
        
        const { user, session, error } = await auth.signIn(email, password);
        
        if (error) {
          console.error('❌ Sign in error:', error);
          
          // Handle specific error cases
          if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
            setMode('confirm');
            setError('Your email address has not been confirmed yet. Please check your email for the confirmation link, or request a new one below.');
            return;
          } else if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
            return;
          } else if (error.message.includes('too many requests')) {
            setError('Too many sign-in attempts. Please wait a few minutes before trying again.');
            return;
          }
          
          throw error;
        }

        if (user && session) {
          console.log('✅ Sign in successful for user:', user.id);
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
        }
      }
    } catch (err) {
      console.error('💥 Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('📧 Resending confirmation email to:', email);
      await auth.resendConfirmation(email);
      setSuccess(`Confirmation email sent to ${email}! Please check your inbox and spam folder.`);
      setConfirmationSent(true);
      setResendCount(prev => prev + 1);
    } catch (err) {
      console.error('❌ Resend confirmation error:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('rate limit')) {
          setError('Please wait a few minutes before requesting another confirmation email.');
        } else if (err.message.includes('not found')) {
          setError('Email address not found. Please sign up first or check your email address.');
        } else {
          setError(`Failed to resend confirmation email: ${err.message}`);
        }
      } else {
        setError('Failed to resend confirmation email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setConfirmationSent(false);
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
              {mode === 'confirm' 
                ? 'Confirm your email address'
                : mode === 'troubleshoot'
                ? 'Email troubleshooting'
                : 'AI-powered slideshow for your precious memories'
              }
            </p>
          </CardHeader>

          <CardContent>
            {mode === 'troubleshoot' ? (
              // Email Troubleshooting Mode
              <div className="space-y-4">
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-amber-900 mb-2">Email Issues?</h3>
                  <p className="text-sm text-amber-700">
                    If you're not receiving confirmation emails, here are some solutions:
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📧 Check Your Email</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Look in your spam/junk folder</li>
                      <li>Check promotions tab (Gmail)</li>
                      <li>Search for "MyLifePictures" or "Supabase"</li>
                      <li>Add noreply@supabase.io to your contacts</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">🔧 Alternative Solutions</h4>
                    <ul className="list-disc list-inside space-y-1 text-green-800">
                      <li>Try a different email address (Gmail, Yahoo, etc.)</li>
                      <li>Wait 5-10 minutes for email delivery</li>
                      <li>Check if your email provider blocks automated emails</li>
                      <li>Contact your IT department if using work email</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">🚀 Quick Workaround</h4>
                    <p className="text-purple-800">
                      If emails still don't work, we can help you set up the account manually. 
                      Contact support with your email address.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => switchMode('confirm')}
                  >
                    Try Email Confirmation Again
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => switchMode('signup')}
                  >
                    Try Different Email Address
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onClick={() => window.open('https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/auth/settings', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Check Supabase Email Settings
                  </Button>
                </div>
              </div>
            ) : mode === 'confirm' ? (
              // Email Confirmation Mode
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Mail className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-blue-900 mb-2">Check Your Email</h3>
                  <p className="text-sm text-blue-700">
                    We've sent a confirmation link to <strong>{email}</strong>
                  </p>
                  {resendCount > 0 && (
                    <p className="text-xs text-blue-600 mt-2">
                      Emails sent: {resendCount + 1}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    loading={loading}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {resendCount > 0 ? 'Send Another Email' : 'Resend Confirmation Email'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => switchMode('troubleshoot')}
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Email Not Working?
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onClick={() => switchMode('signin')}
                  >
                    Back to Sign In
                  </Button>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    What to expect:
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Email should arrive within 2-5 minutes</p>
                    <p>• Check spam/junk folder if not in inbox</p>
                    <p>• Link expires after 24 hours</p>
                    <p>• You can request multiple confirmation emails</p>
                  </div>
                </div>
              </div>
            ) : (
              // Sign In / Sign Up Form
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
                      required={mode === 'signup'}
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
                    required
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Use Gmail, Yahoo, or Outlook for best email delivery
                    </p>
                  )}
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
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters long
                    </p>
                  )}
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

                {mode === 'signin' && (
                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => switchMode('confirm')}
                      className="text-gray-500 hover:text-gray-700 text-xs block"
                    >
                      Need to resend confirmation email?
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('troubleshoot')}
                      className="text-gray-500 hover:text-gray-700 text-xs block"
                    >
                      Having email issues?
                    </button>
                  </div>
                )}
              </form>
            )}
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
        </motion.div>

        {/* Debug Info (Development Only) */}
        {import.meta.env.DEV && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 p-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono"
          >
            <div className="text-gray-400 mb-1">🔧 Debug Info:</div>
            <div>Mode: {mode}</div>
            <div>Email: {email || 'none'}</div>
            <div>Confirmation Sent: {confirmationSent ? 'yes' : 'no'}</div>
            <div>Resend Count: {resendCount}</div>
            <div>Loading: {loading ? 'yes' : 'no'}</div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}