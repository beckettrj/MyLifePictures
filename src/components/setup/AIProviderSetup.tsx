/**
 * AI Provider configuration component
 * Allows users to configure and validate AI service API keys
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { aiService } from '../../services/aiService';
import { AI_PROVIDERS } from '../../config/constants';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export function AIProviderSetup() {
  const { aiProviders, updateAIProvider, settings, updateSettings } = useAppStore();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});

  const handleKeyChange = (providerId: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: key }));
    
    // Reset validation status when key changes
    updateAIProvider(providerId, { isValid: false, lastValidated: undefined });
  };

  const validateProvider = useCallback(async (providerId: string) => {
    const apiKey = apiKeys[providerId];
    if (!apiKey?.trim()) return;

    setValidating(prev => ({ ...prev, [providerId]: true }));

    try {
      // Configure the provider with the new key
      aiService.configureProvider(providerId, apiKey.trim());
      
      // Validate the key
      const isValid = await aiService.validateProvider(providerId);
      
      updateAIProvider(providerId, {
        isConfigured: isValid,
        isValid,
        lastValidated: new Date().toISOString(),
      });

      if (isValid) {
        // If this is the first valid provider, set it as current
        const hasCurrentValidProvider = aiProviders.some(p => p.isValid && p.id === settings.ai_provider);
        if (!hasCurrentValidProvider) {
          updateSettings({ ai_provider: providerId as any });
        }
      }
    } catch (error) {
      console.error(`Failed to validate ${providerId}:`, error);
      updateAIProvider(providerId, {
        isConfigured: false,
        isValid: false,
        lastValidated: new Date().toISOString(),
      });
    } finally {
      setValidating(prev => ({ ...prev, [providerId]: false }));
    }
  }, [apiKeys, aiProviders, settings.ai_provider, updateAIProvider, updateSettings]);

  const toggleKeyVisibility = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const setAsDefault = (providerId: string) => {
    updateSettings({ ai_provider: providerId as any });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Configure AI Assistant
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Set up your AI assistant to enable voice conversations and photo descriptions. 
          Choose from our supported providers and enter your API keys below.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {AI_PROVIDERS.map((provider) => {
          const providerState = aiProviders.find(p => p.id === provider.id);
          const isValidating = validating[provider.id];
          const currentKey = apiKeys[provider.id] || '';
          const isCurrentProvider = settings.ai_provider === provider.id;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`relative ${isCurrentProvider ? 'ring-2 ring-blue-500' : ''}`}>
                {isCurrentProvider && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Active
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <CardTitle level={3}>{provider.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* API Key Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showKeys[provider.id] ? 'text' : 'password'}
                          value={currentKey}
                          onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                          placeholder="Enter your API key..."
                          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {/* Validation Status */}
                          {providerState?.isValid && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                          {providerState?.lastValidated && !providerState.isValid && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          
                          {/* Show/Hide Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(provider.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {showKeys[provider.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => validateProvider(provider.id)}
                        disabled={!currentKey.trim() || isValidating}
                        loading={isValidating}
                        className="flex-1"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          'Validate'
                        )}
                      </Button>

                      {providerState?.isValid && !isCurrentProvider && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAsDefault(provider.id)}
                          className="whitespace-nowrap"
                        >
                          Set Default
                        </Button>
                      )}
                    </div>

                    {/* Status Messages */}
                    {providerState?.lastValidated && (
                      <div className={`text-sm p-2 rounded ${
                        providerState.isValid 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {providerState.isValid 
                          ? '✅ API key is valid and ready to use!' 
                          : '❌ Invalid API key. Please check and try again.'}
                      </div>
                    )}

                    {/* Setup Instructions Link */}
                    <div className="text-xs text-gray-500">
                      <a
                        href={getSetupInstructionsUrl(provider.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        How to get your {provider.name} API key →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Setup Status Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Setup Status</h3>
        <div className="space-y-2 text-sm">
          {aiProviders.some(p => p.isValid) ? (
            <p className="text-green-700">
              ✅ Great! You have at least one AI provider configured. 
              Your assistant "{settings.ai_assistant_name}" is ready to help.
            </p>
          ) : (
            <p className="text-blue-700">
              ⏳ Configure at least one AI provider to enable voice conversations and photo descriptions.
            </p>
          )}
          
          <p className="text-blue-600">
            💡 <strong>Tip:</strong> Different providers have different strengths. 
            OpenAI is great for conversations, while Gemini excels at describing photos.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Get setup instructions URL for each provider
 */
function getSetupInstructionsUrl(providerId: string): string {
  switch (providerId) {
    case 'openai':
      return 'https://platform.openai.com/api-keys';
    case 'anthropic':
      return 'https://console.anthropic.com/account/keys';
    case 'gemini':
      return 'https://makersuite.google.com/app/apikey';
    default:
      return '#';
  }
}