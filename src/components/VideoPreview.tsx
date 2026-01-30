// src/components/VideoPreview.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
  videoBlob: Blob | null;
  onDurationLoad?: (duration: number) => void;
}

export default function VideoPreview({ videoBlob, onDurationLoad }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [durationLoaded, setDurationLoaded] = useState(false);

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      const url = URL.createObjectURL(videoBlob);
      videoRef.current.src = url;

      // Force load metadata
      videoRef.current.load();

      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && onDurationLoad) {
      const duration = videoRef.current.duration;
      console.log('Video metadata loaded, duration:', duration);
      onDurationLoad(duration);
      setDurationLoaded(true);
    }
  };

  // Try to get duration after a delay if metadata doesn't load
  useEffect(() => {
    if (videoBlob && !durationLoaded) {
      const timer = setTimeout(() => {
        if (videoRef.current && videoRef.current.duration) {
          handleLoadedMetadata();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [videoBlob, durationLoaded]);

  if (!videoBlob) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Video Preview</h3>
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg"
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
        onCanPlay={() => {
          // Another chance to get duration
          if (videoRef.current && !durationLoaded) {
            handleLoadedMetadata();
          }
        }}
      />
    </div>
  );
}