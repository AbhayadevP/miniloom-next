// src/app/page.tsx - FIXED VERSION
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
  const [recordingDuration, setRecordingDuration] = useState(0); // Store duration from recorder

  const trimmedVideoRef = useRef<HTMLVideoElement>(null);
  const durationCheckAttempts = useRef(0);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    console.log('🎬 ===== RECORDING COMPLETE =====');
    console.log('Blob size:', blob.size);
    console.log('Blob type:', blob.type);
    console.log('Duration from recorder:', duration);
    
    setRecordedBlob(blob);
    setTrimmedBlob(null);
    setTrimmedDuration(0);
    setVideoDuration(0);
    setRecordingDuration(duration); // Store the duration from recorder
    durationCheckAttempts.current = 0;
    
    console.log('State updated. recordedBlob is now set.');
  };

  const handleTrimComplete = (blob: Blob) => {
    console.log('✂️ ===== TRIM COMPLETE =====');
    console.log('Trimmed blob size:', blob.size);
    console.log('Trimmed blob type:', blob.type);
    
    setTrimmedBlob(blob);
    setTrimmedDuration(0);
    setLoadingDuration(true);
    durationCheckAttempts.current = 0;
    
    console.log('State updated. trimmedBlob is now set. Loading duration...');
  };

  const handleDurationLoad = (duration: number) => {
    console.log('📹 ===== DURATION LOADED FROM PREVIEW =====');
    console.log('Duration received:', duration);
    console.log('Is Infinity:', duration === Infinity);
    console.log('Is valid:', duration && duration !== Infinity && duration > 0);
    
    if (duration && duration !== Infinity && duration > 0) {
      setVideoDuration(duration);
      console.log('✅ videoDuration state updated to:', duration);
    } else {
      console.warn('⚠️ Duration not valid from metadata, using recording duration as fallback');
      // Use recording duration as fallback
      if (recordingDuration > 0) {
        console.log('Using recording duration as fallback:', recordingDuration);
        setVideoDuration(recordingDuration);
      }
    }
  };

  // Fallback: If duration hasn't loaded after 3 seconds, use recording duration
  useEffect(() => {
    if (recordedBlob && videoDuration === 0 && recordingDuration > 0) {
      console.log('⏰ Setting up fallback timer for duration...');
      const fallbackTimer = setTimeout(() => {
        if (videoDuration === 0) {
          console.log('⚠️ Metadata duration not loaded, using recording duration:', recordingDuration);
          setVideoDuration(recordingDuration);
        }
      }, 3000);

      return () => clearTimeout(fallbackTimer);
    }
  }, [recordedBlob, videoDuration, recordingDuration]);

  const tryLoadDuration = () => {
    console.log('🔍 ===== TRY LOAD DURATION =====');
    
    if (!trimmedVideoRef.current) {
      console.warn('⚠️ Video ref not available');
      return false;
    }

    const video = trimmedVideoRef.current;
    const duration = video.duration;
    
    console.log(`Attempt #${durationCheckAttempts.current + 1}:`, {
      duration,
      readyState: video.readyState,
      networkState: video.networkState,
      currentTime: video.currentTime,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    });

    if (duration && duration !== Infinity && duration > 0 && !isNaN(duration)) {
      console.log('✅ VALID DURATION FOUND:', duration);
      setTrimmedDuration(duration);
      setLoadingDuration(false);
      return true;
    }

    durationCheckAttempts.current++;
    
    if (durationCheckAttempts.current < 15) { // Increased attempts
      console.log('⏳ Forcing video load...');
      video.load();
      
      if (video.readyState < 1) {
        console.log('⏳ Trying play/pause...');
        video.play().then(() => {
          video.pause();
          video.currentTime = 0;
          console.log('✅ Play/pause completed');
        }).catch(err => {
          console.warn('⚠️ Play failed:', err);
        });
      }
      
      return false;
    } else {
      console.error('❌ FAILED to load duration after 15 attempts');
      setLoadingDuration(false);
      return false;
    }
  };

  useEffect(() => {
    console.log('🔄 ===== TRIM DURATION LOADER EFFECT =====');
    console.log('trimmedBlob exists:', !!trimmedBlob);
    console.log('loadingDuration:', loadingDuration);
    
    if (!trimmedBlob || !loadingDuration) {
      console.log('⏹️ Effect stopped - conditions not met');
      return;
    }

    console.log('▶️ Starting duration check interval...');
    
    const checkInterval = setInterval(() => {
      const success = tryLoadDuration();
      if (success || durationCheckAttempts.current >= 15) {
        console.log('🛑 Stopping interval. Success:', success);
        clearInterval(checkInterval);
      }
    }, 200); // Check more frequently

    return () => {
      console.log('🧹 Cleaning up interval');
      clearInterval(checkInterval);
    };
  }, [trimmedBlob, loadingDuration]);

  const handleTrimmedMetadataLoad = () => {
    console.log('📺 ===== TRIMMED VIDEO METADATA EVENT =====');
    tryLoadDuration();
  };

  // Debug render
  console.log('🖼️ ===== RENDER =====');
  console.log('recordedBlob:', !!recordedBlob, recordedBlob?.size);
  console.log('recordingDuration:', recordingDuration);
  console.log('videoDuration:', videoDuration);
  console.log('trimmedBlob:', !!trimmedBlob, trimmedBlob?.size);
  console.log('trimmedDuration:', trimmedDuration);
  console.log('loadingDuration:', loadingDuration);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Mini Loom - Screen Recorder
        </h1>

        {/* Debug Panel */}
        <div className="max-w-2xl mx-auto mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">🐛 DEBUG PANEL</h3>
          <div className="text-xs space-y-1">
            <p>recordedBlob: {recordedBlob ? '✅ EXISTS' : '❌ NULL'} ({recordedBlob?.size || 0} bytes)</p>
            <p>recordingDuration: {recordingDuration}s {recordingDuration > 0 ? '✅' : '❌'}</p>
            <p>videoDuration: {videoDuration}s {videoDuration > 0 ? '✅' : '❌'}</p>
            <p>trimmedBlob: {trimmedBlob ? '✅ EXISTS' : '❌ NULL'} ({trimmedBlob?.size || 0} bytes)</p>
            <p>trimmedDuration: {trimmedDuration}s {trimmedDuration > 0 ? '✅' : '❌'}</p>
            <p>loadingDuration: {loadingDuration ? '⏳ YES' : '❌ NO'}</p>
            <p>Attempts: {durationCheckAttempts.current}/15</p>
          </div>
        </div>

        <Recorder onRecordingComplete={handleRecordingComplete} />

        {recordedBlob && (
          <>
            <div className="max-w-2xl mx-auto mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm">✅ Recorded blob exists - showing VideoPreview</p>
            </div>
            
            <VideoPreview 
              videoBlob={recordedBlob} 
              onDurationLoad={handleDurationLoad}
            />

            {videoDuration > 0 && videoDuration !== Infinity ? (
              <>
                <div className="max-w-2xl mx-auto mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm">✅ Duration loaded ({videoDuration}s) - showing Trimmer</p>
                </div>
                <Trimmer
                  videoBlob={recordedBlob}
                  videoDuration={videoDuration}
                  onTrimComplete={handleTrimComplete}
                />
              </>
            ) : (
              <div className="max-w-2xl mx-auto mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  ⏳ Waiting for duration... 
                  (Metadata: {videoDuration}s, Recording: {recordingDuration}s)
                </p>
                {recordingDuration > 0 && videoDuration === 0 && (
                  <button
                    onClick={() => {
                      console.log('Manual override: using recording duration');
                      setVideoDuration(recordingDuration);
                    }}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Use Recording Duration ({recordingDuration}s) →
                  </button>
                )}
              </div>
            )}

            {trimmedBlob && (
              <>
                <div className="max-w-2xl mx-auto mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm">✅ Trimmed blob exists - showing preview</p>
                </div>
                
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
                    onDurationChange={handleTrimmedMetadataLoad}
                    preload="metadata"
                    muted
                  />
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Duration:</span>{' '}
                      {trimmedDuration > 0 && trimmedDuration !== Infinity 
                        ? `${trimmedDuration.toFixed(2)} seconds ✅` 
                        : loadingDuration 
                          ? `Loading... (Attempt ${durationCheckAttempts.current}/15)` 
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

                {trimmedDuration > 0 && trimmedDuration !== Infinity ? (
                  <>
                    <div className="max-w-2xl mx-auto mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 text-sm">✅ Trimmed duration loaded ({trimmedDuration}s) - showing UploadPanel</p>
                    </div>
                    <UploadPanel 
                      videoBlob={trimmedBlob} 
                      videoDuration={trimmedDuration}
                    />
                  </>
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
                            ? `Attempt ${durationCheckAttempts.current}/15. Please wait or try playing the video above.`
                            : 'Try playing the video above, or re-export the trimmed video.'}
                        </p>
                        {!loadingDuration && durationCheckAttempts.current >= 15 && (
                          <button
                            onClick={() => {
                              console.log('🔄 RETRY button clicked');
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