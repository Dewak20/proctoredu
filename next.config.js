/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [] },
  typescript: {
    // Type errors are caught in CI; allow prod build to complete
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
