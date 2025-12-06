import React from 'react';
import { DownloadItem } from '../types';
import { CheckCircle, XCircle, Clock, Music } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface DownloadHistoryProps {
  items: DownloadItem[];
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Music className="mx-auto h-12 w-12 mb-2 opacity-50" />
        <p>Nessun download ancora</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-200 mb-4">Cronologia Download</h3>
      {items.map((item) => (
        <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex-shrink-0">
                {item.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {item.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                {item.status === 'downloading' && <Clock className="h-5 w-5 text-blue-500 animate-pulse" />}
                {item.status === 'queued' && <Clock className="h-5 w-5 text-gray-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {item.title || item.url}
                </p>
                {item.artist && (
                  <p className="text-xs text-gray-400 truncate">{item.artist}</p>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-400 whitespace-nowrap ml-2">
              {new Date(item.timestamp).toLocaleTimeString()}
            </div>
          </div>
          
          {item.status === 'downloading' && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{item.message || 'Scaricamento...'}</span>
                <span>{item.progress}%</span>
              </div>
              <ProgressBar progress={item.progress} className="h-1.5" />
            </div>
          )}

          {item.status === 'error' && (
            <p className="mt-1 text-xs text-red-400">{item.error || 'Download fallito'}</p>
          )}
          
          {item.status === 'completed' && (
             <p className="mt-1 text-xs text-green-400">Download completato</p>
          )}
        </div>
      ))}
    </div>
  );
};
