/**
 * Photo upload component - Simplified to work without database connections
 * Handles multiple file uploads with sample photos
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Folder, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
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
  const { photos, setPhotos, setCurrentView } = useAppStore();
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('📁 Files dropped:', {
      accepted: acceptedFiles.length,
      rejected: rejectedFiles.length
    });

    // Handle rejected files with detailed feedback
    if (rejectedFiles.length > 0) {
      console.warn('⚠️ Some files were rejected:', rejectedFiles);
      const rejectionReasons = rejectedFiles.map(rejection => {
        const errors = rejection.errors.map((e: any) => e.message).join(', ');
        return `${rejection.file.name}: ${errors}`;
      }).join('\n');
      
      alert(`Some files were rejected:\n${rejectionReasons}`);
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

    // Process files one by one
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      console.log(`📤 Processing file ${i + 1}/${acceptedFiles.length}:`, {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type
      });
      
      try {
        // Update progress to 10% (starting)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 10, details: 'Validating file...' } : item
        ));

        // Validate file
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('File too large. Please use a file smaller than 10MB.');
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or GIF.`);
        }

        // Update progress to 30% (processing)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 30, details: 'Processing image...' } : item
        ));

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update progress to 60% (creating preview)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 60, details: 'Creating preview...' } : item
        ));

        // Create a URL for the file
        const fileUrl = URL.createObjectURL(file);

        // Update progress to 90% (finalizing)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { ...item, progress: 90, details: 'Finalizing...' } : item
        ));

        // Create a new photo object
        const newPhoto = {
          id: Date.now() + i, // Generate a unique ID
          created_at: new Date().toISOString(),
          folder_id: selectedFolder ? parseInt(selectedFolder) : 1,
          display_name: file.name,
          file_path: fileUrl,
          is_hidden: false,
          is_favorite: false,
          tags: []
        };

        // Update progress to 100% (complete)
        setUploadProgress(prev => prev.map((item, index) => 
          index === i ? { 
            ...item, 
            progress: 100, 
            status: 'success' as const,
            details: 'Upload complete!'
          } : item
        ));

        // Add to photos list
        setPhotos([newPhoto, ...photos]);
        console.log('📸 Added photo to collection:', file.name);

      } catch (error) {
        console.error('💥 Upload failed for file:', file.name, error);
        
        let errorMessage = 'Upload failed';
        let errorDetails = '';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Provide more specific error details
          if (error.message.includes('size')) {
            errorDetails = 'File too large. Please use a smaller file (max 10MB).';
          } else if (error.message.includes('type')) {
            errorDetails = 'Unsupported file type. Please use JPEG, PNG, or GIF.';
          } else {
            errorDetails = 'Please try again or check your file.';
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
    }, 5000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true,
    disabled: isUploading,
    maxSize: 10 * 1024 * 1024, // 10MB max file size
  });

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    console.log('📁 Creating new folder:', newFolderName.trim());
    setIsCreatingFolder(true);
    
    try {
      // Simulate folder creation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new folder object
      const newFolder = {
        id: Date.now(),
        user_id: 1,
        name: newFolderName.trim(),
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to folders list
      const { setFolders, folders } = useAppStore.getState();
      setFolders([newFolder, ...folders]);
      
      // Select the new folder
      setSelectedFolder(newFolder.id.toString());
      setNewFolderName('');
      
      console.log('✅ Folder created successfully:', newFolder.name);
    } catch (error) {
      console.error('💥 Failed to create folder:', error);
      alert(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const startSlideshow = () => {
    setCurrentView('slideshow');
  };

  // Ensure photos is always an array
  const photosArray = Array.isArray(photos) ? photos : [];

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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">
              📸 You have <strong>{photosArray.length}</strong> photos in your collection
            </p>
          </div>
          
          {photosArray.length > 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={startSlideshow}
            >
              <Image className="w-4 h-4 mr-2" />
              Start Slideshow
            </Button>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      {photosArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle level={3}>Your Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photosArray.map(photo => (
                <div key={photo.id} className="relative group">
                  <img 
                    src={photo.file_path} 
                    alt={photo.display_name || 'Photo'} 
                    className="w-full h-40 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      // Handle image load error
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          // View photo in slideshow
                          const { setCurrentPhoto, setCurrentView } = useAppStore.getState();
                          setCurrentPhoto(photo);
                          setCurrentView('slideshow');
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">{photo.display_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <p>Supports: JPEG, PNG, GIF</p>
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
                            <AlertTriangle className="w-4 h-4 text-red-500" />
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
                        Size: {(item.file.size / 1024 / 1024).toFixed(2)} MB • Type: {item.file.type}
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
          <p>• <strong>Supported formats:</strong> JPEG, PNG, and GIF files work best</p>
          <p>• <strong>Multiple uploads:</strong> You can select multiple photos at once to save time</p>
        </div>
      </div>
    </div>
  );
}