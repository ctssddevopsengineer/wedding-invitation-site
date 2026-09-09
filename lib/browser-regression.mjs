export const SUPPORTED_BROWSER_ENGINES = Object.freeze(['chromium', 'firefox', 'webkit']);

export function resolveBrowserTarget(env = process.env) {
  const engine = String(env.BROWSER_ENGINE || 'chromium').trim().toLowerCase();
  const channel = String(env.BROWSER_CHANNEL || '').trim();

  if (!SUPPORTED_BROWSER_ENGINES.includes(engine)) {
    throw new Error(`Unsupported browser engine: ${engine}. Expected one of: ${SUPPORTED_BROWSER_ENGINES.join(', ')}`);
  }

  if (channel && engine !== 'chromium') {
    throw new Error(`Browser channel "${channel}" can only be used with the chromium engine.`);
  }

  return Object.freeze({
    engine,
    channel: channel || null,
    label: channel ? `${engine}:${channel}` : engine
  });
}
