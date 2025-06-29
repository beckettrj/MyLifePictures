/**
 * Custom hook for handling voice commands in the slideshow
 * Integrates voice recognition with slideshow controls and AI responses
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { voiceService, ttsService } from '../services/voiceService';
import { aiService } from '../services/aiService';
import { useSlideshow } from './useSlideshow';

interface VoiceCommandsHook {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  lastCommand: string | null;
  isProcessingCommand: boolean;
}

export function useVoiceCommands(): VoiceCommandsHook {
  const { 
    settings, 
    isListening, 
    lastVoiceCommand, 
    setListening, 
    setLastVoiceCommand,
    currentPhoto,
    updateSlideshowSettings,
    slideshowSettings,
  } = useAppStore();

  const { 
    nextPhoto, 
    previousPhoto, 
    togglePlayPause, 
    restartSlideshow,
    shufflePhotos,
  } = useSlideshow();

  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Handle voice commands
   */
  const handleVoiceCommand = useCallback(async (command: string, confidence: number) => {
    console.log('Processing voice command:', command, 'Confidence:', confidence);
    
    setLastVoiceCommand(command);
    setIsProcessingCommand(true);

    // Clear processing state after timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessingCommand(false);
    }, 3000);

    try {
      let response = '';
      
      switch (command) {
        case 'NEXT_IMAGE':
          nextPhoto();
          response = 'Moving to the next picture.';
          break;
          
        case 'PREV_IMAGE':
          previousPhoto();
          response = 'Going back to the previous picture.';
          break;
          
        case 'PAUSE_SLIDESHOW':
          if (slideshowSettings.is_playing) {
            togglePlayPause();
            response = 'Pausing the slideshow.';
          } else {
            response = 'The slideshow is already paused.';
          }
          break;
          
        case 'PLAY_SLIDESHOW':
          if (!slideshowSettings.is_playing) {
            togglePlayPause();
            response = 'Starting the slideshow.';
          } else {
            response = 'The slideshow is already playing.';
          }
          break;
          
        case 'SLOWER':
          const newSlowerInterval = Math.min(slideshowSettings.interval + 5, 300);
          updateSlideshowSettings({ interval: newSlowerInterval });
          response = `Slowing down. Pictures will now change every ${newSlowerInterval} seconds.`;
          break;
          
        case 'FASTER':
          const newFasterInterval = Math.max(slideshowSettings.interval - 5, 3);
          updateSlideshowSettings({ interval: newFasterInterval });
          response = `Speeding up. Pictures will now change every ${newFasterInterval} seconds.`;
          break;
          
        case 'TOGGLE_NIGHT_MODE':
          updateSlideshowSettings({ 
            night_mode_active: !slideshowSettings.night_mode_active 
          });
          response = slideshowSettings.night_mode_active 
            ? 'Turning off night mode.' 
            : 'Turning on night mode for easier viewing.';
          break;
          
        case 'TOGGLE_DAY_MODE':
          updateSlideshowSettings({ night_mode_active: false });
          response = 'Switching to day mode with full brightness.';
          break;
          
        case 'SKIP_IMAGE':
          nextPhoto();
          response = 'Skipping this picture.';
          break;
          
        case 'MARK_FAVORITE':
          if (currentPhoto) {
            // TODO: Implement favorite marking in photo service
            response = 'I\'ve marked this as one of your favorites.';
          } else {
            response = 'No picture is currently displayed.';
          }
          break;
          
        case 'HIDE_IMAGE':
          if (currentPhoto) {
            // TODO: Implement hide functionality in photo service
            response = 'I\'ve hidden this picture. It won\'t show again.';
            nextPhoto();
          } else {
            response = 'No picture is currently displayed.';
          }
          break;
          
        case 'DESCRIBE_IMAGE':
          if (currentPhoto) {
            try {
              response = await aiService.describeImage(
                currentPhoto.file_path,
                'Describe this photo warmly and personally, as if talking to someone who might have memory difficulties.'
              );
            } catch (error) {
              response = 'I can see this is a meaningful photo, but I\'m having trouble describing it right now.';
            }
          } else {
            response = 'There\'s no picture currently displayed for me to describe.';
          }
          break;
          
        case 'START_ANNOTATION':
          response = 'I\'m ready to listen. Please tell me about this picture.';
          // TODO: Start recording mode for annotation
          break;
          
        case 'EMERGENCY_DETECTED':
          response = 'I heard you might need help. Let me alert your family.';
          // TODO: Implement emergency contact notification
          console.warn('EMERGENCY DETECTED - would notify contacts');
          break;
          
        default:
          // Use AI to generate a contextual response
          try {
            response = await aiService.generateResponse(
              `User said: "${command}". Respond helpfully about the photo slideshow.`,
              { assistantName: settings.ai_assistant_name }
            );
          } catch (error) {
            response = `I heard you say something, but I'm not sure how to help with that. You can say things like "next picture", "pause", or "describe this photo".`;
          }
          break;
      }

      // Speak the response
      if (response) {
        ttsService.speak(response, {
          onEnd: () => {
            setIsProcessingCommand(false);
          }
        });
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorResponse = 'I\'m sorry, I had trouble understanding that. Please try again.';
      ttsService.speak(errorResponse);
      setIsProcessingCommand(false);
    }
  }, [
    nextPhoto, 
    previousPhoto, 
    togglePlayPause, 
    restartSlideshow, 
    shufflePhotos,
    currentPhoto,
    slideshowSettings,
    updateSlideshowSettings,
    settings.ai_assistant_name,
    setLastVoiceCommand
  ]);

  /**
   * Handle voice recognition errors
   */
  const handleVoiceError = useCallback((error: string) => {
    console.error('Voice recognition error:', error);
    setListening(false);
    
    let errorMessage = '';
    switch (error) {
      case 'no-speech':
        errorMessage = 'I didn\'t hear anything. Please try speaking again.';
        break;
      case 'audio-capture':
        errorMessage = 'I can\'t access your microphone. Please check your settings.';
        break;
      case 'not-allowed':
        errorMessage = 'I need permission to use your microphone.';
        break;
      default:
        errorMessage = 'I had trouble with voice recognition. Please try again.';
    }
    
    if (errorMessage && settings.voice_activation !== 'push-to-talk') {
      ttsService.speak(errorMessage);
    }
  }, [setListening, settings.voice_activation]);

  /**
   * Start voice recognition
   */
  const startListening = useCallback(() => {
    if (!voiceService.isSupported()) {
      console.error('Voice recognition not supported');
      return;
    }

    console.log('🎤 User manually starting voice recognition');
    voiceService.setWakeWord(settings.wake_word);
    const continuous = settings.voice_activation === 'always-on';
    voiceService.startListening(continuous);
    setListening(true);
  }, [settings.wake_word, settings.voice_activation, setListening]);

  /**
   * Stop voice recognition
   */
  const stopListening = useCallback(() => {
    console.log('🎤 User manually stopping voice recognition');
    voiceService.stopListening();
    setListening(false);
  }, [setListening]);

  /**
   * Initialize voice service callbacks
   */
  useEffect(() => {
    voiceService.onCommand(handleVoiceCommand);
    voiceService.onError(handleVoiceError);
    
    return () => {
      voiceService.onCommand(() => {});
      voiceService.onError(() => {});
    };
  }, [handleVoiceCommand, handleVoiceError]);

  /**
   * DO NOT auto-start listening - microphone starts OFF
   * Only start when user explicitly clicks the microphone button
   */
  useEffect(() => {
    console.log('🎤 Voice commands hook initialized - microphone OFF by default');
    
    // Ensure microphone is off on initialization
    if (isListening) {
      console.log('🎤 Turning off microphone on initialization');
      stopListening();
    }
    
    return () => {
      stopListening();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      stopListening();
    };
  }, [stopListening]);

  return {
    startListening,
    stopListening,
    isListening,
    lastCommand: lastVoiceCommand,
    isProcessingCommand,
  };
}