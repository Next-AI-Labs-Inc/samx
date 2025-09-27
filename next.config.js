/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration for open source builds
  eslint: {
    // Ignore ESLint errors during production builds
    // Contributors can run `npm run lint` separately to check for issues
    ignoreDuringBuilds: true,
  },
  
  // Support for large government dataset uploads
  experimental: {
    // Increase body size limit for large CSV files
    isrMemoryCacheSize: 0, // Disable ISR memory cache for large uploads
  },
  
  // API route configuration
  api: {
    bodyParser: {
      sizeLimit: '1gb', // Allow up to 1GB uploads for government data
    },
    responseLimit: false,
  },

  // Performance optimizations for large data processing
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Increase memory limit for server-side processing
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3'
      });
    }
    return config;
  },
};

module.exports = nextConfig;