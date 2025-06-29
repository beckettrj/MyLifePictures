/**
 * Voice recognition status indicator with improved positioning
 * Shows listening state, command feedback, and processing status
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  lastCommand?: string | null;
  onToggleListening: () => void;
  className?: string;
}

export function VoiceIndicator({
  isListening,
  isProcessing,
  lastCommand,
  onToggleListening,
  className = '',
}: VoiceIndicatorProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      <div className="flex flex-col items-end gap-3">
        {/* Voice Command Feedback */}
        <AnimatePresence>
          {lastCommand && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200 max-w-xs"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">
                  {formatCommand(lastCommand)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Voice Button - Positioned to not overlap with header */}
        <motion.button
          onClick={onToggleListening}
          className={`
            relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg
            transition-all duration-300 focus:ring-4 focus:ring-offset-2 focus:outline-none
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200' 
              : 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-200'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {/* Listening Animation */}
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Icon */}
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isListening ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </motion.button>

        {/* Status Text */}
        <div className="text-center">
          <motion.p
            key={getStatusText(isListening, isProcessing)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-white bg-gray-900/70 backdrop-blur-sm rounded-lg px-3 py-1"
          >
            {getStatusText(isListening, isProcessing)}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

/**
 * Format command for display
 */
function formatCommand(command: string): string {
  const commandMap: Record<string, string> = {
    'NEXT_IMAGE': 'Next Picture',
    'PREV_IMAGE': 'Previous Picture',
    'PAUSE_SLIDESHOW': 'Pause',
    'PLAY_SLIDESHOW': 'Play',
    'SLOWER': 'Slower',
    'FASTER': 'Faster',
    'TOGGLE_NIGHT_MODE': 'Night Mode',
    'TOGGLE_DAY_MODE': 'Day Mode',
    'SKIP_IMAGE': 'Skip',
    'MARK_FAVORITE': 'Favorite',
    'HIDE_IMAGE': 'Hide',
    'DESCRIBE_IMAGE': 'Describe',
    'START_ANNOTATION': 'Tell Story',
    'EMERGENCY_DETECTED': 'Emergency Alert',
  };

  return commandMap[command] || command;
}

/**
 * Get status text based on current state
 */
function getStatusText(isListening: boolean, isProcessing: boolean): string {
  if (isProcessing) return 'Processing...';
  if (isListening) return 'Listening...';
  return 'Microphone OFF';
}