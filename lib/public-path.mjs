const RAW_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function normalizeBasePath(value = RAW_BASE_PATH) {
  if (!value || value === '/') return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
}

export const PUBLIC_BASE_PATH = normalizeBasePath();

export function withBasePath(path, basePath = PUBLIC_BASE_PATH) {
  if (!path) return path;
  const value = String(path);

  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value;

  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;

  if (!normalizedBasePath) return normalizedPath;
  if (normalizedPath === normalizedBasePath || normalizedPath.startsWith(`${normalizedBasePath}/`)) {
    return normalizedPath;
  }

  return `${normalizedBasePath}${normalizedPath}`;
}
