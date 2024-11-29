// src/components/Feed/ImageGallery.tsx
'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  onClose?: () => void;
}

export default function ImageGallery({ images, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(current => (current === 0 ? images.length - 1 : current - 1));
    } else {
      setCurrentIndex(current => (current === images.length - 1 ? 0 : current + 1));
    }
  };

  // Ensure we have placeholder images if none are provided
  const displayImages = images.length > 0 ? images : [
    '/api/placeholder/800/600?text=Gallery+Image+1',
    '/api/placeholder/800/600?text=Gallery+Image+2',
    '/api/placeholder/800/600?text=Gallery+Image+3'
  ];

  return (
    <div className="relative bg-black">
      {/* Main Image */}
      <div className="relative aspect-video">
        <img
          src={displayImages[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Navigation Buttons */}
        <button
          onClick={() => navigate('prev')}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => navigate('next')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
          {currentIndex + 1} / {displayImages.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="bg-black/90 p-4">
        <div className="flex gap-2 overflow-x-auto">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                currentIndex === index ? 'ring-2 ring-yellow-400' : 'opacity-60'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}