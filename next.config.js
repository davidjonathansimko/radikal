/** @type {import('next').NextConfig} */

// Security Headers for HTTPS, XSS Protection, etc.
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; media-src 'self' blob: data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com; frame-ancestors 'self'; worker-src 'self' blob:;"
  }
];

const nextConfig = {
  // Image Optimization Configuration
  images: {
    // Modern image formats
    formats: ['image/avif', 'image/webp'],
    
    // Remote patterns for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vlruttwglidjmnyoivqr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Cache control
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Security Headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
  // Rewrites for cleaner URLs (optional)
  async rewrites() {
    return [
      // Add any URL rewrites here if needed
    ];
  },

  // Redirects
  async redirects() {
    return [
      // Redirect old URLs to new ones if needed
    ];
  },
  
  // Compress responses
  compress: true,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Power by header (hide for security)
  poweredByHeader: false,
  
  // React strict mode for development
  reactStrictMode: true,
  
  // Optimize react-icons tree-shaking and reduce bundle size
  // Optimiert react-icons Tree-Shaking und reduziert Bündelgröße
  modularizeImports: {
    'react-icons/fa': {
      transform: 'react-icons/fa/{{member}}',
    },
    'react-icons/tfi': {
      transform: 'react-icons/tfi/{{member}}',
    },
    'react-icons/ci': {
      transform: 'react-icons/ci/{{member}}',
    },
  },
  
  // Experimental performance optimizations
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: ['react-icons', 'date-fns', 'gsap'],
  },
}

module.exports = nextConfig
