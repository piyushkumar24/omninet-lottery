/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Fix for dynamic server usage in admin routes
  output: 'standalone', // Use standalone output for better deployment performance
  
  // Optimize for serverless environment
  experimental: {
    serverMinification: true,
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Optimize for Prisma in serverless environment
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.optimization.moduleIds = 'deterministic';
    }
    return config;
  },
}

module.exports = nextConfig
