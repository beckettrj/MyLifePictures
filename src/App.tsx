/**
 * Main application component - Simplified to avoid database connections
 * Handles routing, authentication, and global state management
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Layout } from './components/layout/Layout';
import { SlideshowViewer } from './components/slideshow/SlideshowViewer';
import { PhotoUploader } from './components/setup/PhotoUploader';
import { AuthScreen } from './components/auth/AuthScreen';
import { DevPanel } from './components/dev/DevPanel';
import { Settings } from './components/Settings';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Loader2, AlertTriangle } from 'lucide-react';

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('💥 Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('💥 Unhandled promise rejection:', event.reason);
      setError(new Error(event.reason));
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">
                The application encountered an error. Please try refreshing the page.
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setHasError(false);
                  setError(null);
                  window.location.reload();
                }}
              >
                Refresh Page
              </Button>
              {error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Main App Component
function App() {
  const { 
    currentView, 
    setLoading, 
    isLoading,
    setCurrentView,
    settings
  } = useAppStore();

  // Simplified initialization - no database connections
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing application...');
      setLoading(true);
      
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set default view
        setCurrentView('slideshow');
        
        console.log('✅ Application initialized successfully');
      } catch (error) {
        console.error('💥 Application initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [setLoading, setCurrentView]);

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

  // Main application views
  const renderCurrentView = () => {
    try {
      switch (currentView) {
        case 'slideshow':
          return <SlideshowViewer className="h-full" />;
        case 'photos':
          return (
            <div className="p-6 space-y-6">
              <PhotoUploader />
            </div>
          );
        case 'settings':
          return <Settings />;
        case 'dev-panel':
          // Only show dev panel if developer mode is enabled
          if (settings.developer_mode) {
            return <DevPanel />;
          } else {
            // Redirect to slideshow if developer mode is disabled
            setCurrentView('slideshow');
            return <SlideshowViewer className="h-full" />;
          }
        default:
          return <SlideshowViewer className="h-full" />;
      }
    } catch (error) {
      console.error('💥 Error rendering view:', error);
      return (
        <div className="p-6">
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-gray-600 mb-4">
                  There was an error loading this view. Please try refreshing the page.
                </p>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <Layout>
        <AnimatePresence mode="wait">
          {renderCurrentView()}
        </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;