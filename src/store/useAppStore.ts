/**
 * Global application state management using Zustand
 * Handles user settings, slideshow state, and UI preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, SlideshowSettings, Photo, PhotoFolder, User, AIProvider } from '../types';

interface AppState {
  // User and authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Settings
  settings: AppSettings;
  slideshowSettings: SlideshowSettings;
  
  // Photos and folders
  photos: Photo[];
  folders: PhotoFolder[];
  currentPhoto: Photo | null;
  
  // AI and voice
  aiProviders: AIProvider[];
  isListening: boolean;
  lastVoiceCommand: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  currentView: 'setup' | 'slideshow' | 'settings' | 'photos' | 'test' | 'microphone' | 'storage';
  
  // Actions
  setUser: (user: User | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateSlideshowSettings: (settings: Partial<SlideshowSettings>) => void;
  setPhotos: (photos: Photo[]) => void;
  setFolders: (folders: PhotoFolder[]) => void;
  setCurrentPhoto: (photo: Photo | null) => void;
  updateAIProvider: (providerId: string, updates: Partial<AIProvider>) => void;
  setListening: (listening: boolean) => void;
  setLastVoiceCommand: (command: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  clearError: () => void;
}

const defaultSettings: AppSettings = {
  ai_provider: 'openai',
  ai_assistant_name: 'Sunny',
  voice_activation: 'wake-word',
  wake_word: 'Hey Sunny',
  night_mode_start: '20:00',
  night_mode_end: '07:00',
  bedtime_message: 'Sweet dreams! Sleep well and we\'ll see you tomorrow.',
  font_size: 'large',
  theme: 'light',
  high_contrast: false,
  coaxing_mode: false,
  profanity_filter: true,
  emergency_contacts: [],
};

const defaultSlideshowSettings: SlideshowSettings = {
  mode: 'random',
  interval: 10,
  folders: [],
  transition: 'fade',
  show_captions: true,
  night_mode_active: false,
  is_playing: false,
  current_index: 0,
  volume: 0.8,
};

const defaultAIProviders: AIProvider[] = [
  { id: 'openai', name: 'OpenAI GPT', icon: '🤖', description: 'Advanced conversational AI', isConfigured: false, isValid: false },
  { id: 'anthropic', name: 'Claude', icon: '🧠', description: 'Safety-focused AI assistant', isConfigured: false, isValid: false },
  { id: 'gemini', name: 'Google Gemini', icon: '✨', description: 'Multimodal AI', isConfigured: false, isValid: false },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      settings: defaultSettings,
      slideshowSettings: defaultSlideshowSettings,
      photos: [],
      folders: [],
      currentPhoto: null,
      aiProviders: defaultAIProviders,
      isListening: false,
      lastVoiceCommand: null,
      isLoading: false,
      error: null,
      currentView: 'storage', // Start with storage setup

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      updateSlideshowSettings: (newSettings) =>
        set((state) => ({
          slideshowSettings: { ...state.slideshowSettings, ...newSettings },
        })),
      
      setPhotos: (photos) => set({ photos }),
      
      setFolders: (folders) => set({ folders }),
      
      setCurrentPhoto: (photo) => set({ currentPhoto: photo }),
      
      updateAIProvider: (providerId, updates) =>
        set((state) => ({
          aiProviders: state.aiProviders.map((provider) =>
            provider.id === providerId ? { ...provider, ...updates } : provider
          ),
        })),
      
      setListening: (listening) => set({ isListening: listening }),
      
      setLastVoiceCommand: (command) => set({ lastVoiceCommand: command }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setCurrentView: (view) => set({ currentView: view }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'mylifepictures-storage',
      // Only persist certain parts of the state
      partialize: (state) => ({
        settings: state.settings,
        slideshowSettings: state.slideshowSettings,
        aiProviders: state.aiProviders,
      }),
    }
  )
);