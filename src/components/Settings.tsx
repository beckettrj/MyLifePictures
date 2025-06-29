/**
 * Settings component - Simplified to work without database connections
 * Allows users to customize slideshow settings and preferences
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Settings as SettingsIcon, 
  Clock, 
  Moon, 
  Sun, 
  Volume2, 
  Zap,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { SLIDESHOW_INTERVALS } from '../config/constants';

export function Settings() {
  const { settings, updateSettings, slideshowSettings, updateSlideshowSettings } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  // Save settings (simulated)
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    setSaveStatus(null);
    
    try {
      // Simulate saving delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success message
      setSaveMessage('Settings saved successfully!');
      setSaveStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('An error occurred while saving settings');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Settings</h2>
        <p className="text-lg text-gray-600">
          Customize your MyLifePictures experience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Slideshow Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Slideshow Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seconds Between Photos
              </label>
              <select
                value={slideshowSettings.interval}
                onChange={(e) => updateSlideshowSettings({ interval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {SLIDESHOW_INTERVALS.map((interval) => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Current value: {slideshowSettings.interval} seconds
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transition Effect
              </label>
              <select
                value={slideshowSettings.transition}
                onChange={(e) => updateSlideshowSettings({ transition: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="fade">Fade</option>
                <option value="slide">Slide</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <select
                value={slideshowSettings.mode}
                onChange={(e) => updateSlideshowSettings({ mode: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="random">Random</option>
                <option value="sequential">Alphabetical (A-Z)</option>
                <option value="reverse">Reverse Alphabetical (Z-A)</option>
                <option value="date-asc">Oldest First</option>
                <option value="date-desc">Newest First</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={slideshowSettings.show_captions}
                  onChange={(e) => updateSlideshowSettings({ show_captions: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Show photo captions
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* AI Assistant Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assistant Name
              </label>
              <input
                type="text"
                value={settings.ai_assistant_name}
                onChange={(e) => updateSettings({ ai_assistant_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Sunny"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wake Word
              </label>
              <input
                type="text"
                value={settings.wake_word}
                onChange={(e) => updateSettings({ wake_word: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Hey Sunny"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.coaxing_mode}
                  onChange={(e) => updateSettings({ coaxing_mode: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable coaxing mode (ask about photos)
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Night Mode Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3}>Night Mode Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.night_mode_start}
                  onChange={(e) => updateSettings({ night_mode_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.night_mode_end}
                  onChange={(e) => updateSettings({ night_mode_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedtime Message
              </label>
              <textarea
                value={settings.bedtime_message}
                onChange={(e) => updateSettings({ bedtime_message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Sweet dreams! Sleep well and we'll see you tomorrow."
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle level={3} className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={settings.font_size}
                onChange={(e) => updateSettings({ font_size: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.high_contrast}
                  onChange={(e) => updateSettings({ high_contrast: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  High contrast mode
                </span>
              </label>
            </div>

            {/* Developer Mode Toggle - Hidden */}
            <div className="border-t pt-4 mt-6">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.developer_mode}
                    onChange={(e) => updateSettings({ developer_mode: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Developer mode (advanced debugging tools)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Enables access to debugging and testing tools for developers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-center mt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={saveSettings}
          disabled={isSaving}
          loading={isSaving}
          className="px-8"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center p-4 rounded-lg ${
            saveStatus === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {saveStatus === 'success' && <CheckCircle className="w-5 h-5" />}
            {saveStatus === 'error' && <Zap className="w-5 h-5" />}
            <span>{saveMessage}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}