// src/components/ImageUpload.tsx
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // For demo purposes, we'll simulate an upload and return a placeholder URL
    setTimeout(() => {
      setIsUploading(false);
      onUploadComplete(`/api/placeholder/400/400?text=${encodeURIComponent(file.name)}`);
    }, 1500);
  };

  return (
    <div className="mt-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {isUploading && (
        <div className="mt-2 text-sm text-gray-600">
          Processing upload...
        </div>
      )}
    </div>
  );
};

export default ImageUpload;