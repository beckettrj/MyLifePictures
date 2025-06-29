/**
 * Custom hook for managing slideshow functionality
 * Simplified to work without database connections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Photo } from '../types';

interface SlideshowHook {
  currentPhoto: Photo | null;
  currentIndex: number;
  isPlaying: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextPhoto: () => void;
  previousPhoto: () => void;
  goToPhoto: (index: number) => void;
  togglePlayPause: () => void;
  restartSlideshow: () => void;
  shufflePhotos: () => void;
}

export function useSlideshow(): SlideshowHook {
  const {
    photos,
    slideshowSettings,
    currentPhoto,
    setCurrentPhoto,
    updateSlideshowSettings,
  } = useAppStore();

  const [displayPhotos, setDisplayPhotos] = useState<Photo[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndex = displayPhotos.findIndex(photo => photo?.id === currentPhoto?.id);

  /**
   * Filter and sort photos based on slideshow settings
   */
  const preparePhotos = useCallback(() => {
    // Ensure photos is a valid array before proceeding
    if (!Array.isArray(photos) || photos.length === 0) {
      console.log('No photos available for slideshow');
      setDisplayPhotos([]);
      return;
    }

    console.log('Preparing photos for slideshow, count:', photos.length);
    let filteredPhotos = [...photos]; // Create a copy to avoid mutating the original

    // Sort photos based on mode
    switch (slideshowSettings.mode) {
      case 'sequential':
        filteredPhotos.sort((a, b) => {
          const nameA = a.display_name || '';
          const nameB = b.display_name || '';
          return nameA.localeCompare(nameB);
        });
        break;
      case 'reverse':
        filteredPhotos.sort((a, b) => {
          const nameA = a.display_name || '';
          const nameB = b.display_name || '';
          return nameB.localeCompare(nameA);
        });
        break;
      case 'date-asc':
        filteredPhotos.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'date-desc':
        filteredPhotos.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'random':
      default:
        // Fisher-Yates shuffle
        for (let i = filteredPhotos.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filteredPhotos[i], filteredPhotos[j]] = [filteredPhotos[j], filteredPhotos[i]];
        }
        break;
    }

    console.log('Prepared photos for slideshow, count:', filteredPhotos.length);
    setDisplayPhotos(filteredPhotos);

    // Set first photo if none selected
    if (filteredPhotos.length > 0 && !currentPhoto) {
      console.log('Setting initial photo for slideshow');
      setCurrentPhoto(filteredPhotos[0]);
      updateSlideshowSettings({ current_index: 0 });
    }
  }, [photos, slideshowSettings.mode, currentPhoto, setCurrentPhoto, updateSlideshowSettings]);

  /**
   * Navigate to next photo
   */
  const nextPhoto = useCallback(() => {
    if (displayPhotos.length === 0) return;

    const nextIndex = (currentIndex + 1) % displayPhotos.length;
    setCurrentPhoto(displayPhotos[nextIndex]);
    updateSlideshowSettings({ current_index: nextIndex });
  }, [displayPhotos, currentIndex, setCurrentPhoto, updateSlideshowSettings]);

  /**
   * Navigate to previous photo
   */
  const previousPhoto = useCallback(() => {
    if (displayPhotos.length === 0) return;

    const prevIndex = currentIndex === 0 ? displayPhotos.length - 1 : currentIndex - 1;
    setCurrentPhoto(displayPhotos[prevIndex]);
    updateSlideshowSettings({ current_index: prevIndex });
  }, [displayPhotos, currentIndex, setCurrentPhoto, updateSlideshowSettings]);

  /**
   * Navigate to specific photo by index
   */
  const goToPhoto = useCallback((index: number) => {
    if (index >= 0 && index < displayPhotos.length) {
      setCurrentPhoto(displayPhotos[index]);
      updateSlideshowSettings({ current_index: index });
    }
  }, [displayPhotos, setCurrentPhoto, updateSlideshowSettings]);

  /**
   * Toggle play/pause state
   */
  const togglePlayPause = useCallback(() => {
    updateSlideshowSettings({ is_playing: !slideshowSettings.is_playing });
  }, [slideshowSettings.is_playing, updateSlideshowSettings]);

  /**
   * Restart slideshow from beginning
   */
  const restartSlideshow = useCallback(() => {
    if (displayPhotos.length > 0) {
      setCurrentPhoto(displayPhotos[0]);
      updateSlideshowSettings({ 
        current_index: 0, 
        is_playing: true 
      });
    }
  }, [displayPhotos, setCurrentPhoto, updateSlideshowSettings]);

  /**
   * Shuffle photos (re-randomize)
   */
  const shufflePhotos = useCallback(() => {
    preparePhotos();
  }, [preparePhotos]);

  /**
   * Auto-advance slideshow when playing
   */
  useEffect(() => {
    if (slideshowSettings.is_playing && displayPhotos.length > 0) {
      console.log(`Starting slideshow interval timer: ${slideshowSettings.interval} seconds`);
      intervalRef.current = setInterval(() => {
        nextPhoto();
      }, slideshowSettings.interval * 1000);
    } else {
      if (intervalRef.current) {
        console.log('Clearing slideshow interval timer');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [slideshowSettings.is_playing, slideshowSettings.interval, nextPhoto, displayPhotos.length]);

  /**
   * Prepare photos when dependencies change
   */
  useEffect(() => {
    console.log('Preparing photos for slideshow (dependency change)');
    preparePhotos();
  }, [preparePhotos]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentPhoto,
    currentIndex: currentIndex >= 0 ? currentIndex : 0,
    isPlaying: slideshowSettings.is_playing,
    canGoNext: displayPhotos.length > 1,
    canGoPrevious: displayPhotos.length > 1,
    nextPhoto,
    previousPhoto,
    goToPhoto,
    togglePlayPause,
    restartSlideshow,
    shufflePhotos,
  };
}