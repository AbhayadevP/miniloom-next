// src/app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Recorder from '@/components/Recorder';
import VideoPreview from '@/components/VideoPreview';
import Trimmer from '@/components/Trimmer';
import UploadPanel from '@/components/UploadPanel';

export default function HomePage() {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [trimmedDuration, setTrimmedDuration] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [loadingDuration, setLoadingDuration] = useState(false);

  const trimmedVideoRef = useRef<HTMLVideoElement>(null);
  const durationCheckAttempts = useRef(0);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    console.log('✅ Recording complete. Duration:', duration);
    setRecordedBlob(blob);
    setTrimmedBlob(null);
    setTrimmedDuration(0);
    setVideoDuration(0);
    durationCheckAttempts.current = 0;
  };

  const handleTrimComplete = (blob: Blob) => {
    console.log('✅ Trim complete. Blob size:', blob.size);
    setTrimmedBlob(blob);
    setTrimmedDuration(0);
    setLoadingDuration(true);
    durationCheckAttempts.current = 0;
  };

  const handleDurationLoad = (duration: number) => {
    console.log('📹 Original video duration loaded:', duration);
    if (duration && duration !== Infinity && duration > 0) {
      setVideoDuration(duration);
    }
  };

  // Aggressively try to get duration
  const tryLoadDuration = () => {
    if (!trimmedVideoRef.current) {
      console.warn('⚠️ Video ref not available');
      return;
    }

    const video = trimmedVideoRef.current;
    const duration = video.duration;
    
    console.log(`🔄 Duration check attempt #${durationCheckAttempts.current + 1}:`, {
      duration,
      readyState: video.readyState,
      networkState: video.networkState,
      currentTime: video.currentTime
    });

    if (duration && duration !== Infinity && duration > 0 && !isNaN(duration)) {
      console.log('✅ Valid duration found:', duration);
      setTrimmedDuration(duration);
      setLoadingDuration(false);
      return true;
    }

    durationCheckAttempts.current++;
    
    // Try different methods to force metadata load
    if (durationCheckAttempts.current < 10) {
      // Force load
      video.load();
      
      // Try playing and pausing to trigger metadata
      if (video.readyState < 1) {
        video.play().then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(err => {
          console.warn('Could not play video:', err);
        });
      }
      
      return false;
    } else {
      console.error('❌ Failed to load duration after 10 attempts');
      setLoadingDuration(false);
      return false;
    }
  };

  // Check duration repeatedly until we get a valid value
  useEffect(() => {
    if (!trimmedBlob || !loadingDuration) return;

    const checkInterval = setInterval(() => {
      const success = tryLoadDuration();
      if (success || durationCheckAttempts.current >= 10) {
        clearInterval(checkInterval);
      }
    }, 300); // Check every 300ms

    return () => clearInterval(checkInterval);
  }, [trimmedBlob, loadingDuration]);

  // Initial metadata load
  const handleTrimmedMetadataLoad = () => {
    console.log('📹 Trimmed video metadata event fired');
    tryLoadDuration();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Mini Loom - Screen Recorder
        </h1>

        <Recorder onRecordingComplete={handleRecordingComplete} />

        {recordedBlob && (
          <>
            <VideoPreview 
              videoBlob={recordedBlob} 
              onDurationLoad={handleDurationLoad}
            />

            {videoDuration > 0 && videoDuration !== Infinity && (
              <Trimmer
                videoBlob={recordedBlob}
                videoDuration={videoDuration}
                onTrimComplete={handleTrimComplete}
              />
            )}

            {trimmedBlob && (
              <>
                <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Trimmed Video Preview
                  </h3>
                  <video
                    ref={trimmedVideoRef}
                    src={URL.createObjectURL(trimmedBlob)}
                    controls
                    className="w-full rounded-lg"
                    onLoadedMetadata={handleTrimmedMetadataLoad}
                    onCanPlay={handleTrimmedMetadataLoad}
                    onLoadedData={handleTrimmedMetadataLoad}
                    preload="metadata"
                    muted
                  />
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duration:</span>{' '}
                      {trimmedDuration > 0 && trimmedDuration !== Infinity 
                        ? `${trimmedDuration.toFixed(2)} seconds ✅` 
                        : loadingDuration 
                          ? `Loading... (Attempt ${durationCheckAttempts.current}/10)` 
                          : 'Unable to detect duration'}
                    </p>
                    {loadingDuration && (
                      <div className="mt-2 flex items-center space-x-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Detecting video duration...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SHOW UPLOAD PANEL - Always show if we have trimmedBlob */}
                {trimmedDuration > 0 && trimmedDuration !== Infinity ? (
                  <UploadPanel 
                    videoBlob={trimmedBlob} 
                    videoDuration={trimmedDuration}
                  />
                ) : (
                  <div className="w-full max-w-2xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                      <div className="flex-1">
                        <p className="text-yellow-800 font-medium">
                          {loadingDuration 
                            ? '⏳ Detecting video duration...' 
                            : '⚠️ Unable to detect video duration'}
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                          {loadingDuration 
                            ? `Attempt ${durationCheckAttempts.current}/10. Please wait or try playing the video above.`
                            : 'Try playing the video above, or re-export the trimmed video.'}
                        </p>
                        {!loadingDuration && durationCheckAttempts.current >= 10 && (
                          <button
                            onClick={() => {
                              durationCheckAttempts.current = 0;
                              setLoadingDuration(true);
                            }}
                            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                          >
                            🔄 Retry Detection
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}