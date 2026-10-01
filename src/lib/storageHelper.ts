import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Compresses an image client-side to keep Firestore/Storage fast and lightweight.
 */
export const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Uploads an image file to Firebase Storage with automatic fallback to compressed Data URL
 * if Storage rules or CORS fail on a new Firebase project.
 */
export const uploadProductImage = async (
  file: File, 
  pathPrefix = 'products',
  onProgress?: (percent: number) => void
): Promise<string> => {
  const compressedDataUrl = await compressImage(file);

  try {
    const filename = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, filename);
    
    // Convert compressed DataURL back to blob for Firebase Storage upload
    const res = await fetch(compressedDataUrl);
    const blob = await res.blob();

    return new Promise((resolve) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/jpeg',
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.warn('Firebase Storage upload failed or not configured, falling back to optimized inline asset:', error.message);
          if (onProgress) onProgress(100);
          resolve(compressedDataUrl);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch {
            resolve(compressedDataUrl);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Storage upload catch fallback:', err);
    if (onProgress) onProgress(100);
    return compressedDataUrl;
  }
};
