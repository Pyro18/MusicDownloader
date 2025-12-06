export type AudioFormat = 'mp3' | 'flac' | 'ogg' | 'opus' | 'm4a' | 'wav';
export type AudioQuality = '320k' | '256k' | '192k' | '128k' | 'auto' | 'disable';

export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'error';

export interface DownloadItem {
  id: string;
  url: string;
  format: AudioFormat;
  quality: AudioQuality;
  status: DownloadStatus;
  progress: number;
  message?: string;
  title?: string;
  artist?: string;
  error?: string;
  timestamp: number;
}

export interface AppConfig {
  download_path: string | null;
  audio_format: AudioFormat;
  audio_quality: AudioQuality;
  use_sponsor_block: boolean;
  generate_m3u: boolean;
  generate_lrc: boolean;
  output_template: string;
  threads: number;
  force_update_metadata: boolean;
}

export interface ProgressPayload {
  percentage: number;
  message: string;
}
