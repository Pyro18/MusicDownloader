import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { DownloadForm } from './components/DownloadForm';
import { DownloadHistory } from './components/DownloadHistory';
import { Settings as SettingsView } from './components/Settings';
import { DownloadItem, AudioFormat, AudioQuality, ProgressPayload, AppConfig } from './types';
import { FolderOpen, AlertTriangle, Settings } from 'lucide-react';

function App() {
  const [isSpotdlInstalled, setIsSpotdlInstalled] = useState<boolean | null>(null);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    checkSpotdl();
    loadConfig();
    loadHistory();
    checkForUpdates();
    
    const unlisten = listen<ProgressPayload>('download-progress', (event) => {
      const { percentage, message } = event.payload;
      setDownloads(prev => prev.map(item => {
        if (item.status === 'downloading') {
          return { ...item, progress: percentage, message };
        }
        return item;
      }));
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await invoke<AppConfig>('get_config');
      setConfig(cfg);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update?.available) {
        const yes = await ask(
          `È disponibile una nuova versione di Music Downloader: ${update.version}\nVuoi scaricarla e installarla ora?`, 
          { title: 'Aggiornamento Disponibile', kind: 'info' }
        );
        if (yes) {
          await update.downloadAndInstall();
          // Restart the app after the update is installed
          await invoke('plugin:process|restart');
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await invoke<DownloadItem[]>('get_history');
      setDownloads(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await invoke('save_config', { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const checkSpotdl = async () => {
    try {
      const installed = await invoke<boolean>('check_spotdl_installed');
      setIsSpotdlInstalled(installed);
    } catch (error) {
      console.error('Failed to check spotdl:', error);
      setIsSpotdlInstalled(false);
    }
  };

  const installSpotdl = async () => {
    setIsInstalling(true);
    setInstallError(null);
    try {
      await invoke('install_spotdl');
      await checkSpotdl();
    } catch (error) {
      setInstallError(String(error));
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDownload = async (url: string, format: AudioFormat, quality: AudioQuality) => {
    if (!isSpotdlInstalled) return;

    const id = Date.now().toString();
    const newItem: DownloadItem = {
      id,
      url,
      format,
      quality,
      status: 'downloading',
      progress: 0,
      timestamp: Date.now(),
      message: 'Avvio download...'
    };

    setDownloads(prev => [newItem, ...prev]);
    setIsDownloading(true);

    try {
      await invoke('download_track', { 
        url, 
        format, 
        quality,
        download_path: config?.download_path 
      });
      
      setDownloads(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'completed', progress: 100, message: 'Fatto' } : item
      ));
      // Reload history to get the new item with correct timestamp/id from backend if needed,  
      // but we optimistically updated. Maybe just reload history on next mount or if user asks.
      // Actually, backend adds to history. We should probably reload history here to be in sync.
      loadHistory();
    } catch (error) {
      setDownloads(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'error', error: String(error) } : item
      ));
    } finally {
      setIsDownloading(false);
    }
  };

  const openDownloadsFolder = async () => {
    try {
      await invoke('open_downloads_folder', { path: config?.download_path });
    } catch (error) {
      console.error('Failed to open downloads folder:', error);
    }
  };

  if (showSettings && config) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
        <div className="max-w-2xl mx-auto">
          <SettingsView
            config={config}
            onSave={saveConfig}
            onBack={() => setShowSettings(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Music Downloader
            </h1>
            <p className="text-gray-400 mt-1">Scarica musica da Spotify e YouTube</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Impostazioni"
            >
              <Settings className="h-6 w-6" />
            </button>
            <button
              onClick={openDownloadsFolder}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              title="Apri Cartella Download"
            >
              <FolderOpen className="h-6 w-6" />
            </button>
          </div>
        </header>

        {isSpotdlInstalled === false && (
          <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-lg flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-500">spotdl non trovato</h3>
                <p className="text-sm text-yellow-200/80 mt-1">
                  L'applicazione richiede <code>spotdl</code> per funzionare.
                </p>
              </div>
            </div>
            
            <div className="pl-8">
              <button 
                onClick={installSpotdl}
                disabled={isInstalling}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isInstalling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Installazione di spotdl in corso...
                  </>
                ) : (
                  'Installa spotdl automaticamente'
                )}
              </button>
              {installError && (
                <div className="mt-2 p-2 bg-red-900/50 rounded text-xs text-red-200 border border-red-800">
                  <p className="font-bold">Errore di installazione:</p>
                  <p>{installError}</p>
                  <p className="mt-1 opacity-75">Prova a installare Python manualmente da python.org e assicurati che "Add Python to PATH" sia selezionato.</p>
                </div>
              )}
            </div>
          </div>
        )}

        <main className="space-y-8">
          <DownloadForm 
            onDownload={handleDownload} 
            isLoading={isDownloading || !isSpotdlInstalled}
            defaultFormat={config?.audio_format}
            defaultQuality={config?.audio_quality}
          />
          <DownloadHistory items={downloads} />
        </main>
      </div>
    </div>
  );
}

export default App;