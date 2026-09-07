import { MUSIC_SETTINGS, musicPath, prepareMusicLoop } from './music.mjs';

// One player per invitation, independent of page mounts and navigation.
export function createMusicPlayer({ createContext, fetchAudio = fetch, onChange = () => {}, onMuteChange = () => {}, muted = false }) {
  let context, master, current, abort, pauseTimer, loadTimer;
  let revision = 0, disposed = false, authorized = false, hidden = false;
  let themeId = 'classic', introActive = true, introOpened = false;
  let status = 'idle';
  const voices = new Set();
  const allowed = () => authorized && !muted && !hidden && (!introActive || introOpened);
  const publish = (next) => { status = next; if (!disposed) onChange({ status, muted }); };

  function ramp(param, value, seconds) {
    const now = context.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else { const held = param.value; param.cancelScheduledValues(now); param.setValueAtTime(held, now); }
    param.linearRampToValueAtTime(value, now + seconds);
  }

  function pause(immediate = false) {
    clearTimeout(pauseTimer);
    if (!context || context.state === 'closed') return;
    ramp(master.gain, 0, immediate ? 0 : MUSIC_SETTINGS.pauseSeconds);
    const suspend = () => { pauseTimer = null; void context.suspend().catch(() => {}); };
    if (immediate) suspend();
    else pauseTimer = setTimeout(suspend, MUSIC_SETTINGS.pauseSeconds * 1000);
  }

  function sync() {
    const ticket = ++revision;
    abort?.abort();
    abort = null;
    clearTimeout(loadTimer);
    clearTimeout(pauseTimer);
    pauseTimer = null;
    if (disposed) return;
    if (!allowed()) {
      pause();
      publish(muted ? 'muted' : !authorized || (introActive && !introOpened) ? 'idle' : 'paused');
      return;
    }
    const path = musicPath(themeId, introActive);
    try {
      if (!context) {
        // This path is first reached synchronously from Open/Play/Unmute.
        context = createContext();
        master = context.createGain();
        master.gain.value = 0;
        master.connect(context.destination);
        context.onstatechange = () => {
          if (disposed || !allowed() || status === 'error') return;
          if (context.state !== 'running') publish('paused');
          else if (current && status === 'paused') publish('playing');
        };
      }
      // Resume inside the gesture, before fetching or decoding the track.
      const resumed = context.resume();
      ramp(master.gain, MUSIC_SETTINGS.volume, MUSIC_SETTINGS.fadeSeconds);
      publish(current?.path === path ? 'playing' : 'loading');
      void load(path, ticket, resumed);
    } catch {
      publish('error');
    }
  }

  async function load(path, ticket, resumed) {
    const valid = () => !disposed && ticket === revision && allowed();
    const timeout = loadTimer = setTimeout(() => {
      if (!valid()) return;
      revision++;
      abort?.abort();
      pause();
      publish('error');
    }, MUSIC_SETTINGS.loadTimeoutMs);
    try {
      await resumed;
      if (!valid()) return;
      if (context.state !== 'running') { publish('paused'); return; }
      if (current?.path === path) { publish('playing'); return; }
      const controller = new AbortController();
      abort = controller;
      const response = await fetchAudio(path, { signal: controller.signal });
      if (!response.ok) throw new Error('Music unavailable');
      const bytes = await response.arrayBuffer();
      if (!valid()) return;
      const decoded = await context.decodeAudioData(bytes);
      if (!valid()) return;
      const source = context.createBufferSource();
      source.buffer = prepareMusicLoop(context, decoded);
      source.loop = true;
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(master);
      const voice = { path, source, gain };
      voices.add(voice);
      source.onended = () => { source.disconnect(); gain.disconnect(); voices.delete(voice); };
      source.start();
      ramp(gain.gain, 1, MUSIC_SETTINGS.fadeSeconds);
      if (current) {
        ramp(current.gain.gain, 0, MUSIC_SETTINGS.fadeSeconds);
        current.source.stop(context.currentTime + MUSIC_SETTINGS.fadeSeconds);
      }
      current = voice;
      publish('playing');
    } catch {
      if (valid()) { pause(); publish('error'); }
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    setScene(nextTheme, nextIntro) {
      if (themeId === nextTheme && introActive === nextIntro) return;
      if (nextIntro !== introActive) introOpened = false;
      themeId = nextTheme;
      introActive = nextIntro;
      sync();
    },
    openIntro() { introOpened = true; authorized = true; sync(); },
    toggle() {
      if (introActive && !introOpened) muted = !muted;
      else if (muted || !authorized || status === 'error' || status === 'paused') { muted = false; authorized = true; }
      else muted = true;
      onMuteChange(muted);
      sync();
    },
    setHidden(value, immediate = false) {
      hidden = value;
      sync();
      if (value && immediate) pause(true);
    },
    dispose() {
      disposed = true;
      revision++;
      abort?.abort();
      clearTimeout(pauseTimer);
      clearTimeout(loadTimer);
      for (const { source, gain } of voices) { source.stop(); source.disconnect(); gain.disconnect(); }
      voices.clear();
      current = null;
      if (context) { context.onstatechange = null; void context.close().catch(() => {}); }
    }
  };
}
