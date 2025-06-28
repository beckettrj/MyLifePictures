/**
 * Storage bucket setup component
 * Helps users create required storage buckets in Supabase
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  RefreshCw,
  Folder,
  Image,
  Mic,
  Info
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface BucketStatus {
  name: string;
  exists: boolean;
  isPublic: boolean;
  error?: string;
}

export function StorageBucketSetup() {
  const [buckets, setBuckets] = useState<BucketStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const requiredBuckets = [
    { 
      name: 'photos', 
      description: 'Stores user uploaded photos and images',
      icon: <Image className="w-5 h-5" />
    },
    { 
      name: 'audio', 
      description: 'Stores voice recordings and annotations',
      icon: <Mic className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    checkBuckets();
  }, []);

  const checkBuckets = async () => {
    setChecking(true);
    try {
      console.log('🔍 Checking storage buckets...');
      
      const { data: existingBuckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Failed to list buckets:', error);
        setBuckets(requiredBuckets.map(bucket => ({
          name: bucket.name,
          exists: false,
          isPublic: false,
          error: error.message
        })));
        return;
      }

      console.log('📦 Found buckets:', existingBuckets?.map(b => b.name));

      const bucketStatus = requiredBuckets.map(requiredBucket => {
        const existingBucket = existingBuckets?.find(b => b.name === requiredBucket.name);
        return {
          name: requiredBucket.name,
          exists: !!existingBucket,
          isPublic: existingBucket?.public || false,
        };
      });

      setBuckets(bucketStatus);
      console.log('✅ Bucket status updated:', bucketStatus);
    } catch (error) {
      console.error('💥 Error checking buckets:', error);
      setBuckets(requiredBuckets.map(bucket => ({
        name: bucket.name,
        exists: false,
        isPublic: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })));
    } finally {
      setChecking(false);
    }
  };

  const createBucket = async (bucketName: string) => {
    setLoading(true);
    try {
      console.log(`🪣 Creating bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: bucketName === 'photos' 
          ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
          : ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm'],
        fileSizeLimit: bucketName === 'photos' ? 10485760 : 5242880 // 10MB for photos, 5MB for audio
      });

      if (error) {
        console.error(`❌ Failed to create bucket ${bucketName}:`, error);
        throw error;
      }

      console.log(`✅ Bucket ${bucketName} created successfully:`, data);
      
      // Refresh bucket list
      await checkBuckets();
    } catch (error) {
      console.error(`💥 Error creating bucket ${bucketName}:`, error);
      alert(`Failed to create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyInstructions = () => {
    const instructions = `
# Supabase Storage Bucket Setup Instructions

## Required Buckets:
1. photos (public) - For user uploaded images
2. audio (public) - For voice recordings

## Manual Setup Steps:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/storage/buckets
2. Click "Create a new bucket"
3. Create bucket named "photos" (set as public)
4. Create bucket named "audio" (set as public)

## Bucket Policies:
- Both buckets should be set to PUBLIC
- Enable file uploads for authenticated users
- Set appropriate file size limits (10MB for photos, 5MB for audio)
`;
    
    navigator.clipboard.writeText(instructions);
    alert('Instructions copied to clipboard!');
  };

  const allBucketsExist = buckets.length > 0 && buckets.every(bucket => bucket.exists);
  const anyBucketMissing = buckets.some(bucket => !bucket.exists);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ☁️ Storage Bucket Setup
        </h2>
        <p className="text-gray-600">
          Set up required storage buckets for photos and audio files
        </p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border-2 ${
            allBucketsExist 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {allBucketsExist ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-semibold">
                {allBucketsExist ? 'Storage Ready' : 'Storage Setup Required'}
              </span>
            </div>
            <p className="text-sm">
              {allBucketsExist 
                ? 'All required storage buckets are configured and ready for use.'
                : 'Some storage buckets are missing. Photo uploads will fail until these are created.'
              }
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={checkBuckets}
              disabled={checking}
              loading={checking}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button
              variant="ghost"
              size="md"
              onClick={copyInstructions}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Instructions
            </Button>

            <Button
              variant="ghost"
              size="md"
              onClick={() => window.open('https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/storage/buckets', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Supabase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bucket Status */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Required Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requiredBuckets.map((requiredBucket) => {
              const bucketStatus = buckets.find(b => b.name === requiredBucket.name);
              const exists = bucketStatus?.exists || false;
              const isPublic = bucketStatus?.isPublic || false;
              const error = bucketStatus?.error;

              return (
                <motion.div
                  key={requiredBucket.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-lg p-4 ${
                    exists 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {requiredBucket.icon}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {requiredBucket.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {requiredBucket.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {exists ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            exists ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {exists ? 'Exists' : 'Missing'}
                          </span>
                        </div>
                        {exists && (
                          <p className="text-xs text-gray-600">
                            {isPublic ? 'Public' : 'Private'}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      {!exists && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => createBucket(requiredBucket.name)}
                          disabled={loading}
                          loading={loading}
                        >
                          Create
                        </Button>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                      Error: {error}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Manual Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle level={3} className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Manual Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Quick Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>
                  <a 
                    href="https://supabase.com/dashboard/project/zvxnsjsltabvsfwatqox/storage/buckets" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Open your Supabase Storage Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Click the "Create a new bucket" button</li>
                <li>Create a bucket named <code className="bg-blue-100 px-1 rounded">photos</code> and set it to <strong>Public</strong></li>
                <li>Create a bucket named <code className="bg-blue-100 px-1 rounded">audio</code> and set it to <strong>Public</strong></li>
                <li>Come back here and click "Refresh Status" to verify</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">⚠️ Important Notes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                <li>Both buckets must be set to <strong>Public</strong> for the app to work</li>
                <li>The "photos" bucket stores user uploaded images</li>
                <li>The "audio" bucket stores voice recordings and annotations</li>
                <li>File size limits: 10MB for photos, 5MB for audio</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Troubleshooting:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>If bucket creation fails, check your Supabase project permissions</li>
                <li>Make sure you're signed in to the correct Supabase project</li>
                <li>Verify your project isn't paused or has exceeded quotas</li>
                <li>Try refreshing the Supabase dashboard and creating buckets manually</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}