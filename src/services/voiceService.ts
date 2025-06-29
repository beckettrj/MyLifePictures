/**
 * Voice recognition and command processing service
 * Handles speech-to-text, wake word detection, and command interpretation
 */

import { VOICE_COMMANDS, EMERGENCY_KEYWORDS } from '../config/constants';
import type { VoiceCommand } from '../types';

/**
 * Speech Recognition Service
 */
export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private continuous: boolean = false;
  private onCommandCallback: ((command: string, confidence: number) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;
  private wakeWord: string = 'hey sunny';
  private wakWordDetected: boolean = false;
  private startTimeout: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private isManuallyRestarting: boolean = false; // Flag to prevent conflicts

  constructor() {
    this.initializeSpeechRecognition();
    console.log('🎤 VoiceService initialized - microphone OFF by default');
  }

  /**
   * Initialize the Web Speech API
   */
  private initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      if (this.recognition) {
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          this.isListening = true;
          this.isManuallyRestarting = false; // Clear restart flag
        };

        this.recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          this.isListening = false;
          
          // Only restart if in continuous mode and not manually restarting
          if (this.continuous && this.recognition && !this.isManuallyRestarting) {
            this.startTimeout = setTimeout(() => {
              if (this.continuous && !this.isListening && !this.isManuallyRestarting) {
                this.startListeningInternal(true);
              }
            }, 1000);
          }
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
          
          // Handle specific errors
          if (event.error === 'aborted' || event.error === 'audio-capture') {
            // Don't restart on these errors
            this.continuous = false;
          }
          
          // Don't treat 'no-speech' as a critical error - it's normal
          if (event.error === 'no-speech') {
            console.log('No speech detected - this is normal behavior');
            return; // Don't call error callback for no-speech
          }
          
          this.onErrorCallback?.(event.error);
        };

        this.recognition.onresult = (event) => {
          this.handleSpeechResult(event);
        };

        this.isInitialized = true;
        console.log('🎤 Speech recognition initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(event: SpeechRecognitionEvent) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      const confidence = event.results[i][0].confidence;

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        this.processCommand(transcript.toLowerCase().trim(), confidence);
      } else {
        interimTranscript += transcript;
      }
    }

    // Send transcript to callback for display
    const fullTranscript = finalTranscript || interimTranscript;
    if (fullTranscript) {
      this.onTranscriptCallback?.(fullTranscript);
    }
  }

  /**
   * Process voice command and check for wake words
   */
  private processCommand(transcript: string, confidence: number = 1.0) {
    console.log('Processing command:', transcript, 'Confidence:', confidence);

    // Check for emergency keywords first
    const hasEmergencyKeyword = EMERGENCY_KEYWORDS.some(keyword => 
      transcript.includes(keyword.toLowerCase())
    );

    if (hasEmergencyKeyword) {
      this.onCommandCallback?.('EMERGENCY_DETECTED', confidence);
      return;
    }

    // Check for wake word if not already detected
    if (!this.wakWordDetected && transcript.includes(this.wakeWord.toLowerCase())) {
      this.wakWordDetected = true;
      console.log('Wake word detected');
      return;
    }

    // Process commands only if wake word was detected or in always-on mode
    if (this.wakWordDetected || this.continuous) {
      const command = this.matchCommand(transcript);
      if (command) {
        this.onCommandCallback?.(command.action, confidence);
        // Reset wake word detection after processing command
        this.wakWordDetected = false;
      }
    }
  }

  /**
   * Match transcript to known voice commands
   */
  private matchCommand(transcript: string): VoiceCommand | null {
    // Find the best matching command
    for (const command of VOICE_COMMANDS) {
      // Check main command
      if (transcript.includes(command.command)) {
        return command;
      }
      
      // Check variations
      for (const variation of command.variations) {
        if (transcript.includes(variation.toLowerCase())) {
          return command;
        }
      }
    }

    return null;
  }

  /**
   * Start listening for voice commands
   */
  startListening(continuous: boolean = false) {
    if (!this.isInitialized || !this.recognition) {
      this.onErrorCallback?.('Speech recognition not supported or not initialized');
      return;
    }

    console.log('🎤 Starting voice recognition (user initiated)');

    // Clear any pending start timeout
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }

    // If already listening, stop first and wait before restarting
    if (this.isListening) {
      console.log('Already listening, stopping first...');
      this.isManuallyRestarting = true; // Prevent auto-restart during manual restart
      this.stopListening();
      
      // Wait for the recognition to fully stop before restarting
      setTimeout(() => {
        this.startListeningInternal(continuous);
      }, 1000);
      return;
    }

    this.startListeningInternal(continuous);
  }

  /**
   * Internal method to start listening
   */
  private startListeningInternal(continuous: boolean = false) {
    if (!this.recognition || this.isListening) {
      return;
    }

    this.continuous = continuous;
    this.wakWordDetected = !continuous; // If continuous, skip wake word requirement

    try {
      console.log('Starting speech recognition...', { continuous });
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isListening = false;
      
      // If recognition is already started, try to stop and restart
      if (error instanceof Error && error.message.includes('already started')) {
        console.log('Recognition already started, attempting to stop and restart...');
        this.isManuallyRestarting = true;
        try {
          this.recognition.stop();
          setTimeout(() => {
            if (this.recognition && !this.isListening) {
              this.startListeningInternal(continuous);
            }
          }, 1500); // Longer delay to ensure full stop
        } catch (restartError) {
          console.error('Failed to restart voice recognition:', restartError);
          this.onErrorCallback?.('Failed to restart voice recognition');
        }
      } else {
        this.onErrorCallback?.('Failed to start voice recognition');
      }
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    console.log('🎤 Stopping voice recognition (user initiated)');
    
    // Clear any pending restart timeout
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }

    // Disable continuous mode
    this.continuous = false;
    
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    
    this.isListening = false;
  }

  /**
   * Set wake word
   */
  setWakeWord(wakeWord: string) {
    this.wakeWord = wakeWord.toLowerCase();
  }

  /**
   * Set command callback
   */
  onCommand(callback: (command: string, confidence: number) => void) {
    this.onCommandCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  /**
   * Set transcript callback
   */
  onTranscript(callback: (transcript: string) => void) {
    this.onTranscriptCallback = callback;
  }

  /**
   * Check if browser supports speech recognition
   */
  isSupported(): boolean {
    return this.isInitialized && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Get current listening state
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Cleanup method
   */
  cleanup() {
    console.log('🎤 Cleaning up voice service...');
    this.stopListening();
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }
    this.onCommandCallback = null;
    this.onErrorCallback = null;
    this.onTranscriptCallback = null;
  }
}

