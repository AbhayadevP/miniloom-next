// src/components/Trimmer.tsx
'use client';

import { useState } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { trimVideo } from '@/lib/ffmpeg';

interface TrimmerProps {
  videoBlob: Blob;
  videoDuration: number;
  onTrimComplete: (trimmedBlob: Blob) => void;
}

export default function Trimmer({ videoBlob, videoDuration, onTrimComplete }: TrimmerProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.floor(videoDuration));
  const [isTrimming, setIsTrimming] = useState(false);

  const handleTrim = async () => {
    if (startTime >= endTime) {
      alert('Start time must be less than end time');
      return;
    }

    if (endTime > videoDuration) {
      alert('End time cannot exceed video duration');
      return;
    }

    setIsTrimming(true);

    try {
      const file = new File([videoBlob], 'recording.webm', { type: 'video/webm' });
      const trimmedBlob = await trimVideo(file, startTime, endTime);
      onTrimComplete(trimmedBlob);
    } catch (error) {
      console.error('Trimming error:', error);
      alert('Failed to trim video. Please try again.');
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Trim Video</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time (seconds)
          </label>
          <input
            type="number"
            min="0"
            max={videoDuration}
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTrimming}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time (seconds)
          </label>
          <input
            type="number"
            min="0"
            max={videoDuration}
            value={endTime}
            onChange={(e) => setEndTime(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTrimming}
          />
        </div>

        <p className="text-sm text-gray-600">
          Video duration: {Math.floor(videoDuration)} seconds
        </p>

        <button
          onClick={handleTrim}
          disabled={isTrimming}
          className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isTrimming ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Trimming...</span>
            </>
          ) : (
            <>
              <Scissors size={20} />
              <span>Export Trimmed Video</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}