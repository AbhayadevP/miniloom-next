'use client';

import { useState } from 'react';
import { Upload, Loader2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadPanelProps {
  videoBlob: Blob;
  videoDuration: number;
}

export default function UploadPanel({ videoBlob, videoDuration }: UploadPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');

  const handleUpload = async () => {
    console.log('🚀 ===== UPLOAD STARTING =====');
    console.log('📊 Upload data:', {
      blobSize: videoBlob.size,
      blobType: videoBlob.type,
      videoDuration: videoDuration,
      isInfinity: videoDuration === Infinity,
      isValid: videoDuration > 0 && videoDuration !== Infinity
    });

    // Clear previous errors
    setErrorMessage('');
    setErrorDetails('');

    // Validate before upload
    if (videoDuration === Infinity) {
      const msg = 'Video duration is Infinity. The video metadata may not have loaded properly.';
      console.error('❌ Validation failed:', msg);
      setErrorMessage(msg);
      setErrorDetails('Please try reloading the trimmed video preview, or re-export the trimmed video.');
      alert(msg);
      return;
    }

    if (isNaN(videoDuration) || videoDuration <= 0) {
      const msg = `Invalid video duration: ${videoDuration}. Duration must be a positive number.`;
      console.error('❌ Validation failed:', msg);
      setErrorMessage(msg);
      setErrorDetails('Please make sure your trimmed video has a valid duration.');
      alert(msg);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('video', videoBlob, 'trimmed-recording.webm');
      formData.append('duration', videoDuration.toString());

      console.log('📤 Sending request to /api/upload...');
      console.log('📤 FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseText = await response.text();
      console.log('📥 Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}...`);
      }

      if (!response.ok) {
        console.error('❌ Upload failed with response:', data);
        const errorMsg = data.details || data.error || `Upload failed (${response.status})`;
        const errorDetail = data.details ? `Details: ${data.details}` : `Status: ${response.status} ${response.statusText}`;
        
        setErrorMessage(errorMsg);
        setErrorDetails(errorDetail);
        throw new Error(`${errorMsg} - ${errorDetail}`);
      }

      console.log('✅ Upload successful! Data:', data);
      
      if (!data.id) {
        throw new Error('Server response missing video ID');
      }
      
      const fullLink = `${window.location.origin}/share/${data.id}`;
      setShareLink(fullLink);
      
    } catch (error) {
      console.error('❌ ===== UPLOAD ERROR =====');
      console.error('Full error:', error);
      
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      const details = error instanceof Error ? error.stack || 'No additional details' : 'No error object';
      
      setErrorMessage(message);
      setErrorDetails(details);
      
      alert(`Upload failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidDuration = videoDuration > 0 && videoDuration !== Infinity && !isNaN(videoDuration);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Upload & Share</h3>
      
      {/* Debug info - show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
          <p className="font-medium text-gray-700">Debug Info:</p>
          <p>Duration: {videoDuration}</p>
          <p>Is Infinity: {videoDuration === Infinity ? 'Yes' : 'No'}</p>
          <p>Is Valid: {isValidDuration ? 'Yes' : 'No'}</p>
        </div>
      )}

      {!isValidDuration && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div>
              <p className="text-red-600 font-medium">
                ⚠️ Invalid video duration: {videoDuration}
              </p>
              <p className="text-red-600 text-sm mt-1">
                The video duration is not valid. This usually happens when the video hasn't fully loaded.
              </p>
              <p className="text-red-600 text-xs mt-2">
                Please wait for the trimmed video to load completely, or try re-exporting the trimmed video.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-red-600 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-600 font-medium mb-2">{errorMessage}</p>
              {errorDetails && (
                <details className="mt-2">
                  <summary className="text-red-600 text-sm cursor-pointer hover:underline">
                    View error details
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 text-red-800 text-xs rounded overflow-auto max-h-40">
                    {errorDetails}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {!shareLink ? (
        <div className="space-y-4">
          <button
            onClick={handleUpload}
            disabled={isUploading || !isValidDuration}
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
          
          {!isValidDuration && (
            <p className="text-sm text-gray-600 text-center">
              Wait for video to load before uploading...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
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
          
          <div className="text-center">
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 hover:text-blue-700 hover:underline"
            >
              ↗ Open share page in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}