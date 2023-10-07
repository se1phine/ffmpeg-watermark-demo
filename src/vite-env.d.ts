/// <reference types="vite/client" />
import { FFmpeg } from '@ffmpeg/ffmpeg'

// window.ffmpeg

declare global {
  interface Window {
    ffmpeg: FFmpeg;
  }
}
