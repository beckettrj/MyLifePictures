/**
 * Application constants and configuration values
 * Centralized location for all app-wide settings
 */

export const APP_CONFIG = {
  name: 'MyLifePictures.ai',
  version: '1.0.0',
  description: 'AI-powered slideshow for elderly users',
  supportEmail: 'support@mylifepictures.ai',
} as const;

export const SLIDESHOW_INTERVALS = [
  { label: '3 seconds', value: 3 },
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 },
  { label: '15 seconds', value: 15 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
] as const;

export const TRANSITION_TYPES = [
  { label: 'Fade', value: 'fade' },
  { label: 'Slide', value: 'slide' },
  { label: 'Zoom', value: 'zoom' },
] as const;

export const FONT_SIZES = [
  { label: 'Small', value: 'small', class: 'text-sm' },
  { label: 'Medium', value: 'medium', class: 'text-base' },
  { label: 'Large', value: 'large', class: 'text-lg' },
  { label: 'Extra Large', value: 'xl', class: 'text-xl' },
] as const;

export const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI GPT',
    icon: '🤖',
    description: 'Advanced conversational AI with excellent elderly interaction',
    envKey: 'VITE_OPENAI_API_KEY',
  },
  {
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    icon: '🧠',
    description: 'Thoughtful AI assistant with safety-first approach',
    envKey: 'VITE_ANTHROPIC_API_KEY',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    description: 'Multimodal AI with image understanding capabilities',
    envKey: 'VITE_GEMINI_API_KEY',
  },
] as const;

export const VOICE_COMMANDS = [
  { command: 'next', variations: ['next picture', 'next photo', 'move on'], action: 'NEXT_IMAGE' },
  { command: 'previous', variations: ['previous picture', 'go back', 'last one'], action: 'PREV_IMAGE' },
  { command: 'pause', variations: ['stop', 'wait', 'hold on'], action: 'PAUSE_SLIDESHOW' },
  { command: 'play', variations: ['continue', 'start', 'resume'], action: 'PLAY_SLIDESHOW' },
  { command: 'slower', variations: ['slow down', 'go slower'], action: 'SLOWER' },
  { command: 'faster', variations: ['speed up', 'go faster'], action: 'FASTER' },
  { command: 'dim', variations: ['darker', 'night mode'], action: 'TOGGLE_NIGHT_MODE' },
  { command: 'brighter', variations: ['brighten', 'day mode'], action: 'TOGGLE_DAY_MODE' },
  { command: 'skip', variations: ['skip this one', 'next folder'], action: 'SKIP_IMAGE' },
  { command: 'favorite', variations: ['I love this', 'mark favorite'], action: 'MARK_FAVORITE' },
  { command: 'hide', variations: ['dont show this', 'remove this'], action: 'HIDE_IMAGE' },
  { command: 'tell me about', variations: ['describe this', 'what is this'], action: 'DESCRIBE_IMAGE' },
  { command: 'annotate', variations: ['let me tell you', 'story time'], action: 'START_ANNOTATION' },
] as const;

export const EMERGENCY_KEYWORDS = [
  'help', 'emergency', 'pain', 'hurt', 'fallen', 'sick', 'dizzy', 'chest pain',
  'can\'t breathe', 'call doctor', 'call nurse', 'medication', 'pills'
] as const;

export const COLOR_THEMES = {
  light: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    textSecondary: '#6B7280',
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#34D399',
    accent: '#FBBF24',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
  },
  highContrast: {
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#FFD700',
    background: '#FFFFFF',
    surface: '#F0F0F0',
    text: '#000000',
    textSecondary: '#333333',
  },
} as const;