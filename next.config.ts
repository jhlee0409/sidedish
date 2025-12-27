import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Image optimization for Core Web Vitals (LCP)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize layout shift (CLS)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compression for better performance
  compress: true,

  // Optimize package imports for smaller bundles (INP improvement)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'sonner',
      '@hookform/resolvers',
      'react-hook-form',
    ],
  },

  // Security headers for SEO and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // Static assets caching
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Manifest and icons
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },

  // Redirects for SEO (trailing slash normalization)
  async redirects() {
    return [
      // Normalize trailing slashes
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ]
  },

  // Powered by header removal
  poweredByHeader: false,

  // React strict mode for better development
  reactStrictMode: true,

  // Output configuration for optimal deployment
  output: 'standalone',
}

export default nextConfig
