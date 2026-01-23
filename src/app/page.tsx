// src/app/page.tsx
'use client';

import { useState } from 'react';
import Recorder from '@/components/Recorder';
import VideoPreview from '@/components/VideoPreview';
import Trimmer from '@/components/Trimmer';
import UploadPanel from '@/components/UploadPanel';

export default function HomePage() {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setRecordedBlob(blob);
    setRecordedDuration(duration);
    setTrimmedBlob(null); // Reset trimmed blob when new recording is made
  };

  const handleTrimComplete = (blob: Blob) => {
    setTrimmedBlob(blob);
  };

  const handleDurationLoad = (duration: number) => {
    setVideoDuration(duration);
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

            {videoDuration > 0 && (
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
                    src={URL.createObjectURL(trimmedBlob)}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>

                <UploadPanel 
                  videoBlob={trimmedBlob} 
                  videoDuration={videoDuration}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}