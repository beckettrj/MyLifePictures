/**
 * Slideshow control buttons
 * Large, accessible controls for elderly users
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Shuffle,
  Moon,
  Sun,
  Grid
} from 'lucide-react';
import { useSlideshow } from '../../hooks/useSlideshow';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';

interface SlideshowControlsProps {
  className?: string;
}

export function SlideshowControls({ className = '' }: SlideshowControlsProps) {
  const { slideshowSettings, updateSlideshowSettings, setCurrentView } = useAppStore();
  const { 
    isPlaying, 
    canGoNext, 
    canGoPrevious, 
    nextPhoto, 
    previousPhoto, 
    togglePlayPause, 
    restartSlideshow,
    shufflePhotos 
  } = useSlideshow();

  const toggleNightMode = () => {
    updateSlideshowSettings({ 
      night_mode_active: !slideshowSettings.night_mode_active 
    });
  };

  const exitToPhotoManager = () => {
    setCurrentView('photos');
  };

  return (
    <motion.div
      className={`flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-6 py-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Previous Button */}
      <Button
        variant="ghost"
        size="lg"
        onClick={previousPhoto}
        disabled={!canGoPrevious}
        className="text-white hover:bg-white/20 border-white/30"
        aria-label="Previous photo"
      >
        <SkipBack className="w-6 h-6" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        variant="primary"
        size="xl"
        onClick={togglePlayPause}
        className="bg-blue-600 hover:bg-blue-700"
        aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8" />
        ) : (
          <Play className="w-8 h-8 ml-1" />
        )}
      </Button>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="lg"
        onClick={nextPhoto}
        disabled={!canGoNext}
        className="text-white hover:bg-white/20 border-white/30"
        aria-label="Next photo"
      >
        <SkipForward className="w-6 h-6" />
      </Button>

      {/* Separator */}
      <div className="h-8 w-px bg-white/30 mx-2" />

      {/* Restart Button */}
      <Button
        variant="ghost"
        size="lg"
        onClick={restartSlideshow}
        className="text-white hover:bg-white/20 border-white/30"
        aria-label="Restart slideshow"
        title="Start from beginning"
      >
        <RotateCcw className="w-5 h-5" />
      </Button>

      {/* Shuffle Button */}
      {slideshowSettings.mode === 'random' && (
        <Button
          variant="ghost"
          size="lg"
          onClick={shufflePhotos}
          className="text-white hover:bg-white/20 border-white/30"
          aria-label="Shuffle photos"
          title="Mix up the order"
        >
          <Shuffle className="w-5 h-5" />
        </Button>
      )}

      {/* Night Mode Toggle */}
      <Button
        variant="ghost"
        size="lg"
        onClick={toggleNightMode}
        className={`
          border-white/30 transition-colors duration-200
          ${slideshowSettings.night_mode_active 
            ? 'text-yellow-400 hover:bg-yellow-400/20' 
            : 'text-white hover:bg-white/20'
          }
        `}
        aria-label={slideshowSettings.night_mode_active ? 'Turn off night mode' : 'Turn on night mode'}
        title={slideshowSettings.night_mode_active ? 'Day mode' : 'Night mode'}
      >
        {slideshowSettings.night_mode_active ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </Button>

      {/* Exit to Photo Manager Button */}
      <Button
        variant="ghost"
        size="lg"
        onClick={exitToPhotoManager}
        className="text-white hover:bg-white/20 border-white/30"
        aria-label="Exit to photo manager"
        title="Manage Photos"
      >
        <Grid className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}