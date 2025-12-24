import { useEffect } from 'react';

const SUPABASE_STORAGE_URL = 'https://bmsmmlymsjpydpealmcw.supabase.co/storage/v1/object/public/questions-images';

export function useImagePreloader(imageUrls: (string | undefined | null)[]) {
  useEffect(() => {
    const validUrls = imageUrls.filter((url): url is string => !!url);
    
    validUrls.forEach((url) => {
      const fullUrl = url.startsWith('http') ? url : `${SUPABASE_STORAGE_URL}/${url}`;
      const img = new Image();
      img.src = fullUrl;
    });
  }, [imageUrls]);
}
