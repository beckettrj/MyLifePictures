/**
 * Main application layout component
 * Updated to always show navigation when no photos are available
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { VoiceIndicator } from '../ui/VoiceIndicator';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentView, settings, photos } = useAppStore();
  const { 
    startListening, 
    stopListening, 
    isListening, 
    lastCommand, 
    isProcessingCommand 
  } = useVoiceCommands();

  const toggleVoiceListening = () => {
    if (isListening) {
      console.log('🎤 User stopping voice recognition');
      stopListening();
    } else {
      console.log('🎤 User starting voice recognition');
      startListening();
    }
  };

  // Hide sidebar and header in slideshow mode ONLY if there are photos
  // Always show navigation when no photos are available
  const hasPhotos = Array.isArray(photos) && photos.length > 0;
  const showSidebar = currentView !== 'slideshow' || !hasPhotos;
  const showHeader = currentView !== 'slideshow' || !hasPhotos;

  // Apply theme based on settings
  const themeClass = settings.theme === 'dark' ? 'dark-theme' : '';

  return (
    <div className={`min-h-screen bg-gray-50 flex ${themeClass}`}>
      {/* Sidebar */}
      {showSidebar && (
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-70 bg-white shadow-lg border-r border-gray-200 flex-shrink-0"
        >
          <Sidebar />
        </motion.aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        {showHeader && (
          <motion.header
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white shadow-sm border-b border-gray-200 z-10"
          >
            <Header />
          </motion.header>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${showHeader ? '' : 'h-screen'} relative`}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Voice Indicator - Only show when in slideshow mode with photos */}
      {currentView === 'slideshow' && hasPhotos && (
        <VoiceIndicator
          isListening={isListening}
          isProcessing={isProcessingCommand}
          lastCommand={lastCommand}
          onToggleListening={toggleVoiceListening}
        />
      )}

      {/* Global Styles for High Contrast Mode */}
      {settings.high_contrast && (
        <style>{`
          * {
            filter: contrast(150%) !important;
          }
        `}</style>
      )}

      {/* Dark Theme Styles */}
      {settings.theme === 'dark' && (
        <style>{`
          .dark-theme {
            background-color: #1a1a1a;
            color: #f0f0f0;
          }
          .dark-theme .bg-white {
            background-color: #2a2a2a !important;
          }
          .dark-theme .text-gray-900 {
            color: #f0f0f0 !important;
          }
          .dark-theme .text-gray-700, .dark-theme .text-gray-800, .dark-theme .text-gray-600 {
            color: #d0d0d0 !important;
          }
          .dark-theme .border-gray-200 {
            border-color: #3a3a3a !important;
          }
          .dark-theme .bg-gray-50, .dark-theme .bg-gray-100 {
            background-color: #333333 !important;
          }
        `}</style>
      )}

      {/* Font Size Override */}
      <style>{`
        .font-size-override {
          font-size: ${getFontSizeValue(settings.font_size)} !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Get CSS font size value from setting
 */
function getFontSizeValue(size: string): string {
  switch (size) {
    case 'small': return '14px';
    case 'medium': return '16px';
    case 'large': return '18px';
    case 'xl': return '20px';
    default: return '18px';
  }
}