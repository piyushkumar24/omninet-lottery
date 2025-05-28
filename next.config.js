/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    // Optimize image loading
    minimumCacheTTL: 60,
  },
  
  // Production optimizations
  output: 'standalone', // Use standalone output for better deployment performance
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  
  // Optimize for serverless environment
  experimental: {
    serverMinification: true,
    optimizeCss: true, // Enable CSS optimization
    optimizeServerReact: true, // Optimize server-side React rendering
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Optimize for Prisma in serverless environment
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization.moduleIds = 'deterministic';
    }
    
    // Add production optimizations
    if (process.env.NODE_ENV === 'production') {
      // Enable tree shaking and other optimizations
      config.optimization.usedExports = true;
      
      // Add additional minimizer options
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true, // Remove console logs in production
                pure_funcs: ['console.debug', 'console.log', 'console.info'],
              },
            };
          }
        });
      }
    }
    
    return config;
  },
  
  // Environment variable handling
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Deployment settings
  eslint: {
    ignoreDuringBuilds: true, // Don't fail build on ESLint warnings
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  },
  
  // Optimize React for production
  reactStrictMode: true,
}

module.exports = nextConfig
