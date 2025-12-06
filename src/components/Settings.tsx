import React from 'react';
import { ArrowLeft, Github, FolderOpen } from 'lucide-react';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { AppConfig } from '../types';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave, onBack }) => {
  
  const handleFolderSelect = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath: config.download_path || undefined,
      });
      
      if (selected && typeof selected === 'string') {
        onSave({ ...config, download_path: selected });
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleChange = (key: keyof AppConfig, value: any) => {
    onSave({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200 pb-10">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          title="Back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white">Impostazioni</h2>
      </div>

      {/* General Settings */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
        <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Generale</h3>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Posizione Download
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={config.download_path || 'Predefinito (Cartella Download)'}
              readOnly
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleFolderSelect}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Cambia</span>
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Scegli dove salvare i tuoi file musicali.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Formato Predefinito</label>
            <select
              value={config.audio_format}
              onChange={(e) => handleChange('audio_format', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mp3">MP3</option>
              <option value="flac">FLAC</option>
              <option value="ogg">OGG</option>
              <option value="opus">OPUS</option>
              <option value="m4a">M4A</option>
              <option value="wav">WAV</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Qualità Predefinita</label>
            <select
              value={config.audio_quality}
              onChange={(e) => handleChange('audio_quality', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Auto</option>
              <option value="320k">320 kbps (Alta)</option>
              <option value="256k">256 kbps</option>
              <option value="192k">192 kbps (Media)</option>
              <option value="128k">128 kbps (Bassa)</option>
              <option value="disable">Disabilita conversione</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Modello Output</label>
            <input
              type="text"
              value={config.output_template}
              onChange={(e) => handleChange('output_template', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="{artist} - {title}.{ext}"
            />
            <p className="text-xs text-gray-500">
              Variabili: {'{artist}, {title}, {album}, {ext}, {track-number}, {year}'}
            </p>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
        <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Avanzate</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">SponsorBlock</label>
              <p className="text-xs text-gray-500">Salta segmenti non musicali nei video YouTube</p>
            </div>
            <input
              type="checkbox"
              checked={config.use_sponsor_block}
              onChange={(e) => handleChange('use_sponsor_block', e.target.checked)}
              className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Genera Playlist M3U</label>
              <p className="text-xs text-gray-500">Crea un file playlist per le tracce scaricate</p>
            </div>
            <input
              type="checkbox"
              checked={config.generate_m3u}
              onChange={(e) => handleChange('generate_m3u', e.target.checked)}
              className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Genera Testi LRC</label>
              <p className="text-xs text-gray-500">Scarica file testi sincronizzati</p>
            </div>
            <input
              type="checkbox"
              checked={config.generate_lrc}
              onChange={(e) => handleChange('generate_lrc', e.target.checked)}
              className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Forza Aggiornamento Metadati</label>
              <p className="text-xs text-gray-500">Aggiorna metadati per file esistenti</p>
            </div>
            <input
              type="checkbox"
              checked={config.force_update_metadata}
              onChange={(e) => handleChange('force_update_metadata', e.target.checked)}
              className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
           <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Thread</label>
            <input
              type="number"
              min="1"
              max="16"
              value={config.threads}
              onChange={(e) => handleChange('threads', parseInt(e.target.value) || 4)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <p className="text-xs text-gray-500">Numero di download paralleli</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
        <h3 className="text-lg font-semibold text-white">Crediti</h3>
        <div className="flex items-center space-x-3 text-gray-300">
          <Github className="h-5 w-5" />
          <span>
            Creato da{' '}
            <button 
              onClick={() => openShell('https://github.com/Pyro18')}
              className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
            >
              Pyro18
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};
