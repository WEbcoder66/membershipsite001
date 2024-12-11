// src/components/PhotoGallery.tsx
import React, { useState } from 'react';

interface PhotoGalleryProps {
  images: string[];
  title?: string;
  description?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, title, description }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const selectImage = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-md overflow-hidden">
      {title && (
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}

      <div className="relative bg-black">
        <img
          src={currentImage}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-auto max-h-[500px] object-contain bg-black"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-2 shadow focus:outline-none"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-2 shadow focus:outline-none"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {/* Image Count */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white text-sm py-1 px-2 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto border-b">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => selectImage(idx)}
              className={`border-2 rounded overflow-hidden w-16 h-16 flex-shrink-0 ${
                idx === currentIndex ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="p-4">
          <p className="text-gray-700">{description}</p>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
