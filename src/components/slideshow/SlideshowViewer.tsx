/**
 * Main slideshow viewer component
 * Displays photos with transitions, captions, and night mode support
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { useSlideshow } from '../../hooks/useSlideshow';
import { SlideshowControls } from './SlideshowControls';
import { PhotoCaption } from './PhotoCaption';
import { NightModeOverlay } from './NightModeOverlay';
import type { Photo } from '../../types';

interface SlideshowViewerProps {
  className?: string;
}

export function SlideshowViewer({ className = '' }: SlideshowViewerProps) {
  const { slideshowSettings } = useAppStore();
  const { currentPhoto, currentIndex } = useSlideshow();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  if (!currentPhoto) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 ${className}`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            No Photos Available
          </h2>
          <p className="text-gray-600 max-w-md">
            Add some photos to start your slideshow journey. Click the settings to upload your favorite memories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden ${className}`}>
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
                  <p className="text-gray-300">{currentPhoto.display_name}</p>
                </div>
              </div>
            )}

            {/* Photo Image */}
            <img
              src={currentPhoto.file_path}
              alt={currentPhoto.display_name}
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
          totalPhotos={0} // Will be passed from parent
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