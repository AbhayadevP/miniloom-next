// src/components/UploadPanel.tsx
'use client';

import { useState } from 'react';
import { Upload, Loader2, Copy, CheckCircle } from 'lucide-react';

interface UploadPanelProps {
  videoBlob: Blob;
  videoDuration: number;
}

export default function UploadPanel({ videoBlob, videoDuration }: UploadPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('video', videoBlob, 'recording.webm');
      formData.append('duration', videoDuration.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const fullLink = `${window.location.origin}/share/${data.id}`;
      setShareLink(fullLink);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Upload & Share</h3>
      
      {!shareLink ? (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={20} />
              <span>Upload Video</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle size={20} />
            <span className="font-medium">Video uploaded successfully!</span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Share this link:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}