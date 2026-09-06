/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep this as an explicit key/value pair. GitHub's configure-pages action
  // rewrites `basePath` in Next.js config files and can corrupt object-property
  // shorthand (`basePath,`) into an invalid string entry.
  basePath: basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true }
};

export default nextConfig;
