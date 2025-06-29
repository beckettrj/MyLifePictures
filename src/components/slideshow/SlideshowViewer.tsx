/**
 * Main slideshow viewer component
 * Updated to work without database connections
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useSlideshow } from '../../hooks/useSlideshow';
import { SlideshowControls } from './SlideshowControls';
import { PhotoCaption } from './PhotoCaption';
import { NightModeOverlay } from './NightModeOverlay';
import { Button } from '../ui/Button';
import { Upload, Image, ArrowRight, ArrowLeft } from 'lucide-react';

interface SlideshowViewerProps {
  className?: string;
}

export function SlideshowViewer({ className = '' }: SlideshowViewerProps) {
  const { slideshowSettings, photos, setCurrentView, settings } = useAppStore();
  const { currentPhoto, currentIndex } = useSlideshow();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPhotos, setHasPhotos] = useState(false);

  // Check if we have photos
  useEffect(() => {
    const photosArray = Array.isArray(photos) ? photos : [];
    setHasPhotos(photosArray.length > 0);
  }, [photos]);

  // Reset image state when photo changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentPhoto?.id]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
    zoom: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.2, opacity: 0 },
    },
  };

  const currentTransition = transitionVariants[slideshowSettings.transition] || transitionVariants.fade;

  // Apply theme class based on settings
  const themeClass = settings.theme === 'dark' ? 'bg-gray-900' : 'bg-black';

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className} ${settings.theme === 'dark' ? 'bg-gray-800 text-white' : ''}`}>
        <div className="text-center p-8">
          <div className={`w-12 h-12 border-4 ${settings.theme === 'dark' ? 'border-blue-400 border-t-gray-800' : 'border-blue-600 border-t-transparent'} rounded-full animate-spin mx-auto mb-4`}></div>
          <p className="text-lg text-gray-700 dark:text-gray-200">Loading your photos...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen when no photos are available
  if (!hasPhotos || !currentPhoto) {
    return (
      <div className={`flex items-center justify-center h-full ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'} ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center p-8 max-w-2xl mx-auto"
        >
          {/* Welcome Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Image className="w-12 h-12 text-white" />
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className={`text-3xl font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              Welcome to MyLifePictures.ai! 📸
            </h2>
            <p className={`text-lg ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-8 leading-relaxed`}>
              Your AI-powered slideshow is ready, but you haven't uploaded any photos yet. 
              Let's get started by adding your favorite family memories!
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <Button
              variant="primary"
              size="xl"
              onClick={() => setCurrentView('photos')}
              className="w-full max-w-md mx-auto"
            >
              <Upload className="w-6 h-6 mr-3" />
              Upload Your First Photos
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>

            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setCurrentView('settings')}
              >
                <Image className="w-5 h-5 mr-2" />
                View Sample Photos
              </Button>
            </div>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            <div className={`text-center p-4 ${settings.theme === 'dark' ? 'bg-gray-700 rounded-lg' : ''}`}>
              <div className={`w-12 h-12 ${settings.theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <Image className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
              <h3 className={`font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Smart Organization</h3>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Organize photos into folders and let AI help describe your memories
              </p>
            </div>

            <div className={`text-center p-4 ${settings.theme === 'dark' ? 'bg-gray-700 rounded-lg' : ''}`}>
              <div className={`w-12 h-12 ${settings.theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <svg className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className={`font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Voice Commands</h3>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Say "Hey Sunny" to control your slideshow with simple voice commands
              </p>
            </div>

            <div className={`text-center p-4 ${settings.theme === 'dark' ? 'bg-gray-700 rounded-lg' : ''}`}>
              <div className={`w-12 h-12 ${settings.theme === 'dark' ? 'bg-green-900' : 'bg-green-100'} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <svg className={`w-6 h-6 ${settings.theme === 'dark' ? 'text-green-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className={`font-semibold ${settings.theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Family Focused</h3>
              <p className={`text-sm ${settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Designed specifically for elderly users with large fonts and simple controls
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Regular slideshow view when photos are available
  return (
    <div className={`relative w-full h-full ${themeClass} overflow-hidden ${className}`}>
      {/* Exit Button - Added to allow returning to Manage Photos */}
      <motion.div 
        className="absolute top-4 left-4 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          variant="ghost"
          size="md"
          onClick={() => setCurrentView('photos')}
          className="bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
          aria-label="Exit slideshow"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Photos
        </Button>
      </motion.div>

      {/* Main Photo Display */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.id}
            className="relative w-full h-full flex items-center justify-center"
            {...currentTransition}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Loading State */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg">Loading your photo...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-xl font-semibold mb-2">Unable to Load Photo</h3>
                  <p className="text-gray-300">{currentPhoto.display_name || 'Photo'}</p>
                </div>
              </div>
            )}

            {/* Photo Image */}
            <img
              src={currentPhoto.file_path}
              alt={currentPhoto.display_name || 'Photo'}
              className={`
                max-w-full max-h-full object-contain transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                ${slideshowSettings.night_mode_active ? 'filter brightness-75' : ''}
              `}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Photo Caption */}
      {slideshowSettings.show_captions && imageLoaded && (
        <PhotoCaption 
          photo={currentPhoto} 
          currentIndex={currentIndex + 1}
          totalPhotos={photos.length}
        />
      )}

      {/* Night Mode Overlay */}
      {slideshowSettings.night_mode_active && <NightModeOverlay />}

      {/* Slideshow Controls */}
      <SlideshowControls className="absolute bottom-4 left-1/2 transform -translate-x-1/2" />

      {/* Progress Indicator */}
      {slideshowSettings.is_playing && (
        <div className="absolute top-0 left-0 w-full h-1 bg-black/20">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: slideshowSettings.interval,
              ease: 'linear',
              repeat: Infinity,
            }}
          />
        </div>
      )}
    </div>
  );
}