/**
 * Text-to-Speech Service
 */
export class TextToSpeechService {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
  private volume: number = 0.8;
  private rate: number = 0.9; // Slightly slower for elderly users
  private pitch: number = 1.0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initializeVoice();
  }

  /**
   * Initialize preferred voice (female, English)
   */
  private initializeVoice() {
    const voices = this.synth.getVoices();
    
    // Prefer female English voices
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.startsWith('en'));

    this.voice = preferredVoice || voices[0] || null;

    // If voices aren't loaded yet, try again when they are
    if (voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.initializeVoice();
      };
    }
  }

  /**
   * Speak text aloud
   */
  speak(text: string, options?: {
    volume?: number;
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (error: SpeechSynthesisErrorEvent) => void;
  }) {
    // Stop any current speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    utterance.volume = options?.volume ?? this.volume;
    utterance.rate = options?.rate ?? this.rate;
    utterance.pitch = options?.pitch ?? this.pitch;

    if (options?.onEnd) {
      utterance.onend = options.onEnd;
    }

    if (options?.onError) {
      utterance.onerror = options.onError;
    }

    try {
      this.synth.speak(utterance);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      options?.onError?.(error as SpeechSynthesisErrorEvent);
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Set speech parameters
   */
  setParameters(params: {
    volume?: number;
    rate?: number;
    pitch?: number;
  }) {
    if (params.volume !== undefined) this.volume = params.volume;
    if (params.rate !== undefined) this.rate = params.rate;
    if (params.pitch !== undefined) this.pitch = params.pitch;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Set preferred voice
   */
  setVoice(voice: SpeechSynthesisVoice) {
    this.voice = voice;
  }

  /**
   * Check if browser supports speech synthesis
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }
}

// Export singleton instances
export const voiceService = new VoiceService();
export const ttsService = new TextToSpeechService();

// Global type definitions for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    grammars: SpeechGrammarList;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }
  
  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
}