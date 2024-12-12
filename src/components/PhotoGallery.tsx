import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, Lock } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  title?: string;
  locked?: boolean;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images, title, locked = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const selectImage = (index: number) => {
    setCurrentIndex(index);
  };

  const openFullscreen = () => {
    if (!locked) setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-md overflow-hidden relative">
      {title && (
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}

      <div className={`relative bg-black ${locked ? 'filter blur-sm' : ''}`} style={{ minHeight: 300 }}>
        <div
          className="w-full h-[300px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative cursor-pointer flex items-center justify-center"
          onClick={openFullscreen}
        >
          <Image
            src={currentImage}
            alt={`Image ${currentIndex + 1}`}
            fill
            style={{ objectFit: 'contain', backgroundColor: 'black' }}
            priority
          />
          {locked && (
            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
              <div className="text-white flex flex-col items-center">
                <Lock className="w-12 h-12 mb-2" />
                <p className="font-bold">Content Locked</p>
              </div>
            </div>
          )}
        </div>

        {images.length > 1 && !locked && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-2 shadow focus:outline-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white rounded-full p-2 shadow focus:outline-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {images.length > 1 && !locked && (
          <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white text-sm py-1 px-2 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && !locked && (
        <div className="flex gap-2 p-4 overflow-x-auto border-b">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => selectImage(idx)}
              className={`border-2 rounded overflow-hidden w-16 h-16 flex-shrink-0 ${
                idx === currentIndex ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {isFullscreen && !locked && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 cursor-pointer"
          onClick={closeFullscreen}
        >
          <div
            className="relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            <button
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10"
              onClick={closeFullscreen}
            >
              <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <Image
              src={currentImage}
              alt={`Enlarged Image ${currentIndex + 1}`}
              width={1200}
              height={800}
              style={{
                objectFit: 'contain',
                maxWidth: '90vw',
                maxHeight: '90vh'
              }}
            />

            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 text-white text-sm bg-black bg-opacity-50 py-1 px-2 rounded z-10">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
