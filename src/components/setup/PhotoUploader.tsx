/**
 * Photo upload component with drag-and-drop support
 * Handles multiple file uploads and folder organization
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Folder, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { photoService, folderService } from '../../services/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  details?: string;
}

export function PhotoUploader() {
  const { user, folders, setPhotos, setFolders, photos } = useAppStore();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (!user) {
      console.error('❌ No user found for upload');
      return;
    }

    console.log('📁 Files dropped:', {
      accepted: acceptedFiles.length,
      rejected: rejectedFiles.length,
      user: user.id
    });

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('⚠️ Some files were rejected:', rejectedFiles);
      rejectedFiles.forEach(rejection => {
        console.warn('Rejected file:', {
          file: rejection.file.name,
          errors: rejection.errors.map((e: any) => e.message)
        });
      });
    }

    if (acceptedFiles.length === 0) {
      console.warn('⚠️ No valid files to upload');
      return;
    }

    setIsUploading(true);
    const progressItems: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    
    setUploadProgress(progressItems);

    console.log('🚀 Starting upload process for', acceptedFiles.length, 'files');

    // Upload files one by one to avoid overwhelming the server
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      console.log(`📤 Uploading file ${i + 1}/${acceptedFiles.length}:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type
      });
      
      try {
        // Update progress to 10% (starting)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 10, details: 'Starting upload...' } : item
        ));

        // Update progress to 30% (uploading to storage)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 30, details: 'Uploading to storage...' } : item
        ));

        // Upload the photo
        const result = await photoService.uploadPhoto(file, user.id, selectedFolder || undefined);
        
        console.log('✅ Upload successful for:', file.name, result);

        // Update progress to 80% (saving metadata)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 80, details: 'Saving metadata...' } : item
        ));

        // Update progress to 100% (complete)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            progress: 100, 
            status: 'success' as const,
            details: 'Upload complete!'
          } : item
        ));

        // Add to photos list if we have metadata
        if (result.metadata) {
          setPhotos([result.metadata, ...photos]);
          console.log('📸 Added photo to collection:', result.metadata.filename);
        }

      } catch (error) {
        console.error('💥 Upload failed for file:', file.name, error);
        
        let errorMessage = 'Upload failed';
        let errorDetails = '';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Provide more specific error details
          if (error.message.includes('not configured')) {
            errorDetails = 'Supabase configuration issue. Please check your environment variables.';
          } else if (error.message.includes('permission')) {
            errorDetails = 'Permission denied. Please check your Supabase storage policies.';
          } else if (error.message.includes('size')) {
            errorDetails = 'File too large. Please use a smaller file (max 10MB).';
          } else if (error.message.includes('type')) {
            errorDetails = 'Unsupported file type. Please use JPEG, PNG, GIF, WebP, or BMP.';
          } else if (error.message.includes('bucket')) {
            errorDetails = 'Storage bucket not found. Please create the "photos" bucket in Supabase.';
          } else {
            errorDetails = 'Please try again or contact support if the problem persists.';
          }
        }
        
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            status: 'error' as const, 
            error: errorMessage,
            details: errorDetails
          } : item
        ));
      }
    }

    setIsUploading(false);
    
    // Keep progress visible longer so users can see results
    setTimeout(() => {
      setUploadProgress([]);
    }, 8000);
  }, [user, selectedFolder, photos, setPhotos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp']
    },
    multiple: true,
    disabled: isUploading,
    maxSize: 10 * 1024 * 1024, // 10MB max file size
  });

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    console.log('📁 Creating new folder:', newFolderName.trim());
    setIsCreatingFolder(true);
    
    try {
      const folder = await folderService.createFolder(newFolderName.trim(), user.id);

      if (folder) {
        setFolders([folder, ...folders]);
        setSelectedFolder(folder.id);
        setNewFolderName('');
        console.log('✅ Folder created successfully:', folder.name);
      }
    } catch (error) {
      console.error('💥 Failed to create folder:', error);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const removeUploadItem = (index: number) => {
    setUploadProgress(prev => prev.filter((_, i) => i !== index));
  };

  const getProgressColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Photos
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Add your favorite family photos to create a personalized slideshow. 
          You can organize them into folders and add descriptions later.
        </p>
      </div>

      {/* Current Status */}
      {photos.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">
              📸 You have <strong>{photos.length}</strong> photos in your collection
            </p>
          </div>
        </div>
      )}

      {/* Folder Selection */}
      <Card>
        <CardHeader>
          <CardTitle level={3}>Choose a Folder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Existing Folders */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Existing Folder (Optional)
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No folder (all photos)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    📁 {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Create New Folder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create New Folder
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Family Vacation, Holidays..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={createFolder}
                  disabled={!newFolderName.trim() || isCreatingFolder}
                  loading={isCreatingFolder}
                >
                  <Folder className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center gap-4">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center
                ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragActive ? 'Drop your photos here!' : 'Upload Your Photos'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isDragActive 
                    ? 'Release to upload these photos'
                    : 'Drag and drop photos here, or click to browse'
                  }
                </p>
                <div className="text-sm text-gray-500">
                  <p>Supports: JPEG, PNG, GIF, WebP, BMP</p>
                  <p>Max size: 10MB per file • Multiple files supported</p>
                </div>
              </div>

              {!isDragActive && (
                <Button variant="primary" size="lg" disabled={isUploading}>
                  <Image className="w-5 h-5 mr-2" />
                  Choose Photos
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle level={3}>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadProgress.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.file.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.status === 'success' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {item.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <button
                            onClick={() => removeUploadItem(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(item.status)}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      
                      {/* Status Messages */}
                      {item.details && (
                        <p className="text-xs text-gray-600 mb-1">{item.details}</p>
                      )}
                      
                      {item.status === 'error' && item.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                          <p className="text-xs text-red-700 font-medium">{item.error}</p>
                          {item.details && (
                            <p className="text-xs text-red-600 mt-1">{item.details}</p>
                          )}
                        </div>
                      )}
                      
                      {item.status === 'success' && (
                        <p className="text-xs text-green-600 font-medium">✅ Upload complete!</p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        Size: {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          📸 Upload Tips
        </h3>
        <div className="space-y-2 text-sm text-amber-800">
          <p>• <strong>High quality:</strong> Upload your best resolution photos for the clearest display</p>
          <p>• <strong>Organization:</strong> Create folders like "Family", "Holidays", or "Grandchildren" to keep things tidy</p>
          <p>• <strong>File size:</strong> Keep files under 10MB for faster uploads and better performance</p>
          <p>• <strong>Privacy:</strong> Your photos are stored securely and only you can access them</p>
          <p>• <strong>Supported formats:</strong> JPEG, PNG, GIF, WebP, and BMP files work best</p>
          <p>• <strong>Multiple uploads:</strong> You can select multiple photos at once to save time</p>
        </div>
      </div>

      {/* Debug Information (only in development) */}
      {import.meta.env.DEV && (
        <Card>
          <CardHeader>
            <CardTitle level={3}>🔧 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs font-mono bg-gray-100 p-3 rounded">
              <p>User ID: {user?.id}</p>
              <p>Selected Folder: {selectedFolder || 'none'}</p>
              <p>Photos Count: {photos.length}</p>
              <p>Folders Count: {folders.length}</p>
              <p>Upload Status: {isUploading ? 'uploading' : 'idle'}</p>
              <p>Progress Items: {uploadProgress.length}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}