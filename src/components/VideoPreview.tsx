// src/components/VideoPreview.tsx - IMPROVED VERSION
'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoPreviewProps {
  videoBlob: Blob | null;
  onDurationLoad?: (duration: number) => void;
}

export default function VideoPreview({ videoBlob, onDurationLoad }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [durationLoaded, setDurationLoaded] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 20;

  useEffect(() => {
    if (videoBlob && videoRef.current) {
      console.log('📹 VideoPreview: Setting up video blob');
      const url = URL.createObjectURL(videoBlob);
      videoRef.current.src = url;

      // Force load metadata
      videoRef.current.load();

      return () => {
        console.log('📹 VideoPreview: Cleaning up blob URL');
        URL.revokeObjectURL(url);
      };
    }
  }, [videoBlob]);

  const tryGetDuration = () => {
    if (!videoRef.current) return false;
    
    const duration = videoRef.current.duration;
    console.log(`📹 VideoPreview: Duration check attempt ${attempts + 1}:`, {
      duration,
      readyState: videoRef.current.readyState,
      isValid: duration && duration !== Infinity && duration > 0
    });

    if (duration && duration !== Infinity && duration > 0 && !isNaN(duration)) {
      console.log('✅ VideoPreview: Valid duration found:', duration);
      if (onDurationLoad) {
        onDurationLoad(duration);
      }
      setDurationLoaded(true);
      return true;
    }

    return false;
  };

  const handleLoadedMetadata = () => {
    console.log('📹 VideoPreview: loadedmetadata event fired');
    tryGetDuration();
  };

  const handleCanPlay = () => {
    console.log('📹 VideoPreview: canplay event fired');
    if (!durationLoaded) {
      tryGetDuration();
    }
  };

  const handleLoadedData = () => {
    console.log('📹 VideoPreview: loadeddata event fired');
    if (!durationLoaded) {
      tryGetDuration();
    }
  };

  const handleDurationChange = () => {
    console.log('📹 VideoPreview: durationchange event fired');
    if (!durationLoaded) {
      tryGetDuration();
    }
  };

  // Aggressive polling to get duration
  useEffect(() => {
    if (!videoBlob || durationLoaded || attempts >= maxAttempts) return;

    const pollInterval = setInterval(() => {
      const success = tryGetDuration();
      if (success) {
        clearInterval(pollInterval);
      } else {
        setAttempts(prev => prev + 1);
        
        // Try to force the video to load
        if (videoRef.current && videoRef.current.readyState < 1) {
          videoRef.current.load();
          
          // Try play/pause trick
          videoRef.current.play().then(() => {
            videoRef.current!.pause();
            videoRef.current!.currentTime = 0;
          }).catch(() => {
            // Silent fail
          });
        }
      }
    }, 300);

    return () => clearInterval(pollInterval);
  }, [videoBlob, durationLoaded, attempts]);

  // Final timeout fallback
  useEffect(() => {
    if (!videoBlob || durationLoaded) return;

    const timeout = setTimeout(() => {
      if (!durationLoaded && videoRef.current) {
        console.warn('⚠️ VideoPreview: Duration not loaded after timeout, trying one last time');
        tryGetDuration();
      }
    }, 5000);

    return () => clearTimeout(timeout);
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
        onCanPlay={handleCanPlay}
        onLoadedData={handleLoadedData}
        onDurationChange={handleDurationChange}
        preload="metadata"
      />
      {!durationLoaded && attempts > 0 && (
        <div className="mt-2 flex items-center space-x-2 text-blue-600 text-sm">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span>Loading video metadata... (Attempt {attempts}/{maxAttempts})</span>
        </div>
      )}
    </div>
  );
}