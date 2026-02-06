// Image upload component for blog posts
// Bild-Upload-Komponente für Blog

'use client';

import React, { useState, useRef } from 'react';
import { FaImage, FaTimes, FaUpload, FaSpinner } from 'react-icons/fa';
import { createClient } from '@/lib/supabase';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export default function ImageUpload({ onImageUploaded, currentImageUrl, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte wählen Sie eine gültige Bilddatei aus.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Die Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Upload actual file to Supabase Storage
      const fileName = `blog-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        // Fallback: create a blob URL for immediate preview
        const blobUrl = URL.createObjectURL(file);
        setPreview(blobUrl);
        onImageUploaded(blobUrl);
        alert('Bild wird als temporäre Datei verwendet (Upload-Service nicht verfügbar)');
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      const publicUrl = publicData.publicUrl;
      onImageUploaded(publicUrl);
      setPreview(publicUrl);
      alert('Bild erfolgreich hochgeladen!');

    } catch (error) {
      console.error('Upload error:', error);
      alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Remove image
  const removeImage = () => {
    setPreview(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-white/80 mb-2">
        Bild hochladen
      </label>
      
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
          dragOver
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-white/30 hover:border-white/50'
        } ${preview ? 'aspect-video' : 'aspect-[2/1]'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          // Image preview
          <div className="relative w-full h-full group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-4 rounded-lg">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors duration-200"
                title="Bild ändern"
                disabled={uploading}
              >
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
              </button>
              
              <button
                type="button"
                onClick={removeImage}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-300 transition-colors duration-200"
                title="Bild entfernen"
                disabled={uploading}
              >
                <FaTimes />
              </button>
            </div>
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                  <p>Bild wird hochgeladen...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload prompt
          <div
            className="flex flex-col items-center justify-center h-full p-8 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FaImage className="text-4xl text-white/40 mb-4" />
            <div className="text-center">
              <p className="text-white/80 font-medium mb-2">
                Bild hochladen (Schnell)
              </p>
              <p className="text-white/60 text-sm mb-2">
                Klicken Sie hier oder ziehen Sie ein Bild hierher
              </p>
              <p className="text-white/40 text-xs mb-3">
                Unterstützte Formate: JPG, PNG, GIF (max. 5MB)
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const demoUrl = `https://picsum.photos/800/400?random=${Date.now()}`;
                    setPreview(demoUrl);
                    onImageUploaded(demoUrl);
                  }}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded transition-colors"
                >
                  Demo Bild
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const natureUrl = `https://picsum.photos/800/400?nature&random=${Date.now()}`;
                    setPreview(natureUrl);
                    onImageUploaded(natureUrl);
                  }}
                  className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs rounded transition-colors"
                >
                  Natur
                </button>
              </div>
            </div>
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
                  <p>Wird verarbeitet...</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Manual URL input */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-white/60 mb-2">
          Oder Bild-URL eingeben:
        </label>
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onBlur={(e) => {
            if (e.target.value.trim()) {
              setPreview(e.target.value.trim());
              onImageUploaded(e.target.value.trim());
            }
          }}
        />
      </div>
    </div>
  );
}
function setUploading(arg0: boolean) {
  throw new Error('Function not implemented.');
}

