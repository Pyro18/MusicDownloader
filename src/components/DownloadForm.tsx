import React, { useState } from 'react';
import { AudioFormat, AudioQuality } from '../types';
import { Download, Music, Settings } from 'lucide-react';

interface DownloadFormProps {
  onDownload: (url: string, format: AudioFormat, quality: AudioQuality) => void;
  isLoading: boolean;
  defaultFormat?: AudioFormat;
  defaultQuality?: AudioQuality;
}

export const DownloadForm: React.FC<DownloadFormProps> = ({ onDownload, isLoading, defaultFormat = 'mp3', defaultQuality = '320k' }) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<AudioFormat>(defaultFormat);
  const [quality, setQuality] = useState<AudioQuality>(defaultQuality);

  // Update state when defaults change (e.g. loaded from config)
  React.useEffect(() => {
    setFormat(defaultFormat);
    setQuality(defaultQuality);
  }, [defaultFormat, defaultQuality]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onDownload(url, format, quality);
      setUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <div className="space-y-2">
        <label htmlFor="url" className="block text-sm font-medium text-gray-200">
          URL Spotify o YouTube
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Music className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="url"
            className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Incolla URL traccia o playlist Spotify/YouTube..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="format" className="block text-sm font-medium text-gray-200">
            Formato
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Settings className="h-4 w-4 text-gray-400" />
             </div>
            <select
              id="format"
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value as AudioFormat)}
              disabled={isLoading}
            >
              <option value="mp3">MP3</option>
              <option value="flac">FLAC</option>
              <option value="ogg">OGG</option>
              <option value="opus">OPUS</option>
              <option value="m4a">M4A</option>
              <option value="wav">WAV</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="quality" className="block text-sm font-medium text-gray-200">
            Qualità
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Settings className="h-4 w-4 text-gray-400" />
             </div>
            <select
              id="quality"
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={quality}
              onChange={(e) => setQuality(e.target.value as AudioQuality)}
              disabled={isLoading}
            >
              <option value="320k">320 kbps (Alta)</option>
              <option value="256k">256 kbps</option>
              <option value="192k">192 kbps (Media)</option>
              <option value="128k">128 kbps (Bassa)</option>
              <option value="auto">Auto</option>
              <option value="disable">Disabilita conversione</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Elaborazione...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Scarica
          </>
        )}
      </button>
    </form>
  );
};
