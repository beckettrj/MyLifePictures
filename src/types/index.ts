/**
 * Core type definitions for MyLifePictures.ai
 * Defines the data structures used throughout the application
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferred_ai_name: string;
  night_mode_start: string;
  night_mode_end: string;
  coaxing_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhotoFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  folder_id?: string;
  filename: string;
  display_name: string;
  file_path: string;
  file_size: number;
  width: number;
  height: number;
  taken_at?: string;
  is_hidden: boolean;
  is_favorite: boolean;
  annotation?: string;
  audio_annotation_url?: string;
  faces_detected: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AIProvider {
  id: 'openai' | 'gemini' | 'anthropic' | 'grok';
  name: string;
  icon: string;
  description: string;
  isConfigured: boolean;
  isValid: boolean;
  lastValidated?: string;
}

export interface VoiceCommand {
  command: string;
  variations: string[];
  action: string;
  parameters?: Record<string, any>;
}

export interface SlideshowSettings {
  mode: 'random' | 'sequential' | 'reverse' | 'date-asc' | 'date-desc';
  interval: number; // seconds
  folders: string[]; // folder IDs to include
  transition: 'fade' | 'slide' | 'zoom';
  show_captions: boolean;
  night_mode_active: boolean;
  is_playing: boolean;
  current_index: number;
  volume: number;
}

export interface AppSettings {
  ai_provider: AIProvider['id'];
  ai_assistant_name: string;
  voice_activation: 'push-to-talk' | 'wake-word' | 'always-on';
  wake_word: string;
  night_mode_start: string;
  night_mode_end: string;
  bedtime_message: string;
  font_size: 'small' | 'medium' | 'large' | 'xl';
  theme: 'light' | 'dark' | 'auto';
  high_contrast: boolean;
  coaxing_mode: boolean;
  profanity_filter: boolean;
  emergency_contacts: string[];
}

export interface AudioRecording {
  id: string;
  user_id: string;
  photo_id?: string;
  transcript: string;
  audio_url: string;
  duration: number;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'distress';
  created_at: string;
}