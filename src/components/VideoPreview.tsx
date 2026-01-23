// src/components/VideoPreview.tsx
'use client';

import { useEffect, useRef } from 'react';

interface VideoPreviewProps {
  videoBlob: Blob | null;
  onDurationLoad?: (duration: number) => void;
}

export default function VideoPreview({ videoBlob, onDurationLoad }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      const url = URL.createObjectURL(videoBlob);
      videoRef.current.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [videoBlob]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && onDurationLoad) {
      onDurationLoad(videoRef.current.duration);
    }
  };

  if (!videoBlob) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Video Preview</h3>
      <video
        ref={videoRef}
        controls
        className="w-full rounded-lg"
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
}