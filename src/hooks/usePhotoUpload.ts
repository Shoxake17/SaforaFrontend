// src/hooks/usePhotoUpload.ts

import { useState, useRef, useEffect } from 'react';

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UsePhotoUploadReturn {
  photoFiles: File[];
  photoInputRef: React.RefObject<HTMLInputElement>;
  photoZoneRef: React.RefObject<HTMLDivElement>;
  handlePhotos: (files: FileList | null) => void;
  removePhoto: (idx: number) => void;
  clearPhotos: () => void;
}

const usePhotoUpload = (): UsePhotoUploadReturn => {
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoZoneRef = useRef<HTMLDivElement>(null);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;

    setPhotoFiles((prev) => {
      const newFiles = [...prev];
      for (let i = 0; i < files.length && newFiles.length < MAX_FILES; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > MAX_SIZE_BYTES) continue;
        // Duplicate check
        if (newFiles.some((f) => f.name === file.name && f.size === file.size)) continue;
        newFiles.push(file);
      }
      return newFiles;
    });
  };

  const removePhoto = (idx: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearPhotos = () => setPhotoFiles([]);

  // Drag & drop event listeners
  useEffect(() => {
    const zone = photoZoneRef.current;
    if (!zone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    };
    const handleDragLeave = (e: DragEvent) => {
      // Faqat zone tashqarisiga chiqqanda remove qilamiz
      if (!zone.contains(e.relatedTarget as Node)) {
        zone.classList.remove('drag-over');
      }
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handlePhotos(e.dataTransfer?.files ?? null);
    };

    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);

    return () => {
      zone.removeEventListener('dragover', handleDragOver);
      zone.removeEventListener('dragleave', handleDragLeave);
      zone.removeEventListener('drop', handleDrop);
    };
  }, []); // faqat mount da — photoFiles ga bog'liq emas

  return { photoFiles, photoInputRef, photoZoneRef, handlePhotos, removePhoto, clearPhotos };
};

export default usePhotoUpload;