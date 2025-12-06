# Music Downloader

A cross-platform desktop application to download music from Spotify and YouTube, built with Tauri v2, React, TypeScript, and Rust.

## Features

- Download tracks, albums, and playlists from Spotify and YouTube
- Select audio format (MP3, FLAC, OGG)
- Select audio quality (320kbps, 192kbps, 128kbps)
- Real-time progress tracking
- Download history
- Dark mode UI
- Cross-platform (Windows, macOS, Linux)

## Prerequisites

- **Node.js** (v16 or later)
- **Rust** (latest stable)
- **spotdl** (Python tool)
  - Install via pip: `pip install spotdl`
  - Ensure `spotdl` is in your system PATH
- **FFmpeg** (required by spotdl)
  - Install instructions: https://spotdl.readthedocs.io/en/latest/installation/

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the development server:
   ```bash
   pnpm tauri dev
   ```

## Build

To build the application for production:

```bash
pnpm tauri build
```

The executable will be located in `src-tauri/target/release/bundle/`.

## Project Structure

- `src/`: Frontend React application
  - `components/`: UI components
  - `types/`: TypeScript definitions
  - `App.tsx`: Main application logic
- `src-tauri/`: Backend Rust application
  - `src/commands.rs`: Tauri commands implementation
  - `src/lib.rs`: Tauri application entry point
  - `tauri.conf.json`: Tauri configuration

## License

MIT
