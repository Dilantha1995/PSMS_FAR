/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    // Always refetch page data on client-side navigation (no stale tabs).
    staleTimes: { dynamic: 0, static: 0 },
  },
};
export default nextConfig;
