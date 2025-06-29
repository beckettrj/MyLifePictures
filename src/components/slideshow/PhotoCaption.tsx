/**
 * Photo caption display component
 * Shows photo information with accessibility support
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Folder, Heart } from 'lucide-react';
import { format } from 'date-fns';
import type { Photo } from '../../types';

interface PhotoCaptionProps {
  photo: Photo;
  currentIndex: number;
  totalPhotos: number;
  className?: string;
}

export function PhotoCaption({ 
  photo, 
  currentIndex, 
  totalPhotos, 
  className = '' 
}: PhotoCaptionProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MMMM do, yyyy');
    } catch {
      return null;
    }
  };

  const uploadDate = formatDate(photo.created_at);

  return (
    <motion.div
      className={`
        absolute bottom-0 left-0 right-0 
        bg-gradient-to-t from-black/80 via-black/40 to-transparent
        text-white p-6 pb-20
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Photo Title */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-3 leading-tight">
          {photo.display_name || 'Untitled Photo'}
        </h2>

        {/* Photo Details */}
        <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-200 mb-3">
          {/* Photo Index */}
          <span className="bg-black/40 px-3 py-1 rounded-full">
            {currentIndex} of {totalPhotos}
          </span>

          {/* Date Taken */}
          {uploadDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{uploadDate}</span>
            </div>
          )}

          {/* Favorite Indicator */}
          {photo.is_favorite && (
            <div className="flex items-center gap-1 text-red-400">
              <Heart className="w-4 h-4 fill-current" />
              <span>Favorite</span>
            </div>
          )}

          {/* Folder Name */}
          {photo.folder_id && (
            <div className="flex items-center gap-1">
              <Folder className="w-4 h-4" />
              <span>Family Album</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photo.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-600/40 text-blue-100 px-2 py-1 rounded-full text-xs md:text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Upload Date (fallback) */}
        {uploadDate && (
          <p className="text-xs text-gray-400 mt-2">
            Added {uploadDate}
          </p>
        )}
      </div>
    </motion.div>
  );
}