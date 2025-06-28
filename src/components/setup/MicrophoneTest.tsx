/**
 * Microphone test component
 * Tests microphone access, voice recognition, and audio recording
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

interface AudioLevel {
  current: number;
  peak: number;
}

export function MicrophoneTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState<AudioLevel>({ current: 0, peak: 0 });
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const [voiceTestResults, setVoiceTestResults] = useState<string[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationFrameRef = useRef<number>();

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
    initializeSpeechRecognition();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setMicPermission(permission.state);
      
      permission.onchange = () => {
        setMicPermission(permission.state);
      };
    } catch (error) {
      console.error('Permission check failed:', error);
      setMicPermission('unknown');
    }
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          const command = finalTranscript.toLowerCase().trim();
          setLastCommand(command);
          setVoiceTestResults(prev => [...prev, `"${command}"`].slice(-5));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const startAudioLevelMonitoring = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedLevel = average / 255;
          
          setAudioLevel(prev => ({
            current: normalizedLevel,
            peak: Math.max(prev.peak, normalizedLevel)
          }));
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Audio level monitoring failed:', error);
    }
  };

  const runMicrophoneTests = async () => {
    setTesting(true);
    setResults([]);
    setVoiceTestResults([]);
    const testResults: TestResult[] = [];

    // Test 1: Browser Support
    testResults.push({
      name: 'Browser Support',
      status: 'pending',
      message: 'Checking browser capabilities...',
    });
    setResults([...testResults]);

    await new Promise(resolve => setTimeout(resolve, 500));

    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasSpeechSynthesis = !!window.speechSynthesis;

    if (hasMediaDevices && hasSpeechRecognition && hasSpeechSynthesis) {
      testResults[0] = {
        name: 'Browser Support',
        status: 'success',
        message: 'All required APIs are supported',
        details: 'MediaDevices, SpeechRecognition, and SpeechSynthesis are available',
      };
    } else {
      testResults[0] = {
        name: 'Browser Support',
        status: 'error',
        message: 'Missing required browser APIs',
        details: `Missing: ${!hasMediaDevices ? 'MediaDevices ' : ''}${!hasSpeechRecognition ? 'SpeechRecognition ' : ''}${!hasSpeechSynthesis ? 'SpeechSynthesis' : ''}`,
      };
    }

    setResults([...testResults]);

    if (!hasMediaDevices) {
      setTesting(false);
      return;
    }

    // Test 2: Microphone Permission
    testResults.push({
      name: 'Microphone Permission',
      status: 'pending',
      message: 'Requesting microphone access...',
    });
    setResults([...testResults]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      testResults[1] = {
        name: 'Microphone Permission',
        status: 'success',
        message: 'Microphone access granted',
        details: 'Successfully obtained audio stream',
      };

      // Start audio level monitoring
      await startAudioLevelMonitoring(stream);

      setResults([...testResults]);

      // Test 3: Audio Input Level
      testResults.push({
        name: 'Audio Input Level',
        status: 'pending',
        message: 'Testing audio input... Please speak!',
      });
      setResults([...testResults]);

      // Wait for audio input
      await new Promise(resolve => {
        const checkAudioLevel = () => {
          if (audioLevel.current > 0.1) {
            resolve(true);
          } else {
            setTimeout(checkAudioLevel, 100);
          }
        };
        
        // Timeout after 10 seconds
        setTimeout(() => resolve(false), 10000);
        checkAudioLevel();
      });

      if (audioLevel.peak > 0.1) {
        testResults[2] = {
          name: 'Audio Input Level',
          status: 'success',
          message: 'Audio input detected',
          details: `Peak level: ${(audioLevel.peak * 100).toFixed(1)}%`,
        };
      } else {
        testResults[2] = {
          name: 'Audio Input Level',
          status: 'warning',
          message: 'Low or no audio detected',
          details: 'Check your microphone volume or try speaking louder',
        };
      }

      setResults([...testResults]);

      // Test 4: Speech Recognition
      if (hasSpeechRecognition) {
        testResults.push({
          name: 'Speech Recognition',
          status: 'pending',
          message: 'Testing speech recognition... Say "Hello"',
        });
        setResults([...testResults]);

        try {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);

            // Wait for speech recognition result
            await new Promise(resolve => {
              const timeout = setTimeout(() => resolve(false), 10000);
              
              const checkTranscript = () => {
                if (lastCommand.includes('hello') || transcript.toLowerCase().includes('hello')) {
                  clearTimeout(timeout);
                  resolve(true);
                } else {
                  setTimeout(checkTranscript, 100);
                }
              };
              
              checkTranscript();
            });

            recognitionRef.current.stop();
            setIsListening(false);

            if (lastCommand || transcript) {
              testResults[3] = {
                name: 'Speech Recognition',
                status: 'success',
                message: 'Speech recognition working',
                details: `Recognized: "${lastCommand || transcript}"`,
              };
            } else {
              testResults[3] = {
                name: 'Speech Recognition',
                status: 'warning',
                message: 'No speech recognized',
                details: 'Try speaking more clearly or check microphone position',
              };
            }
          }
        } catch (error) {
          testResults[3] = {
            name: 'Speech Recognition',
            status: 'error',
            message: 'Speech recognition failed',
            details: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      setResults([...testResults]);

      // Clean up stream
      stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      testResults[1] = {
        name: 'Microphone Permission',
        status: 'error',
        message: 'Microphone access denied',
        details: error instanceof Error ? error.message : 'Permission denied',
      };
      setResults([...testResults]);
    }

    setTesting(false);
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setTranscript('');
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const testTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Hello! This is a test of the text to speech system. Can you hear me clearly?');
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const resetTests = () => {
    setResults([]);
    setVoiceTestResults([]);
    setTranscript('');
    setLastCommand('');
    setAudioLevel({ current: 0, peak: 0 });
    cleanup();
    initializeSpeechRecognition();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'pending':
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎤 Microphone & Voice Test
        </h2>
        <p className="text-gray-600">
          Test your microphone, voice recognition, and audio output for the AI slideshow
        </p>
      </div>

      {/* Quick Status */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Microphone Permission */}
            <div className="text-center p-4 rounded-lg border-2 border-gray-200">
              <div className="flex justify-center mb-2">
                {micPermission === 'granted' ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : micPermission === 'denied' ? (
                  <XCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                )}
              </div>
              <h4 className="font-medium">Microphone</h4>
              <p className="text-sm text-gray-600 capitalize">{micPermission}</p>
            </div>

            {/* Audio Level */}
            <div className="text-center p-4 rounded-lg border-2 border-gray-200">
              <div className="flex justify-center mb-2">
                {audioLevel.current > 0.1 ? (
                  <Volume2 className="w-8 h-8 text-green-500" />
                ) : (
                  <VolumeX className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h4 className="font-medium">Audio Level</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel.current * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Peak: {(audioLevel.peak * 100).toFixed(0)}%
              </p>
            </div>

            {/* Voice Recognition */}
            <div className="text-center p-4 rounded-lg border-2 border-gray-200">
              <div className="flex justify-center mb-2">
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="w-8 h-8 text-red-500" />
                  </motion.div>
                ) : (
                  <MicOff className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <h4 className="font-medium">Voice Recognition</h4>
              <p className="text-sm text-gray-600">
                {isListening ? 'Listening...' : 'Stopped'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Tests */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Voice Recognition Test */}
        <Card>
          <CardHeader>
            <CardTitle level={3}>Voice Recognition Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant={isListening ? "danger" : "primary"}
                size="lg"
                onClick={toggleVoiceRecognition}
                fullWidth
                className="mb-4"
              >
                {isListening ? (
                  <>
                    <Square className="w-5 h-5 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>

              {transcript && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Current:</p>
                  <p className="text-blue-800">"{transcript}"</p>
                </div>
              )}

              {voiceTestResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Recent Commands:</p>
                  {voiceTestResults.map((result, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                      {result}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-600">
                <p>💡 Try saying: "Hello", "Next picture", "Pause", "Hey Sunny"</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Output Test */}
        <Card>
          <CardHeader>
            <CardTitle level={3}>Audio Output Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={testTextToSpeech}
                fullWidth
              >
                <Play className="w-5 h-5 mr-2" />
                Test Text-to-Speech
              </Button>

              <div className="text-sm text-gray-600 space-y-2">
                <p>This will test if you can hear the AI assistant's voice responses.</p>
                <p>Make sure your speakers or headphones are turned on.</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> The AI assistant will use this same voice to respond to your commands during the slideshow.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Test */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Comprehensive Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={runMicrophoneTests}
                disabled={testing}
                loading={testing}
                className="flex-1"
              >
                {testing ? 'Running Tests...' : 'Run Full Test Suite'}
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={resetTests}
                disabled={testing}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Test Results:</h4>
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <h5 className="font-medium">{result.name}</h5>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.details && (
                          <p className="text-xs mt-2 opacity-75 font-mono bg-black/5 p-2 rounded">
                            {result.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>🔧 Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">Microphone not working?</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check if your microphone is plugged in and turned on</li>
                <li>Make sure the browser has microphone permission</li>
                <li>Try refreshing the page and allowing microphone access</li>
                <li>Check your system's microphone settings</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium text-gray-900">Voice recognition not accurate?</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Speak clearly and at a normal pace</li>
                <li>Reduce background noise</li>
                <li>Position the microphone closer to your mouth</li>
                <li>Try using a headset microphone for better quality</li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-gray-900">Can't hear text-to-speech?</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check your speaker/headphone volume</li>
                <li>Make sure the browser isn't muted</li>
                <li>Try a different browser (Chrome works best)</li>
                <li>Check system audio settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}