/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    forceSwcTransforms: true,
  },
  // Suppress build errors for static generation
  // Our app uses client-side authentication and context
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mahala.digital',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig