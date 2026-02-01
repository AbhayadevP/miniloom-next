// src/app/share/[id]/page.tsx - FIXED VERSION
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Eye, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface VideoData {
  id: string;
  filename: string;
  filepath: string;
  duration: number;
  views: number;
  avgCompletion: number;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const videoId = params?.id as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewTrackedRef = useRef(false);
  const lastWatchTimeRef = useRef(0);

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      console.log('🔍 Fetching video with ID:', videoId);
      
      if (!videoId) {
        console.error('❌ No video ID provided');
        setError('No video ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Making request to:', `/api/videos/${videoId}`);
        const response = await fetch(`/api/videos/${videoId}`);
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Response not OK:', errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Video not found`);
        }

        const data = await response.json();
        console.log('✅ Video data received:', data);
        setVideo(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load video';
        console.error('❌ Fetch error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    } else {
      setError('No video ID in URL');
      setLoading(false);
    }
  }, [videoId]);

  // Track view (only once per session)
  useEffect(() => {
    if (video && !viewTrackedRef.current) {
      console.log('👁️ Tracking view for video:', video.id);
      fetch('/api/analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('✅ View tracked:', data);
          viewTrackedRef.current = true;
          // Update local view count
          setVideo(prev => prev ? { ...prev, views: prev.views + 1 } : null);
        })
        .catch(err => console.error('❌ Failed to track view:', err));
    }
  }, [video]);

  // Track watch time
  const trackWatchTime = async () => {
    if (!videoRef.current || !video) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    // Only track if user watched at least 1 second more
    if (currentTime - lastWatchTimeRef.current >= 1) {
      lastWatchTimeRef.current = currentTime;

      try {
        await fetch('/api/analytics/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            watchedDuration: currentTime,
            totalDuration: duration,
          }),
        });
      } catch (err) {
        console.error('Failed to track watch time:', err);
      }
    }
  };

  // Set up event listeners for video
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      trackWatchTime();
    };

    const handleEnded = () => {
      trackWatchTime();
    };

    const handlePause = () => {
      trackWatchTime();
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [video]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-600">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-lg">Loading video...</span>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="text-red-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">Error</h2>
          <p className="text-gray-700 text-center mb-4">
            {error || 'Video not found'}
          </p>
          <div className="text-sm text-gray-500 text-center">
            <p>Video ID: {videoId || 'Not provided'}</p>
          </div>
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              ← Go back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Video Player */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={video.filepath}
              controls
              className="w-full"
              controlsList="nodownload"
              onError={(e) => {
                console.error('❌ Video playback error:', e);
                setError(`Failed to load video file: ${video.filepath}`);
              }}
            />
          </div>

          {/* Video Info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Shared Recording
            </h1>

            {/* Analytics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-600 mb-2">
                  <Eye size={20} />
                  <span className="font-medium">Views</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">{video.views}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <TrendingUp size={20} />
                  <span className="font-medium">Avg Completion</span>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {video.avgCompletion}%
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Duration:</span>{' '}
                {Math.floor(video.duration)} seconds
              </p>
              <p>
                <span className="font-medium">Uploaded:</span>{' '}
                {new Date(video.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your own recording →
          </a>
        </div>
      </div>
    </div>
  );
}