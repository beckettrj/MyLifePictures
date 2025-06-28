/**
 * AI Service for managing multiple LLM providers
 * Handles OpenAI, Anthropic, and Google Gemini integrations
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from '../types';

/**
 * Base AI Service class
 */
abstract class BaseAIService {
  protected apiKey: string;
  protected isConfigured: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.isConfigured = !!apiKey;
  }

  abstract validateApiKey(): Promise<boolean>;
  abstract generateResponse(prompt: string, context?: any): Promise<string>;
  abstract describeImage(imageUrl: string, prompt?: string): Promise<string>;
}

/**
 * OpenAI Service Implementation
 */
class OpenAIService extends BaseAIService {
  private client: OpenAI | null = null;

  constructor(apiKey?: string) {
    super(apiKey);
    if (this.isConfigured) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      console.error('OpenAI API validation failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    if (!this.client) throw new Error('OpenAI not configured');

    const systemPrompt = `You are ${context?.assistantName || 'Sunny'}, a caring AI assistant designed specifically for elderly users. 
    You speak in a warm, patient, and encouraging tone. Keep responses brief but meaningful. 
    You're helping with a photo slideshow experience. Always be gentle and understanding.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || 'I apologize, I didn\'t understand that.';
    } catch (error) {
      console.error('OpenAI response generation failed:', error);
      throw new Error('Unable to generate response');
    }
  }

  async describeImage(imageUrl: string, prompt?: string): Promise<string> {
    if (!this.client) throw new Error('OpenAI not configured');

    const defaultPrompt = 'Describe this photo in a warm, personal way as if talking to someone who might have memory difficulties. Focus on the people, emotions, and story you can see.';

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt || defaultPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content || 'I can see this is a meaningful photo, but I\'m having trouble describing it right now.';
    } catch (error) {
      console.error('OpenAI image description failed:', error);
      throw new Error('Unable to describe image');
    }
  }
}

/**
 * Anthropic Claude Service Implementation
 */
class AnthropicService extends BaseAIService {
  private client: Anthropic | null = null;

  constructor(apiKey?: string) {
    super(apiKey);
    if (this.isConfigured) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hello' }],
      });
      return true;
    } catch (error) {
      console.error('Anthropic API validation failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    if (!this.client) throw new Error('Anthropic not configured');

    const systemPrompt = `You are ${context?.assistantName || 'Sunny'}, a compassionate AI companion for elderly users. 
    You're patient, encouraging, and speak in simple, clear language. You're helping with a photo viewing experience.
    Always prioritize the user's emotional wellbeing and comfort.`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      return content.type === 'text' ? content.text : 'I apologize, I didn\'t understand that.';
    } catch (error) {
      console.error('Anthropic response generation failed:', error);
      throw new Error('Unable to generate response');
    }
  }

  async describeImage(imageUrl: string, prompt?: string): Promise<string> {
    // Note: Anthropic Claude currently has limited image support in browser environments
    // This is a placeholder for future implementation
    throw new Error('Image description not yet supported with Anthropic in browser environment');
  }
}

/**
 * Google Gemini Service Implementation
 */
class GeminiService extends BaseAIService {
  private client: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    super(apiKey);
    if (this.isConfigured) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      await model.generateContent('Hello');
      return true;
    } catch (error) {
      console.error('Gemini API validation failed:', error);
      return false;
    }
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    if (!this.client) throw new Error('Gemini not configured');

    const systemPrompt = `You are ${context?.assistantName || 'Sunny'}, a gentle AI assistant for elderly users. 
    Speak warmly and clearly. You're helping with a photo slideshow. Be patient and understanding.`;

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${prompt}`);
      const response = await result.response;
      
      return response.text() || 'I apologize, I didn\'t understand that.';
    } catch (error) {
      console.error('Gemini response generation failed:', error);
      throw new Error('Unable to generate response');
    }
  }

  async describeImage(imageUrl: string, prompt?: string): Promise<string> {
    if (!this.client) throw new Error('Gemini not configured');

    const defaultPrompt = 'Describe this photo warmly and personally, focusing on the people and emotions you can see.';

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      // Convert image URL to base64 (simplified - in production, handle this properly)
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const imagePart = {
        inlineData: {
          data: base64.split(',')[1],
          mimeType: blob.type,
        },
      };

      const result = await model.generateContent([prompt || defaultPrompt, imagePart]);
      const text = result.response.text();
      
      return text || 'I can see this is a meaningful photo, but I\'m having trouble describing it right now.';
    } catch (error) {
      console.error('Gemini image description failed:', error);
      throw new Error('Unable to describe image');
    }
  }
}

/**
 * AI Service Manager
 */
export class AIServiceManager {
  private services: Map<string, BaseAIService> = new Map();
  private currentProvider: string = 'openai';

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Initialize services with environment variables
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    this.services.set('openai', new OpenAIService(openaiKey));
    this.services.set('anthropic', new AnthropicService(anthropicKey));
    this.services.set('gemini', new GeminiService(geminiKey));
  }

  /**
   * Configure an AI provider with API key
   */
  configureProvider(providerId: string, apiKey: string) {
    switch (providerId) {
      case 'openai':
        this.services.set('openai', new OpenAIService(apiKey));
        break;
      case 'anthropic':
        this.services.set('anthropic', new AnthropicService(apiKey));
        break;
      case 'gemini':
        this.services.set('gemini', new GeminiService(apiKey));
        break;
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  }

  /**
   * Validate API key for a provider
   */
  async validateProvider(providerId: string): Promise<boolean> {
    const service = this.services.get(providerId);
    if (!service) return false;
    
    try {
      return await service.validateApiKey();
    } catch (error) {
      console.error(`Validation failed for ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Set the current AI provider
   */
  setCurrentProvider(providerId: string) {
    if (this.services.has(providerId)) {
      this.currentProvider = providerId;
    } else {
      throw new Error(`Provider ${providerId} not available`);
    }
  }

  /**
   * Generate a response using the current provider
   */
  async generateResponse(prompt: string, context?: any): Promise<string> {
    const service = this.services.get(this.currentProvider);
    if (!service) {
      throw new Error(`No service configured for ${this.currentProvider}`);
    }

    return await service.generateResponse(prompt, context);
  }

  /**
   * Describe an image using the current provider
   */
  async describeImage(imageUrl: string, prompt?: string): Promise<string> {
    const service = this.services.get(this.currentProvider);
    if (!service) {
      throw new Error(`No service configured for ${this.currentProvider}`);
    }

    return await service.describeImage(imageUrl, prompt);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(providerId: string): boolean {
    const service = this.services.get(providerId);
    return service?.isConfigured || false;
  }
}

// Export singleton instance
export const aiService = new AIServiceManager();