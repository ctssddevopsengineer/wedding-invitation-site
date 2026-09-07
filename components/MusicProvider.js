'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMusicPlayer } from '@/lib/music-player.mjs';
import { MUSIC_STORAGE_KEY, readMusicMuted } from '@/lib/music.mjs';

const MusicContext = createContext(null);

export function MusicProvider({ themeId, introActive, children }) {
  const player = useRef(null);
  const [state, setState] = useState({ status: 'idle', muted: false, ready: false });

  useEffect(() => {
    let muted = false;
    try { muted = readMusicMuted(window.sessionStorage); } catch { /* Storage may be disabled. */ }
    const engine = createMusicPlayer({
      muted,
      createContext: () => new (window.AudioContext || window.webkitAudioContext)(),
      onChange: (next) => setState({ ...next, ready: true }),
      onMuteChange: (value) => {
        try { window.sessionStorage.setItem(MUSIC_STORAGE_KEY, String(value)); } catch { /* In-memory preference still works. */ }
      }
    });
    player.current = engine;
    setState({ status: muted ? 'muted' : 'idle', muted, ready: true });
    const visibility = () => engine.setHidden(document.hidden);
    const pagehide = () => engine.setHidden(true, true);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pagehide);
    window.addEventListener('pageshow', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', visibility);
      player.current = null;
      engine.dispose();
    };
  }, []);

  useEffect(() => { player.current?.setScene(themeId, introActive); }, [themeId, introActive]);

  return (
    <MusicContext.Provider value={{ ...state, introActive, openIntro: () => player.current?.openIntro(), toggle: () => player.current?.toggle() }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() { return useContext(MusicContext); }
