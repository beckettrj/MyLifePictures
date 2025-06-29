/**
 * Global application state management using Zustand
 * Simplified to avoid database dependencies
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
  currentView: 'slideshow' | 'photos' | 'settings' | 'dev-panel';
  
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
  voice_activation: 'push-to-talk', // Default to push-to-talk (microphone OFF)
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
  developer_mode: false, // Hidden developer mode toggle
};

const defaultSlideshowSettings: SlideshowSettings = {
  mode: 'random',
  interval: 10, // Default to 10 seconds between photos
  folders: [], // UUID string format folder IDs
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

// Sample photos for demo purposes
const samplePhotos: Photo[] = [
  {
    id: 1,
    created_at: new Date().toISOString(),
    folder_id: 1,
    display_name: 'Family Vacation',
    file_path: 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg',
    is_hidden: false,
    is_favorite: true,
    tags: ['family', 'vacation', 'beach']
  },
  {
    id: 2,
    created_at: new Date().toISOString(),
    folder_id: 1,
    display_name: 'Birthday Party',
    file_path: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
    is_hidden: false,
    is_favorite: false,
    tags: ['birthday', 'celebration']
  },
  {
    id: 3,
    created_at: new Date().toISOString(),
    folder_id: 2,
    display_name: 'Graduation Day',
    file_path: 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg',
    is_hidden: false,
    is_favorite: true,
    tags: ['graduation', 'achievement']
  },
  {
    id: 4,
    created_at: new Date().toISOString(),
    folder_id: 2,
    display_name: 'Wedding Anniversary',
    file_path: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg',
    is_hidden: false,
    is_favorite: false,
    tags: ['wedding', 'anniversary', 'love']
  },
  {
    id: 5,
    created_at: new Date().toISOString(),
    folder_id: 3,
    display_name: 'Family Reunion',
    file_path: 'https://images.pexels.com/photos/1416736/pexels-photo-1416736.jpeg',
    is_hidden: false,
    is_favorite: true,
    tags: ['family', 'reunion']
  }
];

// Sample folders for demo purposes
const sampleFolders: PhotoFolder[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Family',
    description: 'Family photos and memories',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 1,
    name: 'Celebrations',
    description: 'Special occasions and celebrations',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    user_id: 1,
    name: 'Vacations',
    description: 'Travel memories and adventures',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state - ALWAYS start with user NOT authenticated
      user: null,
      isAuthenticated: false,
      settings: defaultSettings,
      slideshowSettings: defaultSlideshowSettings,
      photos: samplePhotos, // Use sample photos for demo
      folders: sampleFolders, // Use sample folders for demo
      currentPhoto: samplePhotos[0], // Start with first sample photo
      aiProviders: defaultAIProviders,
      isListening: false, // ALWAYS start with microphone OFF
      lastVoiceCommand: null,
      isLoading: false,
      error: null,
      currentView: 'slideshow', // Start with slideshow

      // Actions
      setUser: (user) => {
        console.log('👤 Setting user in store:', user?.id || 'null');
        set({ user, isAuthenticated: !!user });
      },
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      updateSlideshowSettings: (newSettings) =>
        set((state) => ({
          slideshowSettings: { ...state.slideshowSettings, ...newSettings },
        })),
      
      setPhotos: (photos) => {
        // Ensure photos is always an array
        const photoArray = Array.isArray(photos) ? photos : [];
        set({ photos: photoArray });
      },
      
      setFolders: (folders) => {
        // Ensure folders is always an array
        const folderArray = Array.isArray(folders) ? folders : [];
        set({ folders: folderArray });
      },
      
      setCurrentPhoto: (photo) => set({ currentPhoto: photo }),
      
      updateAIProvider: (providerId, updates) =>
        set((state) => ({
          aiProviders: state.aiProviders.map((provider) =>
            provider.id === providerId ? { ...provider, ...updates } : provider
          ),
        })),
      
      setListening: (listening) => {
        console.log('🎤 Setting listening state in store:', listening);
        set({ isListening: listening });
      },
      
      setLastVoiceCommand: (command) => set({ lastVoiceCommand: command }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setCurrentView: (view) => set({ currentView: view }),
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'mylifepictures-storage',
      // Only persist certain parts of the state - NEVER persist user or isListening
      partialize: (state) => ({
        settings: state.settings,
        slideshowSettings: state.slideshowSettings,
        aiProviders: state.aiProviders,
        // DO NOT persist user, isAuthenticated, or isListening
        // These should always start fresh
      }),
    }
  )
);