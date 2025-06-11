
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Added for Google user profile images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bvbmmmdynvjqrajzlayw.supabase.co', // Added for Supabase Storage
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com', // Added for new logo/favicon image
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
