import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { createMusicPlayer } from '../lib/music-player.mjs';
import { introMusic, themeMusic, musicPath, prepareMusicLoop, readMusicMuted, MUSIC_SETTINGS } from '../lib/music.mjs';
import { THEME_IDS } from '../lib/theme.mjs';

const flush = () => new Promise((resolve) => setImmediate(resolve));
function buffer(channels = 2, length = 4000, sampleRate = 1000) {
  const data = Array.from({ length: channels }, () => new Float32Array(length).fill(.25));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (channel) => data[channel] };
}
function harness(t, { muted = false, fetchAudio } = {}) {
  const requests = [], gains = [], sources = [], states = [], preferences = [];
  let contexts = 0;
  const context = {
    currentTime: 2, state: 'suspended', destination: {},
    resume() { this.state = 'running'; return Promise.resolve(); },
    suspend() { this.state = 'suspended'; return Promise.resolve(); },
    close() { this.state = 'closed'; return Promise.resolve(); },
    createBuffer: buffer,
    decodeAudioData: async () => buffer(),
    createGain() {
      const gain = { value: 0, ramps: [], cancelAndHoldAtTime() {}, linearRampToValueAtTime(value, time) { this.ramps.push({ value, time }); } };
      const node = { gain, connect() {}, disconnect() {} };
      gains.push(node);
      return node;
    },
    createBufferSource() {
      const source = { starts: 0, stops: [], connect() {}, disconnect() {}, start() { this.starts++; }, stop(time) { this.stops.push(time); } };
      sources.push(source);
      return source;
    }
  };
  const player = createMusicPlayer({
    muted,
    createContext: () => { contexts++; return context; },
    fetchAudio: (path, options) => { requests.push(path); return fetchAudio ? fetchAudio(path, options) : Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }); },
    onChange: (state) => states.push(state), onMuteChange: (value) => preferences.push(value)
  });
  t.after(() => player.dispose());
  return { player, context, requests, sources, gains, states, preferences, contexts: () => contexts };
}

test('all six themes and the intro have real local MP3s; mute storage is defensive', () => {
  assert.deepEqual(Object.keys(themeMusic), THEME_IDS);
  for (const path of [introMusic, ...Object.values(themeMusic)]) assert.ok(fs.statSync(new URL(`../public${path}`, import.meta.url)).size > 1000);
  assert.equal(musicPath('missing', false), themeMusic.classic);
  assert.equal(musicPath('__proto__', false), themeMusic.classic);
  assert.equal(readMusicMuted({ getItem: () => 'true' }), true);
  assert.equal(readMusicMuted({ getItem() { throw new Error(); } }), false);
});

test('music paths support repository-scoped GitHub Pages hosting', () => {
  const result = execFileSync(process.execPath, ['--input-type=module', '-e', "import { musicPath } from './lib/music.mjs'; console.log(musicPath('navy', false)); console.log(musicPath('navy', true));"], {
    cwd: new URL('..', import.meta.url), env: { ...process.env, NEXT_PUBLIC_BASE_PATH: '/wedding-invitation-site' }, encoding: 'utf8'
  });
  assert.equal(result.trim(), '/wedding-invitation-site/audio/navy.mp3\n/wedding-invitation-site/audio/intro.mp3');
});

test('no audio context or request before interaction, including deep links and theme changes', async (t) => {
  const h = harness(t);
  h.player.setScene('navy', false);
  h.player.setScene('plum', false);
  h.player.setHidden(true);
  h.player.setHidden(false);
  await flush();
  assert.equal(h.contexts(), 0);
  assert.deepEqual(h.requests, []);
  h.player.toggle();
  assert.equal(h.contexts(), 1, 'context is created synchronously in the gesture');
  await flush();
  assert.deepEqual(h.requests, [themeMusic.plum]);
});

test('Open starts intro; completion crossfades once; page-equivalent updates never restart music', async (t) => {
  const h = harness(t);
  h.player.openIntro();
  await flush();
  assert.deepEqual(h.requests, [introMusic]);
  h.player.setScene('blush', false);
  await flush();
  assert.deepEqual(h.requests, [introMusic, themeMusic.blush]);
  assert.equal(h.sources[0].stops[0], h.context.currentTime + MUSIC_SETTINGS.fadeSeconds);
  assert.equal(h.sources[1].loop, true);
  for (let page = 0; page < 4; page++) h.player.setScene('blush', false);
  await flush();
  assert.equal(h.sources.length, 2);
  assert.equal(h.gains[2].gain.ramps.at(-1).value, 1);
});

test('mute fades then suspends; unmute resumes the same source without downloading or restarting', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t);
  h.player.openIntro();
  await flush();
  h.player.toggle();
  assert.equal(h.context.state, 'running');
  assert.deepEqual(h.gains[0].gain.ramps.at(-1), { value: 0, time: 2 + MUSIC_SETTINGS.pauseSeconds });
  t.mock.timers.tick(301);
  assert.equal(h.context.state, 'suspended');
  h.player.toggle();
  await flush();
  assert.equal(h.context.state, 'running');
  assert.equal(h.sources.length, 1);
  assert.deepEqual(h.preferences, [true, false]);
  h.player.toggle();
  h.player.toggle();
  t.mock.timers.tick(301);
  await flush();
  assert.equal(h.context.state, 'running', 'cancelled fade-out must not pause an unmute');
});

test('remembered mute prevents downloads on Open; hidden/pagehide pause and resume preserve source', async (t) => {
  const h = harness(t, { muted: true });
  h.player.openIntro();
  await flush();
  assert.equal(h.contexts(), 0);
  h.player.toggle();
  await flush();
  h.player.setHidden(true, true);
  assert.equal(h.context.state, 'suspended');
  h.player.setHidden(false);
  await flush();
  assert.equal(h.sources.length, 1);
  assert.equal(h.context.state, 'running');
});

test('late requests cannot play after mute or a newer theme selection', async (t) => {
  const held = [];
  const h = harness(t, { fetchAudio: (path, options) => new Promise((resolve) => held.push({ path, options, resolve })) });
  h.player.openIntro();
  await flush();
  h.player.setScene('navy', false);
  await flush();
  assert.equal(held[0].options.signal.aborted, true);
  const response = { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  held[0].resolve(response);
  held[1].resolve(response);
  await flush();
  assert.equal(h.sources.length, 1);
  h.player.setScene('saffron', false);
  await flush();
  h.player.toggle();
  held[2].resolve(response);
  await flush();
  assert.equal(h.sources.length, 1);
  assert.equal(h.states.at(-1).muted, true);
});

test('failed downloads and rejected resume are retryable without breaking navigation', async (t) => {
  let fail = true;
  const h = harness(t, { fetchAudio: async () => ({ ok: !fail, arrayBuffer: async () => new ArrayBuffer(8) }) });
  h.player.openIntro();
  await flush();
  assert.equal(h.states.at(-1).status, 'error');
  h.context.state = 'suspended';
  h.context.onstatechange();
  assert.equal(h.states.at(-1).status, 'error', 'suspending failed playback preserves the retry state');
  fail = false;
  h.player.toggle();
  await flush();
  assert.equal(h.states.at(-1).status, 'playing');
  h.context.resume = () => Promise.reject(new Error('NotAllowedError'));
  h.player.setScene('navy', false);
  await flush();
  assert.equal(h.states.at(-1).status, 'error');
});

test('replay waits at the closed envelope; opening switches to intro again', async (t) => {
  const h = harness(t);
  h.player.setScene('navy', false);
  h.player.toggle();
  await flush();
  h.player.setScene('navy', true);
  await flush();
  assert.deepEqual(h.requests, [themeMusic.navy]);
  h.player.openIntro();
  await flush();
  assert.deepEqual(h.requests, [themeMusic.navy, introMusic]);
});

test('stalled decoding times out and its eventual result cannot start playback', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = harness(t);
  let finishDecode;
  h.context.decodeAudioData = () => new Promise((resolve) => { finishDecode = resolve; });
  h.player.openIntro();
  await flush();
  t.mock.timers.tick(MUSIC_SETTINGS.loadTimeoutMs);
  assert.equal(h.states.at(-1).status, 'error');
  finishDecode(buffer());
  await flush();
  assert.equal(h.sources.length, 0);
});

test('disposing aborts downloads, closes the context and ignores late results', async (t) => {
  let finish, signal;
  const h = harness(t, { fetchAudio: (_, options) => { signal = options.signal; return new Promise((resolve) => { finish = resolve; }); } });
  h.player.openIntro();
  await flush();
  h.player.dispose();
  assert.equal(signal.aborted, true);
  assert.equal(h.context.state, 'closed');
  finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  await flush();
  assert.equal(h.sources.length, 0);
});

test('loop overlap joins head and tail without silence, preserving channels and source samples', () => {
  const input = buffer();
  const original = input.getChannelData(0).slice();
  const loop = prepareMusicLoop({ createBuffer: buffer }, input);
  assert.equal(loop.numberOfChannels, 2);
  assert.equal(loop.length, 3650);
  assert.ok(loop.getChannelData(0).every((sample) => sample === .25));
  assert.deepEqual(input.getChannelData(0), original);
});
