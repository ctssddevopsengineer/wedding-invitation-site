import { withBasePath } from './public-path.mjs';

export const MUSIC_STORAGE_KEY = 'sd-invitation-music-muted-v1';
export const introMusic = '/audio/intro.mp3';
export const themeMusic = Object.freeze({
  classic: '/audio/classic.mp3',
  blush: '/audio/blush.mp3',
  magenta: '/audio/magenta.mp3',
  navy: '/audio/navy.mp3',
  plum: '/audio/plum.mp3',
  saffron: '/audio/saffron.mp3'
});

export const MUSIC_SETTINGS = Object.freeze({ volume: 0.32, fadeSeconds: 0.9, pauseSeconds: 0.3, loopBlendSeconds: 0.35, loadTimeoutMs: 20000 });

export function musicPath(themeId, introActive) {
  return withBasePath(introActive ? introMusic : Object.hasOwn(themeMusic, themeId) ? themeMusic[themeId] : themeMusic.classic);
}

export function readMusicMuted(storage) {
  try { return storage.getItem(MUSIC_STORAGE_KEY) === 'true'; } catch { return false; }
}

// Overlap the tail with the head once, then let the audio clock loop the buffer.
// This avoids MP3 element restart gaps and waveform clicks without changing files.
export function prepareMusicLoop(context, buffer) {
  const overlap = Math.min(Math.round(buffer.sampleRate * MUSIC_SETTINGS.loopBlendSeconds), Math.floor(buffer.length / 4));
  if (overlap < 2) return buffer;
  const length = buffer.length - overlap;
  const loop = context.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const input = buffer.getChannelData(channel);
    const output = loop.getChannelData(channel);
    output.set(input.subarray(overlap));
    for (let i = 0; i < overlap; i++) {
      const mix = i / (overlap - 1);
      output[length - overlap + i] = input[length + i] * (1 - mix) + input[i] * mix;
    }
  }
  return loop;
}
