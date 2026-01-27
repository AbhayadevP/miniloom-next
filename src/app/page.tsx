'use client';

import { useState, useRef, useEffect } from 'react';
import Recorder from '@/components/Recorder';
import VideoPreview from '@/components/VideoPreview';
import Trimmer from '@/components/Trimmer';
import UploadPanel from '@/components/UploadPanel';

export default function HomePage() {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [trimmedDuration, setTrimmedDuration] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const trimmedVideoRef = useRef<HTMLVideoElement>(null);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    console.log('Recording complete. Duration:', duration);
    setRecordedBlob(blob);
    setRecordedDuration(duration);
    setTrimmedBlob(null);
    setTrimmedDuration(0);
    setVideoDuration(0);
  };

  const handleTrimComplete = (blob: Blob) => {
    console.log('Trim complete. Blob size:', blob.size);
    setTrimmedBlob(blob);
    setTrimmedDuration(0);
  };

  const handleDurationLoad = (duration: number) => {
    console.log('Original video duration loaded:', duration);
    if (duration && duration !== Infinity && duration > 0) {
      setVideoDuration(duration);
    }
  };

  const handleTrimmedDurationLoad = () => {
    if (trimmedVideoRef.current) {
      const duration = trimmedVideoRef.current.duration;
      console.log('Trimmed video duration loaded:', duration);
      
      if (duration && duration !== Infinity && duration > 0) {
        setTrimmedDuration(duration);
      } else {
        console.warn('Trimmed video duration is invalid:', duration);
        // Try to get duration again after a delay
        setTimeout(() => {
          if (trimmedVideoRef.current) {
            const newDuration = trimmedVideoRef.current.duration;
            console.log('Retrying duration load:', newDuration);
            if (newDuration && newDuration !== Infinity && newDuration > 0) {
              setTrimmedDuration(newDuration);
            }
          }
        }, 500);
      }
    }
  };

  // Force video to load metadata when trimmedBlob changes
  useEffect(() => {
    if (trimmedBlob && trimmedVideoRef.current) {
      const video = trimmedVideoRef.current;
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded via event listener');
        handleTrimmedDurationLoad();
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Force load
      video.load();
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [trimmedBlob]);

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
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Trimmed Video Preview</h3>
                  <video
                    ref={trimmedVideoRef}
                    src={URL.createObjectURL(trimmedBlob)}
                    controls
                    className="w-full rounded-lg"
                    onLoadedMetadata={handleTrimmedDurationLoad}
                    preload="metadata"
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      Duration: {trimmedDuration > 0 && trimmedDuration !== Infinity 
                        ? `${trimmedDuration.toFixed(2)} seconds` 
                        : 'Loading duration...'}
                    </p>
                    {trimmedDuration === Infinity && (
                      <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        ⚠️ Duration not loaded yet. Please play the video or wait...
                      </p>
                    )}
                  </div>
                </div>

                {trimmedDuration > 0 && trimmedDuration !== Infinity ? (
                  <UploadPanel 
                    videoBlob={trimmedBlob} 
                    videoDuration={trimmedDuration}
                  />
                ) : (
                  <div className="w-full max-w-2xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                      <div>
                        <p className="text-yellow-800 font-medium">
                          ⏳ Waiting for video metadata to load...
                        </p>
                        <p className="text-yellow-700 text-sm mt-1">
                          Please play the trimmed video or wait a moment. The duration needs to load before uploading.
                        </p>
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